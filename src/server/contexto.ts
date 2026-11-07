import 'server-only';
/**
 * Carrega do banco o que as regras de negócio precisam (config, sabores, bairros, agenda de caixas e exceções do calendário).
 * Usado por loja.ts e painel.ts dentro e fora de transações.
 */
import { and, asc, eq, gte, lte, ne, sql } from 'drizzle-orm';
import type { DataISO, DiaCalendario } from '@/lib/contrato';
import type { Db, Tx } from '@/lib/db';
import { schema as s } from '@/lib/db';
import { diasEntre, partesEmPelotas, somarDias } from '@/lib/datas';
import { ErroNegocio } from '@/lib/erros';
import {
  JANELA_DIAS,
  caixaLotada,
  limiteCaixasNoDia,
  mesmoDiaAberto,
  type ContextoPedido,
  type RegraDiaCalendario,
} from '@/lib/regras';

type Executor = Db | Tx;

let tabelaAgendaGarantida = false;

export async function garantirTabelaAgendaDias(exec: Executor) {
  if (tabelaAgendaGarantida) return;
  await exec.execute(sql`
    CREATE TABLE IF NOT EXISTS "agenda_dias" (
      "data" date PRIMARY KEY NOT NULL,
      "aberto" boolean DEFAULT true NOT NULL,
      "limite_caixas" integer,
      "observacao" text,
      "atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  tabelaAgendaGarantida = true;
}

export async function carregarConfig(exec: Executor, opcoes: { travar?: boolean } = {}) {
  const consulta = exec.select().from(s.config).where(eq(s.config.id, 1));
  // FOR UPDATE: dentro de uma transação, faz pedidos simultâneos esperarem um pelo outro.
  // Assim dois clientes não pegam a última vaga do mesmo dia ao mesmo tempo.
  const [config] = opcoes.travar ? await consulta.for('update') : await consulta;
  if (!config) throw new ErroNegocio('A loja ainda não foi configurada. Rode "npm run db:seed".');
  return config;
}

/** Contexto das regras + a linha completa da config (com os dados do Pix) e total de pedidos por dia. */
export type ContextoCompleto = ContextoPedido & {
  config: typeof s.config.$inferSelect;
  pedidosPorDia: Readonly<Record<DataISO, number>>;
};

export async function carregarContexto(
  exec: Executor,
  opcoes: { travar?: boolean; agora?: Date } = {},
): Promise<ContextoCompleto> {
  await garantirTabelaAgendaDias(exec);
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
  const agendaCaixas = await exec
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

  const agendaTodosPedidos = await exec
    .select({ data: s.pedidos.dataEntrega, n: sql<number>`count(*)::int` })
    .from(s.pedidos)
    .where(
      and(
        ne(s.pedidos.status, 'CANCELADO'),
        gte(s.pedidos.dataEntrega, agora.data),
        lte(s.pedidos.dataEntrega, ate),
      ),
    )
    .groupBy(s.pedidos.dataEntrega);

  const excecoesDias = await exec
    .select()
    .from(s.agendaDias)
    .where(and(gte(s.agendaDias.data, agora.data), lte(s.agendaDias.data, ate)));

  const agendaPersonalizada: Record<DataISO, RegraDiaCalendario> = {};
  for (const d of excecoesDias) {
    agendaPersonalizada[d.data] = {
      aberto: d.aberto,
      limiteCaixas: d.limiteCaixas,
      observacao: d.observacao,
    };
  }

  return {
    config,
    produtos: new Map(produtos.map((p) => [p.id, p])),
    bairros: new Map(bairros.map((b) => [b.id, b])),
    caixasPorDia: Object.fromEntries(agendaCaixas.map((a) => [a.data, a.n])),
    pedidosPorDia: Object.fromEntries(agendaTodosPedidos.map((a) => [a.data, a.n])),
    agendaPersonalizada,
    agora,
  };
}

/** Constrói a visão dos próximos 30 dias do calendário da cozinha. */
export async function construirCalendario(exec: Executor, dias = JANELA_DIAS): Promise<DiaCalendario[]> {
  const ctx = await carregarContexto(exec);
  const lista: DiaCalendario[] = [];

  for (let i = 0; i < dias; i++) {
    const data = somarDias(ctx.agora.data, i);
    const regra = ctx.agendaPersonalizada?.[data];
    const aberto = regra ? regra.aberto : true;
    const limitePersonalizado = typeof regra?.limiteCaixas === 'number' && regra.limiteCaixas >= 0;
    const limiteCaixas = limiteCaixasNoDia(data, ctx);
    const caixasAgendadas = ctx.caixasPorDia[data] ?? 0;
    const totalPedidos = ctx.pedidosPorDia[data] ?? 0;
    const vagasCaixaRestantes = !aberto ? 0 : Math.max(0, limiteCaixas - caixasAgendadas);

    const disponivelAvulso =
      aberto && (data !== ctx.agora.data || mesmoDiaAberto(ctx));
    const disponivelCaixa =
      aberto &&
      diasEntre(ctx.agora.data, data) >= ctx.config.antecedenciaDiasCaixaFesta &&
      !caixaLotada(data, ctx);

    lista.push({
      data,
      aberto,
      limiteCaixas,
      limitePersonalizado,
      caixasAgendadas,
      totalPedidos,
      vagasCaixaRestantes,
      observacao: regra?.observacao ?? null,
      disponivelAvulso,
      disponivelCaixa,
    });
  }

  return lista;
}
