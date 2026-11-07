'use server';
/**
 * ÚNICA porta de dados do site do cliente. Nenhum componente importa src/server/ ou o mock direto.
 *
 * Cada função daqui com 'use server' vira um endpoint público: por isso só repassamos para
 * src/server/loja.ts (Dev 1), que valida e recalcula tudo. Nada de regra de negócio aqui.
 *
 * Trocar mock ↔ real: SITE_USAR_MOCK no .env ("true" = mock em memória).
 */
import type {
  Bairro,
  ConfigPublica,
  DiaCalendario,
  EntradaOrcamentoFesta,
  EntradaPedido,
  PedidoConfirmacao,
  Produto,
  ResultadoCalculo,
  ResultadoCriarPedido,
  ResultadoSimples,
} from '@/lib/contrato';
import * as real from '@/server/loja';
import * as mock from './mock';

const fonte = process.env.SITE_USAR_MOCK === 'true' ? mock : real;

export async function listarCatalogo(): Promise<Produto[]> {
  return fonte.listarCatalogo();
}

export async function listarBairros(): Promise<Bairro[]> {
  return fonte.listarBairros();
}

export async function obterConfigPublica(): Promise<ConfigPublica> {
  return fonte.obterConfigPublica();
}

export async function listarCalendario(): Promise<DiaCalendario[]> {
  return fonte.listarCalendario();
}

export async function calcularPedido(entrada: Partial<EntradaPedido>): Promise<ResultadoCalculo> {
  return fonte.calcularPedido(entrada);
}

export async function criarPedido(entrada: EntradaPedido): Promise<ResultadoCriarPedido> {
  return fonte.criarPedido(entrada);
}

export async function obterPedidoConfirmacao(pedidoId: string): Promise<PedidoConfirmacao | null> {
  if (typeof pedidoId !== 'string' || pedidoId.length > 64) return null;
  return fonte.obterPedidoConfirmacao(pedidoId);
}

export async function criarOrcamentoFesta(entrada: EntradaOrcamentoFesta): Promise<ResultadoSimples> {
  return fonte.criarOrcamentoFesta(entrada);
}
