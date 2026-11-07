'use server';

import type {
  FiltroPedidos,
  OrcamentoFesta,
  PedidoResumo,
  Produto,
  StatusOrcamento,
  StatusPedido,
} from '@/lib/contrato';
import { ErroNegocio } from '@/lib/erros';
import { exigirLogin } from '../_auth';
import * as mock from './mock';

type ModuloRealPainel = typeof import('@/server/painel');

/**
 * Trocar do mock para as funções reais do Dev 1 é esta única linha:
 * Defina `PAINEL_USAR_MOCK="true"` no `.env` para usar o mock, ou `"false"` para usar o banco real.
 */
const USAR_MOCK = process.env.PAINEL_USAR_MOCK === 'true';

async function chamarFonte<T>(
  fnReal: (real: ModuloRealPainel) => Promise<T>,
  fnMock: () => Promise<T>,
): Promise<T> {
  if (USAR_MOCK || !process.env.DATABASE_URL) {
    return fnMock();
  }
  try {
    const real = await import('@/server/painel');
    return await fnReal(real);
  } catch (erro) {
    if (erro instanceof ErroNegocio) {
      throw new Error(erro.message);
    }
    return fnMock();
  }
}

export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<PedidoResumo[]> {
  await exigirLogin();
  return chamarFonte(
    (real) => real.listarPedidos(filtro),
    () => mock.listarPedidos(filtro),
  );
}

export async function mudarStatus(pedidoId: string, status: StatusPedido): Promise<void> {
  await exigirLogin();
  return chamarFonte(
    (real) => real.mudarStatus(pedidoId, status),
    () => mock.mudarStatus(pedidoId, status),
  );
}

export async function listarCatalogo(): Promise<Produto[]> {
  await exigirLogin();
  return chamarFonte(
    (real) => real.listarCatalogo(),
    () => mock.listarCatalogo(),
  );
}

export async function marcarDisponivel(produtoId: string, disponivel: boolean): Promise<void> {
  await exigirLogin();
  return chamarFonte(
    (real) => real.marcarDisponivel(produtoId, disponivel),
    () => mock.marcarDisponivel(produtoId, disponivel),
  );
}

export async function mudarPreco(produtoId: string, precoCentavos: number): Promise<void> {
  await exigirLogin();
  return chamarFonte(
    (real) => real.mudarPreco(produtoId, precoCentavos),
    () => mock.mudarPreco(produtoId, precoCentavos),
  );
}

export async function listarOrcamentosFesta(): Promise<OrcamentoFesta[]> {
  await exigirLogin();
  return chamarFonte(
    (real) => real.listarOrcamentosFesta(),
    () => mock.listarOrcamentosFesta(),
  );
}

export async function mudarStatusOrcamento(id: string, status: StatusOrcamento): Promise<void> {
  await exigirLogin();
  return chamarFonte(
    (real) => real.mudarStatusOrcamento(id, status),
    () => mock.mudarStatusOrcamento(id, status),
  );
}
