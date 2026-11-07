import 'server-only';
/**
 * Funções do site do cliente. Dono: Dev 1.
 *
 * IMPORTANTE: este arquivo NÃO tem 'use server' de propósito.
 * Uma função com 'use server' vira um endpoint público. A fronteira pública é
 * src/app/(site)/_dados/index.ts (Dev 2), que tem 'use server' e chama estas funções.
 *
 * Regra de ouro: preço, frete, datas e disponibilidade são sempre recalculados aqui.
 * O que vem do navegador é só a intenção do cliente, e é tratado como desconhecido (unknown).
 */
import { asc, eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { z } from 'zod';
import type {
  Bairro,
  ConfigPublica,
  EntradaOrcamentoFesta,
  EntradaPedido,
  PedidoConfirmacao,
  Produto,
  ResultadoCalculo,
  ResultadoCriarPedido,
  ResultadoSimples,
} from '@/lib/contrato';
import { db, schema as s } from '@/lib/db';
import { ehUuid } from '@/lib/erros';
import { gerarPixCopiaECola } from '@/lib/pix';
import { avaliarOrcamentoFesta, avaliarPedido } from '@/lib/regras';
import { carregarConfig, carregarContexto } from './contexto';

const ERRO_FORMATO = {
  mensagem: 'Não conseguimos entender o pedido. Recarregue a página e tente de novo.',
} as const;

// Formato do que pode chegar do navegador. As REGRAS ficam em src/lib/regras.ts;
// aqui só garantimos os tipos, para nada estranho chegar nelas.
const texto = z.string().max(2000);
const esquemaPedidoParcial = z
  .object({
    tipo: z.enum(['AVULSO', 'CAIXA_50']),
    itens: z.array(z.object({ produtoId: z.string().max(64), quantidade: z.number() })).max(100),
    cliente: z.object({ nome: texto, whatsapp: texto }).partial(),
    formaEntrega: z.enum(['RETIRADA', 'ENTREGA']),
    bairroId: z.string().max(64).nullable(),
    endereco: texto.nullable(),
    dataEntrega: z.string().max(20),
    observacao: texto.nullable(),
    formaPagamento: z.string().max(20),
    aceitouPrivacidade: z.boolean(),
  })
  .partial();

const esquemaOrcamento = z
  .object({
    nome: texto,
    whatsapp: texto,
    dataEvento: z.string().max(20),
    tipoEvento: texto,
    quantidadeDoces: z.number().nullable(),
    observacao: texto.nullable(),
    aceitouPrivacidade: z.boolean(),
  })
  .partial();

// ---------- Catálogo ----------

/** Todos os sabores ativos, inclusive os indisponíveis (com disponivel=false), na ordem da vitrine. */
export async function listarCatalogo(): Promise<Produto[]> {
  return db
    .select({
      id: s.produtos.id,
      nome: s.produtos.nome,
      descricao: s.produtos.descricao,
      precoCentavos: s.produtos.precoCentavos,
      fotoUrl: s.produtos.fotoUrl,
      disponivel: s.produtos.disponivel,
      ordem: s.produtos.ordem,
    })
    .from(s.produtos)
    .where(eq(s.produtos.ativo, true))
    .orderBy(asc(s.produtos.ordem), asc(s.produtos.nome));
}

/** Bairros atendidos, ordenados por zona e nome. */
export async function listarBairros(): Promise<Bairro[]> {
  return db
    .select({ id: s.bairros.id, nome: s.bairros.nome, zona: s.bairros.zona, freteCentavos: s.bairros.freteCentavos })
    .from(s.bairros)
    .where(eq(s.bairros.ativo, true))
    .orderBy(asc(s.bairros.zona), asc(s.bairros.nome));
}

export async function obterConfigPublica(): Promise<ConfigPublica> {
  const c = await carregarConfig(db);
  return {
    precoCaixa50Centavos: c.precoCaixa50Centavos,
    horarioCorteMesmoDia: c.horarioCorteMesmoDia,
    antecedenciaDiasCaixaFesta: c.antecedenciaDiasCaixaFesta,
    freteCortesiaAcimaCentavos: c.freteCortesiaAcimaCentavos,
    whatsappLoja: c.whatsappLoja,
    enderecoRetirada: c.enderecoRetirada,
    ambienteTeste: process.env.PIX_AMBIENTE_TESTE !== 'false',
  };
}

// ---------- Pedido ----------

/**
 * Calcula totais, erros e datas permitidas. Aceita entrada incompleta
 * (ex.: só itens), para o site ir mostrando o resumo enquanto a pessoa preenche.
 */
export async function calcularPedido(entrada: Partial<EntradaPedido>): Promise<ResultadoCalculo> {
  const lido = esquemaPedidoParcial.safeParse(entrada);
  if (!lido.success) {
    return { ok: false, erros: [ERRO_FORMATO], subtotalCentavos: 0, freteCentavos: 0, freteCortesia: false, totalCentavos: 0, datasPermitidas: [] };
  }
  const ctx = await carregarContexto(db);
  const r = avaliarPedido(lido.data as Partial<EntradaPedido>, ctx, 'parcial');
  // Devolve só o ResultadoCalculo (sem os dados internos normalizados).
  return {
    ok: r.ok,
    erros: r.erros,
    subtotalCentavos: r.subtotalCentavos,
    freteCentavos: r.freteCentavos,
    freteCortesia: r.freteCortesia,
    totalCentavos: r.totalCentavos,
    datasPermitidas: r.datasPermitidas,
  };
}

/** Valida tudo de novo, grava o pedido e gera o Pix. */
export async function criarPedido(entrada: EntradaPedido): Promise<ResultadoCriarPedido> {
  const lido = esquemaPedidoParcial.safeParse(entrada);
  if (!lido.success) return { ok: false, erros: [ERRO_FORMATO] };

  return db.transaction(async (tx) => {
    // travar: serializa a criação de pedidos para a contagem de caixas por dia não estourar.
    const ctx = await carregarContexto(tx, { travar: true });
    const avaliacao = avaliarPedido(lido.data as Partial<EntradaPedido>, ctx, 'completo');
    if (!avaliacao.ok || !avaliacao.pedido) return { ok: false, erros: avaliacao.erros };
    const p = avaliacao.pedido;
    const agora = new Date();

    const [cliente] = await tx
      .insert(s.clientes)
      .values({ nome: p.cliente.nome, whatsapp: p.cliente.whatsapp, aceitouPrivacidadeEm: agora })
      .onConflictDoUpdate({ target: s.clientes.whatsapp, set: { nome: p.cliente.nome, aceitouPrivacidadeEm: agora } })
      .returning({ id: s.clientes.id });

    const [novo] = await tx
      .insert(s.pedidos)
      .values({
        tipo: p.tipo,
        clienteId: cliente.id,
        nomeCliente: p.cliente.nome,
        whatsappCliente: p.cliente.whatsapp,
        formaEntrega: p.formaEntrega,
        bairroId: p.bairro?.id ?? null,
        bairroNome: p.bairro?.nome ?? null,
        endereco: p.endereco,
        dataEntrega: p.dataEntrega,
        mesmoDia: p.mesmoDia,
        observacao: p.observacao,
        subtotalCentavos: avaliacao.subtotalCentavos,
        freteCentavos: avaliacao.freteCentavos,
        totalCentavos: avaliacao.totalCentavos,
        formaPagamento: 'PIX',
      })
      .returning({ id: s.pedidos.id, codigo: s.pedidos.codigo });

    await tx.insert(s.itensPedido).values(p.itens.map((i) => ({ ...i, pedidoId: novo.id })));

    const pix = gerarPixCopiaECola({
      chave: ctx.config.pixChave,
      nomeRecebedor: ctx.config.pixNomeRecebedor,
      cidade: ctx.config.pixCidade,
      valorCentavos: avaliacao.totalCentavos,
      txid: `PEDIDO${novo.codigo}`,
    });
    await tx.update(s.pedidos).set({ pixCopiaECola: pix }).where(eq(s.pedidos.id, novo.id));

    return { ok: true, pedidoId: novo.id };
  });
}

/** Dados da tela de confirmação. Retorna null se o id não existir. */
export async function obterPedidoConfirmacao(pedidoId: string): Promise<PedidoConfirmacao | null> {
  if (!ehUuid(pedidoId)) return null;
  const [p] = await db.select().from(s.pedidos).where(eq(s.pedidos.id, pedidoId));
  if (!p) return null;

  const itens = await db
    .select({ nomeProduto: s.itensPedido.nomeProduto, quantidade: s.itensPedido.quantidade })
    .from(s.itensPedido)
    .where(eq(s.itensPedido.pedidoId, p.id))
    .orderBy(asc(s.itensPedido.nomeProduto));

  let copiaECola = p.pixCopiaECola;
  if (!copiaECola) {
    const c = await carregarConfig(db);
    copiaECola = gerarPixCopiaECola({
      chave: c.pixChave,
      nomeRecebedor: c.pixNomeRecebedor,
      cidade: c.pixCidade,
      valorCentavos: p.totalCentavos,
      txid: `PEDIDO${p.codigo}`,
    });
  }

  return {
    id: p.id,
    codigo: p.codigo,
    tipo: p.tipo,
    cliente: { nome: p.nomeCliente },
    dataEntrega: p.dataEntrega,
    formaEntrega: p.formaEntrega,
    bairro: p.bairroNome,
    itens,
    totalCentavos: p.totalCentavos,
    pix: {
      copiaECola,
      qrCodeDataUrl: await QRCode.toDataURL(copiaECola, { errorCorrectionLevel: 'M', margin: 1, width: 320 }),
    },
    statusPagamento: p.statusPagamento,
  };
}

// ---------- Festa ----------

export async function criarOrcamentoFesta(entrada: EntradaOrcamentoFesta): Promise<ResultadoSimples> {
  const lido = esquemaOrcamento.safeParse(entrada);
  if (!lido.success) return { ok: false, erros: [ERRO_FORMATO] };

  const ctx = await carregarContexto(db);
  const avaliacao = avaliarOrcamentoFesta(lido.data, ctx);
  if (!avaliacao.ok || !avaliacao.dados) return { ok: false, erros: avaliacao.erros };
  const d = avaliacao.dados;

  await db.transaction(async (tx) => {
    const agora = new Date();
    const [cliente] = await tx
      .insert(s.clientes)
      .values({ nome: d.nome, whatsapp: d.whatsapp, aceitouPrivacidadeEm: agora })
      .onConflictDoUpdate({ target: s.clientes.whatsapp, set: { nome: d.nome, aceitouPrivacidadeEm: agora } })
      .returning({ id: s.clientes.id });
    await tx.insert(s.orcamentosFesta).values({ ...d, clienteId: cliente.id, aceitouPrivacidadeEm: agora });
  });
  return { ok: true };
}
