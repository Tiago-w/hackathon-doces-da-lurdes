import 'server-only';
/**
 * Funções do Modo Vovó (painel da dona Lurdes). Dono: Dev 1.
 *
 * IMPORTANTE: este arquivo NÃO tem 'use server' de propósito e NÃO verifica login.
 * Uma função com 'use server' vira um endpoint público: estas funções ficariam abertas sem senha.
 * A fronteira pública é src/app/painel/_dados/index.ts (Dev 3), que tem 'use server',
 * chama exigirLogin() e só depois chama estas funções.
 *
 * Erros esperados são lançados como ErroNegocio (src/lib/erros.ts), com mensagem pronta para a tela.
 * O _dados do painel deve capturar e devolver a mensagem (o Next esconde mensagens de erro em produção).
 */
import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm';
import type {
  FiltroPedidos,
  OrcamentoFesta,
  PedidoResumo,
  StatusOrcamento,
  StatusPedido,
} from '@/lib/contrato';
import { db, schema as s } from '@/lib/db';
import { ehDataISO } from '@/lib/datas';
import { ErroNegocio, ehUuid } from '@/lib/erros';
import { erroDePreco, mensagemTransicaoInvalida, transicaoPermitida } from '@/lib/regras';

export { listarCatalogo } from './loja';

const STATUS_PEDIDO = new Set<StatusPedido>(['RECEBIDO', 'FAZENDO', 'PRONTO', 'SAIU', 'ENTREGUE', 'CANCELADO']);
const STATUS_ORCAMENTO = new Set<StatusOrcamento>(['NOVO', 'RESPONDIDO', 'FECHADO', 'RECUSADO']);

// ---------- Pedidos ----------

/** Pedidos filtrados por data de entrega e status, do mais antigo para o mais novo. */
export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<PedidoResumo[]> {
  const condicoes: SQL[] = [];
  if (filtro.de !== undefined) {
    if (!ehDataISO(filtro.de)) throw new ErroNegocio('Data inicial inválida.');
    condicoes.push(gte(s.pedidos.dataEntrega, filtro.de));
  }
  if (filtro.ate !== undefined) {
    if (!ehDataISO(filtro.ate)) throw new ErroNegocio('Data final inválida.');
    condicoes.push(lte(s.pedidos.dataEntrega, filtro.ate));
  }
  if (filtro.status !== undefined) {
    const status = filtro.status.filter((x) => STATUS_PEDIDO.has(x));
    if (status.length === 0) return [];
    condicoes.push(inArray(s.pedidos.status, status));
  }

  const pedidos = await db
    .select()
    .from(s.pedidos)
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(asc(s.pedidos.dataEntrega), asc(s.pedidos.criadoEm))
    .limit(500);
  if (pedidos.length === 0) return [];

  const itens = await db
    .select()
    .from(s.itensPedido)
    .where(
      inArray(
        s.itensPedido.pedidoId,
        pedidos.map((p) => p.id),
      ),
    )
    .orderBy(desc(s.itensPedido.quantidade), asc(s.itensPedido.nomeProduto));

  const itensPorPedido = new Map<string, PedidoResumo['itens']>();
  for (const i of itens) {
    const lista = itensPorPedido.get(i.pedidoId) ?? [];
    lista.push({
      produtoId: i.produtoId,
      nomeProduto: i.nomeProduto,
      quantidade: i.quantidade,
      precoUnitCentavos: i.precoUnitCentavos,
    });
    itensPorPedido.set(i.pedidoId, lista);
  }

  return pedidos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    tipo: p.tipo,
    status: p.status,
    criadoEm: p.criadoEm.toISOString(),
    dataEntrega: p.dataEntrega,
    mesmoDia: p.mesmoDia,
    cliente: { nome: p.nomeCliente, whatsapp: p.whatsappCliente },
    formaEntrega: p.formaEntrega,
    bairro: p.bairroNome,
    endereco: p.endereco,
    observacao: p.observacao,
    itens: itensPorPedido.get(p.id) ?? [],
    subtotalCentavos: p.subtotalCentavos,
    freteCentavos: p.freteCentavos,
    totalCentavos: p.totalCentavos,
    formaPagamento: p.formaPagamento,
    statusPagamento: p.statusPagamento,
  }));
}

