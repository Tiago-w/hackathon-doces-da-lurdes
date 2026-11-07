import 'server-only';
/**
 * Carrega do banco o que as regras de negócio precisam (config, sabores, bairros, agenda de caixas).
 * Usado por loja.ts dentro e fora de transações.
 */
import { and, asc, eq, gte, lte, ne, sql } from 'drizzle-orm';
import type { Db, Tx } from '@/lib/db';
import { schema as s } from '@/lib/db';
import { partesEmPelotas, somarDias } from '@/lib/datas';
import { ErroNegocio } from '@/lib/erros';
import { JANELA_DIAS, type ContextoPedido } from '@/lib/regras';

type Executor = Db | Tx;

export async function carregarConfig(exec: Executor, opcoes: { travar?: boolean } = {}) {
  const consulta = exec.select().from(s.config).where(eq(s.config.id, 1));
  // FOR UPDATE: dentro de uma transação, faz pedidos simultâneos esperarem um pelo outro.
  // Assim dois clientes não pegam a última vaga do mesmo dia ao mesmo tempo.
  const [config] = opcoes.travar ? await consulta.for('update') : await consulta;
  if (!config) throw new ErroNegocio('A loja ainda não foi configurada. Rode "npm run db:seed".');
  return config;
}

/** Contexto das regras + a linha completa da config (com os dados do Pix). */
export type ContextoCompleto = ContextoPedido & { config: typeof s.config.$inferSelect };

export async function carregarContexto(
  exec: Executor,
  opcoes: { travar?: boolean; agora?: Date } = {},
): Promise<ContextoCompleto> {
  const agora = partesEmPelotas(opcoes.agora);
  const config = await carregarConfig(exec, opcoes);
  const ate = somarDias(agora.data, config.antecedenciaDiasCaixaFesta + JANELA_DIAS);

  // Em sequência (não Promise.all): dentro de uma transação todas usam a mesma conexão.
  const produtos = await exec
    .select({ id: s.produtos.id, nome: s.produtos.nome, precoCentavos: s.produtos.precoCentavos, disponivel: s.produtos.disponivel })
    .from(s.produtos)
    .where(eq(s.produtos.ativo, true))
    .orderBy(asc(s.produtos.ordem));
  const bairros = await exec
    .select({ id: s.bairros.id, nome: s.bairros.nome, freteCentavos: s.bairros.freteCentavos })
    .from(s.bairros)
    .where(eq(s.bairros.ativo, true));
  const agenda = await exec
    .select({ data: s.pedidos.dataEntrega, n: sql<number>`count(*)::int` })
    .from(s.pedidos)
    .where(
      and(
        eq(s.pedidos.tipo, 'CAIXA_50'),
        ne(s.pedidos.status, 'CANCELADO'),
        gte(s.pedidos.dataEntrega, agora.data),
        lte(s.pedidos.dataEntrega, ate),
      ),
    )
    .groupBy(s.pedidos.dataEntrega);

  return {
    config,
    produtos: new Map(produtos.map((p) => [p.id, p])),
    bairros: new Map(bairros.map((b) => [b.id, b])),
    caixasPorDia: Object.fromEntries(agenda.map((a) => [a.data, a.n])),
    agora,
  };
}
