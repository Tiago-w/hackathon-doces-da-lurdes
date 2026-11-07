/**
 * Textos prontos para o WhatsApp. Pode ser usado no servidor e no navegador.
 *
 * - mensagemPedidoParaLoja: o cliente manda para a loja depois de pagar (com o resumo do pedido).
 *   É também o "plano B" do MVP: mesmo que o painel falhe, o pedido chega no WhatsApp do neto.
 * - mensagemStatusParaCliente: a dona Lurdes/neto mandam para o cliente quando o pedido muda.
 */
import type { FormaEntrega, StatusPedido, TipoPedido } from './contrato';
import { dataAmigavel } from './datas';
import { formatarReais } from './dinheiro';

export interface ResumoParaMensagem {
  codigo: number;
  tipo: TipoPedido;
  cliente: { nome: string };
  dataEntrega: string;
  formaEntrega: FormaEntrega;
  bairro: string | null;
  endereco?: string | null;
  itens: { nomeProduto: string; quantidade: number }[];
  totalCentavos: number;
  observacao?: string | null;
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function mensagemPedidoParaLoja(p: ResumoParaMensagem, hoje?: string): string {
  const linhas = [
    `Oi! Fiz o *pedido ${p.codigo}* pelo site e paguei no Pix. Segue o comprovante.`,
    '',
    p.tipo === 'CAIXA_50' ? '*Caixa de 50*' : '*Doces*',
    ...p.itens.map((i) => `• ${i.quantidade} × ${i.nomeProduto}`),
    '',
    `*Quando:* ${dataAmigavel(p.dataEntrega, hoje)} (${p.dataEntrega.split('-').reverse().join('/')})`,
    p.formaEntrega === 'RETIRADA'
      ? '*Vou buscar*'
      : `*Entrega:* ${[p.endereco, p.bairro].filter(Boolean).join(' – ')}`,
    `*Total:* ${formatarReais(p.totalCentavos)}`,
    `*Nome:* ${p.cliente.nome}`,
  ];
  if (p.observacao) linhas.push(`*Obs.:* ${p.observacao}`);
  return linhas.join('\n');
}

export function mensagemStatusParaCliente(
  status: StatusPedido,
  p: Pick<ResumoParaMensagem, 'codigo' | 'cliente' | 'formaEntrega'>,
): string {
  const nome = primeiroNome(p.cliente.nome);
  const pedido = `seu pedido ${p.codigo} da Doces da Lurdes`;
  switch (status) {
    case 'RECEBIDO':
      return `Oi, ${nome}! Recebemos ${pedido}. Obrigada! 😊`;
    case 'FAZENDO':
      return `Oi, ${nome}! Já estamos fazendo ${pedido}. 🍬`;
    case 'PRONTO':
      return p.formaEntrega === 'RETIRADA'
        ? `Oi, ${nome}! ${capitalizar(pedido)} está pronto. Pode vir buscar! 😊`
        : `Oi, ${nome}! ${capitalizar(pedido)} está pronto e logo sai para entrega. 😊`;
    case 'SAIU':
      return `Oi, ${nome}! ${capitalizar(pedido)} saiu para entrega. 🛵`;
    case 'ENTREGUE':
      return `Oi, ${nome}! Obrigada pela compra. Esperamos que goste dos doces! 💛`;
    case 'CANCELADO':
      return `Oi, ${nome}. Sobre ${pedido}: precisamos conversar, pode nos chamar aqui?`;
  }
}

function capitalizar(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
