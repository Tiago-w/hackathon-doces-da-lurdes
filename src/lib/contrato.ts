/**
 * Contrato de dados entre o servidor (Dev 1), o site do cliente (Dev 2) e o Modo Vovó (Dev 3).
 *
 * Convenções:
 * - Dinheiro sempre em centavos (inteiro). Formate com `formatarReais` (src/lib/dinheiro.ts).
 * - Datas no fuso America/Sao_Paulo. Datas "de calendário" no formato YYYY-MM-DD.
 *   Instantes (criadoEm) em ISO 8601.
 * - WhatsApp só com dígitos, com DDD e sem o 55. Ex.: "53999998888".
 * - Mensagens de erro já vêm em português simples, prontas para mostrar ao usuário.
 *
 * Dono: Dev 1. Precisa mudar algo? Peça no grupo.
 */

// ---------- Enums ----------

export type TipoPedido = 'AVULSO' | 'CAIXA_50' | 'FESTA';
export type StatusPedido = 'RECEBIDO' | 'FAZENDO' | 'PRONTO' | 'SAIU' | 'ENTREGUE' | 'CANCELADO';
export type FormaEntrega = 'RETIRADA' | 'ENTREGA';
export type FormaPagamento = 'PIX' | 'CARTAO';
export type StatusPagamento = 'PENDENTE' | 'PAGO';
export type StatusOrcamento = 'NOVO' | 'RESPONDIDO' | 'FECHADO' | 'RECUSADO';

/** Data de calendário no formato YYYY-MM-DD. */
export type DataISO = string;

// ---------- Catálogo e configuração ----------

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  /** Preço unitário (pedido avulso). */
  precoCentavos: number;
  fotoUrl: string | null;
  disponivel: boolean;
  ordem: number;
}

export interface Bairro {
  id: string;
  nome: string;
  zona: number;
  freteCentavos: number;
}

export interface ConfigPublica {
  /** Preço fixo da Caixa de 50 (a confirmar com o cliente). */
  precoCaixa50Centavos: number;
  /** "HH:mm". Avulso feito antes disso pode sair no mesmo dia. */
  horarioCorteMesmoDia: string;
  antecedenciaDiasCaixaFesta: number;
  freteCortesiaAcimaCentavos: number;
  whatsappLoja: string;
  enderecoRetirada: string;
  /** true enquanto o Pix for de teste: o site mostra "não pague este Pix". */
  ambienteTeste: boolean;
}

// ---------- Site: montar e criar pedido ----------

export interface EntradaItem {
  produtoId: string;
  quantidade: number;
}

export interface EntradaPedido {
  tipo: 'AVULSO' | 'CAIXA_50';
  itens: EntradaItem[];
  cliente: { nome: string; whatsapp: string };
  formaEntrega: FormaEntrega;
  bairroId: string | null;
  endereco: string | null;
  dataEntrega: DataISO;
  observacao: string | null;
  formaPagamento: 'PIX';
  aceitouPrivacidade: boolean;
}

export interface ErroCampo {
  /** Nome do campo do formulário (ex.: "cliente.whatsapp", "bairroId", "dataEntrega", "itens"). */
  campo?: string;
  /** Preenchido quando o erro é de um sabor específico (ex.: acabou). */
  produtoId?: string;
  mensagem: string;
}

export interface DataPermitida {
  data: DataISO;
  mesmoDia: boolean;
}

export interface ResultadoCalculo {
  ok: boolean;
  erros: ErroCampo[];
  subtotalCentavos: number;
  freteCentavos: number;
  freteCortesia: boolean;
  totalCentavos: number;
  /** Próximos ~30 dias em que dá para entregar este tipo de pedido. */
  datasPermitidas: DataPermitida[];
}

export type ResultadoCriarPedido =
  | { ok: true; pedidoId: string }
  | { ok: false; erros: ErroCampo[] };

export interface PedidoConfirmacao {
  id: string;
  codigo: number;
  tipo: TipoPedido;
  cliente: { nome: string };
  dataEntrega: DataISO;
  formaEntrega: FormaEntrega;
  bairro: string | null;
  itens: { nomeProduto: string; quantidade: number }[];
  totalCentavos: number;
  pix: { copiaECola: string; qrCodeDataUrl: string };
  statusPagamento: StatusPagamento;
}

export interface EntradaOrcamentoFesta {
  nome: string;
  whatsapp: string;
  dataEvento: DataISO;
  tipoEvento: string;
  quantidadeDoces: number | null;
  observacao: string | null;
  aceitouPrivacidade: boolean;
}

export type ResultadoSimples = { ok: true } | { ok: false; erros: ErroCampo[] };

// ---------- Painel (Modo Vovó) ----------

export interface ItemPedido {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  /** Preço unitário da época. Na Caixa de 50 é 0: o preço é o da caixa (subtotalCentavos do pedido). */
  precoUnitCentavos: number;
}

export interface PedidoResumo {
  id: string;
  codigo: number;
  tipo: TipoPedido;
  status: StatusPedido;
  /** ISO 8601. */
  criadoEm: string;
  dataEntrega: DataISO;
  mesmoDia: boolean;
  cliente: { nome: string; whatsapp: string };
  formaEntrega: FormaEntrega;
  bairro: string | null;
  endereco: string | null;
  observacao: string | null;
  itens: ItemPedido[];
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  formaPagamento: FormaPagamento;
  statusPagamento: StatusPagamento;
}

export interface FiltroPedidos {
  /** Data de entrega inicial (inclusive). */
  de?: DataISO;
  /** Data de entrega final (inclusive). */
  ate?: DataISO;
  status?: StatusPedido[];
}

export interface OrcamentoFesta {
  id: string;
  /** ISO 8601. */
  criadoEm: string;
  nome: string;
  whatsapp: string;
  dataEvento: DataISO;
  tipoEvento: string;
  quantidadeDoces: number | null;
  observacao: string | null;
  status: StatusOrcamento;
}

// ---------- Calendário de Agenda (Site & Modo Vovó) ----------

export interface DiaCalendario {
  data: DataISO;
  /** Se false, a dona Lurdes fechou a cozinha neste dia (folga, feriado ou evento). */
  aberto: boolean;
  /** Limite efetivo de Caixas de 50 neste dia. */
  limiteCaixas: number;
  /** true quando o limite deste dia foi ajustado manualmente pela dona Lurdes. */
  limitePersonalizado: boolean;
  /** Quantas Caixas de 50 já estão reservadas neste dia (pedidos ativos). */
  caixasAgendadas: number;
  /** Total de pedidos ativos (avulsos + caixas) agendados para este dia. */
  totalPedidos: number;
  /** Vagas restantes para Caixa de 50 neste dia. */
  vagasCaixaRestantes: number;
  /** Nota pública/interna do dia (ex.: "Folga da cozinha", "Feriado", "Produção de casamento"). */
  observacao: string | null;
  /** Se o dia aceita novos pedidos avulsos. */
  disponivelAvulso: boolean;
  /** Se o dia aceita novas Caixas de 50. */
  disponivelCaixa: boolean;
}

export interface EntradaEditarDiaCalendario {
  data: DataISO;
  aberto: boolean;
  /** null volta a usar o limite padrão da cozinha. */
  limiteCaixas: number | null;
  observacao: string | null;
}

// ---------- Constantes úteis para as telas ----------

/** Ordem do fluxo normal de um pedido (CANCELADO fica de fora). */
export const FLUXO_STATUS: readonly StatusPedido[] = ['RECEBIDO', 'FAZENDO', 'PRONTO', 'SAIU', 'ENTREGUE'];

export const QUANTIDADE_CAIXA = 50;
