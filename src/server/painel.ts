import 'server-only';
/**
 * Funções do Modo Vovó (painel da dona Lurdes). Dono: Dev 1.
 *
 * IMPORTANTE: este arquivo NÃO tem 'use server' de propósito e NÃO verifica login.
 * Uma função com 'use server' vira um endpoint público: estas funções ficariam abertas sem senha.
 * A fronteira pública é src/app/painel/_dados/index.ts (Dev 3), que tem 'use server',
 * chama exigirLogin() e só depois chama estas funções.
 */
import type {
  FiltroPedidos,
  OrcamentoFesta,
  PedidoResumo,
  StatusOrcamento,
  StatusPedido,
} from '@/lib/contrato';

export { listarCatalogo } from './loja';

const NAO_IMPLEMENTADO = 'Ainda não implementado (Dev 1). Use o mock por enquanto.';

/** Pedidos filtrados por data de entrega e status, do mais antigo para o mais novo. */
export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<PedidoResumo[]> {
  void filtro;
  throw new Error(NAO_IMPLEMENTADO);
}

/**
 * Muda o status respeitando o fluxo: avança um passo, volta um passo (o "Desfazer")
 * ou cancela. Retirada pula o SAIU (PRONTO → ENTREGUE). Lança erro em mudança inválida.
 */
export async function mudarStatus(pedidoId: string, status: StatusPedido): Promise<void> {
  void pedidoId;
  void status;
  throw new Error(NAO_IMPLEMENTADO);
}

/** "Tem" (true) / "Acabou" (false). */
export async function marcarDisponivel(produtoId: string, disponivel: boolean): Promise<void> {
  void produtoId;
  void disponivel;
  throw new Error(NAO_IMPLEMENTADO);
}

/** Muda o preço unitário. Pedidos já feitos não mudam (guardam o preço da época). */
export async function mudarPreco(produtoId: string, precoCentavos: number): Promise<void> {
  void produtoId;
  void precoCentavos;
  throw new Error(NAO_IMPLEMENTADO);
}

/** Orçamentos de festa: NOVO primeiro, depois do mais recente para o mais antigo. */
export async function listarOrcamentosFesta(): Promise<OrcamentoFesta[]> {
  throw new Error(NAO_IMPLEMENTADO);
}

export async function mudarStatusOrcamento(id: string, status: StatusOrcamento): Promise<void> {
  void id;
  void status;
  throw new Error(NAO_IMPLEMENTADO);
}