/**
 * Muda o status respeitando o fluxo: avança um passo, volta ao status anterior (o "Desfazer",
 * inclusive de um cancelamento) ou cancela. Retirada pula o SAIU (PRONTO → ENTREGUE).
 * Lança ErroNegocio em mudança inválida (ex.: alguém já mudou o pedido em outra tela).
 */
export async function mudarStatus(pedidoId: string, status: StatusPedido): Promise<void> {
  if (!ehUuid(pedidoId)) throw new ErroNegocio('Não encontrei esse pedido.');
  if (!STATUS_PEDIDO.has(status)) throw new ErroNegocio('Situação de pedido inválida.');

  await db.transaction(async (tx) => {
    const [p] = await tx
      .select({ status: s.pedidos.status, statusAnterior: s.pedidos.statusAnterior, formaEntrega: s.pedidos.formaEntrega })
      .from(s.pedidos)
      .where(eq(s.pedidos.id, pedidoId))
      .for('update');
    if (!p) throw new ErroNegocio('Não encontrei esse pedido.');
    if (p.status === status) return; // toque duplo: já está assim, não é erro
    if (!transicaoPermitida(p.status, status, p.formaEntrega, p.statusAnterior)) {
      throw new ErroNegocio(mensagemTransicaoInvalida(p.status, status));
    }
    await tx
      .update(s.pedidos)
      .set({ status, statusAnterior: p.status, statusAtualizadoEm: new Date() })
      .where(eq(s.pedidos.id, pedidoId));
  });
}

// ---------- Sabores ----------

/** "Tem" (true) / "Acabou" (false). */
export async function marcarDisponivel(produtoId: string, disponivel: boolean): Promise<void> {
  if (!ehUuid(produtoId)) throw new ErroNegocio('Não encontrei esse sabor.');
  if (typeof disponivel !== 'boolean') throw new ErroNegocio('Escolha "Tem" ou "Acabou".');
  const alterados = await db
    .update(s.produtos)
    .set({ disponivel })
    .where(and(eq(s.produtos.id, produtoId), eq(s.produtos.ativo, true)))
    .returning({ id: s.produtos.id });
  if (alterados.length === 0) throw new ErroNegocio('Não encontrei esse sabor.');
}

/** Muda o preço unitário. Pedidos já feitos não mudam (guardam o preço da época). */
export async function mudarPreco(produtoId: string, precoCentavos: number): Promise<void> {
  if (!ehUuid(produtoId)) throw new ErroNegocio('Não encontrei esse sabor.');
  const erro = erroDePreco(precoCentavos);
  if (erro) throw new ErroNegocio(erro);
  const alterados = await db
    .update(s.produtos)
    .set({ precoCentavos })
    .where(and(eq(s.produtos.id, produtoId), eq(s.produtos.ativo, true)))
    .returning({ id: s.produtos.id });
  if (alterados.length === 0) throw new ErroNegocio('Não encontrei esse sabor.');
}

// ---------- Festas ----------

/** Orçamentos de festa: NOVO primeiro, depois do mais recente para o mais antigo. */
export async function listarOrcamentosFesta(): Promise<OrcamentoFesta[]> {
  const linhas = await db
    .select()
    .from(s.orcamentosFesta)
    .orderBy(sql`case when ${s.orcamentosFesta.status} = 'NOVO' then 0 else 1 end`, desc(s.orcamentosFesta.criadoEm))
    .limit(200);
  return linhas.map((o) => ({
    id: o.id,
    criadoEm: o.criadoEm.toISOString(),
    nome: o.nome,
    whatsapp: o.whatsapp,
    dataEvento: o.dataEvento,
    tipoEvento: o.tipoEvento,
    quantidadeDoces: o.quantidadeDoces,
    observacao: o.observacao,
    status: o.status,
  }));
}

export async function mudarStatusOrcamento(id: string, status: StatusOrcamento): Promise<void> {
  if (!ehUuid(id)) throw new ErroNegocio('Não encontrei esse orçamento.');
  if (!STATUS_ORCAMENTO.has(status)) throw new ErroNegocio('Situação de orçamento inválida.');
  const alterados = await db
    .update(s.orcamentosFesta)
    .set({ status })
    .where(eq(s.orcamentosFesta.id, id))
    .returning({ id: s.orcamentosFesta.id });
  if (alterados.length === 0) throw new ErroNegocio('Não encontrei esse orçamento.');
}
