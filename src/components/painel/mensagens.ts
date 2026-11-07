import type {
  DataISO,
  OrcamentoFesta,
  PedidoResumo,
  StatusOrcamento,
  StatusPedido,
} from '@/lib/contrato';
import { diasEntre } from '@/lib/datas';
import { mensagemStatusParaCliente } from '@/lib/mensagens';
import { proximoStatus } from '@/lib/regras';
import { linkWhatsapp } from '@/lib/whatsapp';

export interface InfoProximoPasso {
  proximoStatus: StatusPedido;
  rotuloBotao: string;
  icone: string;
}

export function obterProximoPasso(pedido: PedidoResumo): InfoProximoPasso | null {
  const proximo = proximoStatus(pedido.status, pedido.formaEntrega);
  if (!proximo) return null;

  switch (pedido.status) {
    case 'RECEBIDO':
      return {
        proximoStatus: proximo,
        rotuloBotao: 'Começar a fazer',
        icone: '👩‍🍳',
      };
    case 'FAZENDO':
      return {
        proximoStatus: proximo,
        rotuloBotao: 'Está pronto',
        icone: '✅',
      };
    case 'PRONTO':
      if (pedido.formaEntrega === 'RETIRADA') {
        return {
          proximoStatus: proximo,
          rotuloBotao: 'Cliente retirou',
          icone: '🙌',
        };
      }
      return {
        proximoStatus: proximo,
        rotuloBotao: 'Saiu para entrega',
        icone: '🛵',
      };
    case 'SAIU':
      return {
        proximoStatus: proximo,
        rotuloBotao: 'Entregue',
        icone: '🎉',
      };
    default:
      return null;
  }
}

export interface InfoVisualStatus {
  rotulo: string;
  icone: string;
  classesSelo: string;
}

export function obterInfoStatusPedido(status: StatusPedido): InfoVisualStatus {
  switch (status) {
    case 'RECEBIDO':
      return {
        rotulo: 'Recebido',
        icone: '📥',
        classesSelo: 'bg-alerta-fundo text-alerta border-2 border-alerta/50',
      };
    case 'FAZENDO':
      return {
        rotulo: 'Fazendo na cozinha',
        icone: '👩‍🍳',
        classesSelo: 'bg-doce-de-leite/45 text-chocolate border-2 border-caramelo/50',
      };
    case 'PRONTO':
      return {
        rotulo: 'Pronto',
        icone: '✅',
        classesSelo: 'bg-sucesso-fundo text-sucesso border-2 border-sucesso/50',
      };
    case 'SAIU':
      return {
        rotulo: 'Saiu para entrega',
        icone: '🛵',
        classesSelo: 'bg-sucesso-fundo text-sucesso border-2 border-sucesso/50',
      };
    case 'ENTREGUE':
      return {
        rotulo: 'Entregue',
        icone: '🎉',
        classesSelo: 'bg-creme text-chocolate-suave border-2 border-borda',
      };
    case 'CANCELADO':
      return {
        rotulo: 'Cancelado',
        icone: '❌',
        classesSelo: 'bg-erro-fundo text-erro border-2 border-erro/50',
      };
  }
}

export function obterInfoStatusOrcamento(status: StatusOrcamento): InfoVisualStatus {
  switch (status) {
    case 'NOVO':
      return {
        rotulo: 'Novo pedido de orçamento',
        icone: '✨',
        classesSelo: 'bg-alerta-fundo text-alerta border-2 border-alerta/60',
      };
    case 'RESPONDIDO':
      return {
        rotulo: 'Já respondi',
        icone: '💬',
        classesSelo: 'bg-doce-de-leite/45 text-chocolate border-2 border-caramelo/50',
      };
    case 'FECHADO':
      return {
        rotulo: 'Fechou!',
        icone: '🎉',
        classesSelo: 'bg-sucesso-fundo text-sucesso border-2 border-sucesso/60',
      };
    case 'RECUSADO':
      return {
        rotulo: 'Não fechou',
        icone: '📁',
        classesSelo: 'bg-creme text-chocolate-suave border-2 border-borda',
      };
  }
}

export function primeiroNome(nomeCompleto: string): string {
  const limpo = nomeCompleto.trim();
  if (!limpo) return 'cliente';
  return limpo.split(/\s+/)[0];
}

export function montarMensagemWhatsappPedido(pedido: PedidoResumo): string {
  return mensagemStatusParaCliente(pedido.status, pedido);
}

export function linkWhatsappPedido(pedido: PedidoResumo): string {
  return linkWhatsapp(pedido.cliente.whatsapp, montarMensagemWhatsappPedido(pedido));
}

export function montarMensagemWhatsappFesta(orcamento: OrcamentoFesta): string {
  const nome = primeiroNome(orcamento.nome);
  const qtdTexto = orcamento.quantidadeDoces
    ? ` (${orcamento.quantidadeDoces} doces)`
    : '';
  return `Oi ${nome}! Aqui é a dona Lurdes da Doces da Lurdes 🍬 Vi seu pedido de orçamento para ${orcamento.tipoEvento}${qtdTexto}. Vamos conversar sobre os doces da sua festa 😊`;
}

export function linkWhatsappFesta(orcamento: OrcamentoFesta): string {
  return linkWhatsapp(orcamento.whatsapp, montarMensagemWhatsappFesta(orcamento));
}

const NOMES_DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const NOMES_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * Formata o título de um grupo de dia nos Próximos dias:
 * Ex.: "Amanhã, domingo 8" ou "Segunda-feira, 9 de novembro".
 */
export function formatarTituloDiaProximo(data: DataISO, hoje: DataISO): string {
  const d = new Date(`${data}T00:00:00Z`);
  const diaSemana = NOMES_DIAS_SEMANA[d.getUTCDay()];
  const diaMes = d.getUTCDate();
  const mes = NOMES_MESES[d.getUTCMonth()];
  const diff = diasEntre(hoje, data);

  if (diff === 1) {
    return `Amanhã, ${diaSemana.toLowerCase()} ${diaMes}`;
  }
  return `${diaSemana}, ${diaMes} de ${mes}`;
}
