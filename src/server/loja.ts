import 'server-only';
/**
 * Funções do site do cliente. Dono: Dev 1.
 *
 * IMPORTANTE: este arquivo NÃO tem 'use server' de propósito.
 * Uma função com 'use server' vira um endpoint público. A fronteira pública é
 * src/app/(site)/_dados/index.ts (Dev 2), que tem 'use server' e chama estas funções.
 *
 * Regra de ouro: preço, frete, datas e disponibilidade são sempre recalculados aqui.
 * O que vem do navegador é só a intenção do cliente.
 */
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

const NAO_IMPLEMENTADO = 'Ainda não implementado (Dev 1). Use o mock por enquanto.';

/** Todos os sabores ativos, inclusive os indisponíveis (com disponivel=false), na ordem da vitrine. */
export async function listarCatalogo(): Promise<Produto[]> {
  throw new Error(NAO_IMPLEMENTADO);
}

/** Bairros atendidos, ordenados por zona e nome. */
export async function listarBairros(): Promise<Bairro[]> {
  throw new Error(NAO_IMPLEMENTADO);
}

export async function obterConfigPublica(): Promise<ConfigPublica> {
  throw new Error(NAO_IMPLEMENTADO);
}

/**
 * Calcula totais, erros e datas permitidas. Aceita entrada incompleta
 * (ex.: só itens), para o site ir mostrando o resumo enquanto a pessoa preenche.
 */
export async function calcularPedido(entrada: Partial<EntradaPedido>): Promise<ResultadoCalculo> {
  void entrada;
  throw new Error(NAO_IMPLEMENTADO);
}

/** Valida tudo de novo, grava o pedido e gera o Pix. */
export async function criarPedido(entrada: EntradaPedido): Promise<ResultadoCriarPedido> {
  void entrada;
  throw new Error(NAO_IMPLEMENTADO);
}

/** Dados da tela de confirmação. Retorna null se o id não existir. */
export async function obterPedidoConfirmacao(pedidoId: string): Promise<PedidoConfirmacao | null> {
  void pedidoId;
  throw new Error(NAO_IMPLEMENTADO);
}

export async function criarOrcamentoFesta(entrada: EntradaOrcamentoFesta): Promise<ResultadoSimples> {
  void entrada;
  throw new Error(NAO_IMPLEMENTADO);
}
