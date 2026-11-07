/**
 * Regras de negócio da Doces da Lurdes. Dono: Dev 1.
 *
 * Funções PURAS: não acessam banco nem relógio. Quem chama (src/server/) carrega os dados,
 * passa o "agora" em Pelotas e grava o resultado. Assim cada regra é testável isoladamente
 * (ver regras.test.ts).
 *
 * Todas as mensagens são para o cliente final ou para a dona Lurdes: português simples, sem jargão.
 */
import {
  QUANTIDADE_CAIXA,
  type DataISO,
  type DataPermitida,
  type EntradaOrcamentoFesta,
  type EntradaPedido,
  type ErroCampo,
  type FormaEntrega,
  type ResultadoCalculo,
  type StatusPedido,
} from './contrato';
import { antesDoHorario, dataAmigavel, diasEntre, ehDataISO, somarDias } from './datas';
import { formatarReais } from './dinheiro';
import { normalizarWhatsapp, whatsappValido } from './whatsapp';

// ---------- Contexto que o servidor carrega do banco ----------

export interface ConfigRegras {
  precoCaixa50Centavos: number;
  horarioCorteMesmoDia: string;
  antecedenciaDiasCaixaFesta: number;
  limiteCaixasPorDia: number;
  freteCortesiaAcimaCentavos: number;
}

export interface ProdutoRegras {
  id: string;
  nome: string;
  precoCentavos: number;
  disponivel: boolean;
}

export interface BairroRegras {
  id: string;
  nome: string;
  freteCentavos: number;
}

export interface RegraDiaCalendario {
  aberto: boolean;
  limiteCaixas: number | null;
  observacao: string | null;
}

export interface ContextoPedido {
  config: ConfigRegras;
  /** Só produtos ativos. Indisponíveis entram (com disponivel=false) para a mensagem citar o nome. */
  produtos: ReadonlyMap<string, ProdutoRegras>;
  /** Só bairros ativos. */
  bairros: ReadonlyMap<string, BairroRegras>;
  /** Caixas de 50 já marcadas por data de entrega (pedidos não cancelados). */
  caixasPorDia: Readonly<Record<DataISO, number>>;
  /** Exceções do calendário configuradas pela dona Lurdes (dias fechados ou limites especiais). */
  agendaPersonalizada?: Readonly<Record<DataISO, RegraDiaCalendario>>;
  /** Agora, no fuso de Pelotas. */
  agora: { data: DataISO; hora: string };
}

/** Quantos dias de calendário o cliente consegue escolher. */
export const JANELA_DIAS = 30;

export const LIMITES = {
  nome: { min: 2, max: 80 },
  endereco: { min: 5, max: 200 },
  observacao: 500,
  observacaoFesta: 1000,
  tipoEvento: 60,
  quantidadePorSabor: QUANTIDADE_CAIXA,
  quantidadeFesta: 100_000,
  precoMaximoCentavos: 100_000, // R$ 1.000 por doce: acima disso é erro de digitação
} as const;

// ---------- Itens ----------

export interface ItemNormalizado {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  /** Preço unitário da época; 0 na Caixa de 50 (o preço é o da caixa). */
  precoUnitCentavos: number;
}

/**
 * Junta itens repetidos, descarta quantidade 0 e confere se cada sabor existe e está disponível.
 */
export function normalizarItens(
  itens: readonly { produtoId: string; quantidade: number }[],
  tipo: 'AVULSO' | 'CAIXA_50',
  produtos: ReadonlyMap<string, ProdutoRegras>,
): { itens: ItemNormalizado[]; erros: ErroCampo[] } {
  const erros: ErroCampo[] = [];
  const somados = new Map<string, number>();

  for (const item of itens) {
    if (!Number.isInteger(item.quantidade) || item.quantidade < 0) {
      erros.push({ campo: 'itens', produtoId: item.produtoId, mensagem: 'A quantidade precisa ser um número inteiro.' });
      continue;
    }
    if (item.quantidade === 0) continue;
    somados.set(item.produtoId, (somados.get(item.produtoId) ?? 0) + item.quantidade);
  }

  const resultado: ItemNormalizado[] = [];
  for (const [produtoId, quantidade] of somados) {
    const produto = produtos.get(produtoId);
    if (!produto) {
      erros.push({ campo: 'itens', produtoId, mensagem: 'Um dos doces escolhidos não está mais no cardápio. Escolha outro.' });
      continue;
    }
    if (!produto.disponivel) {
      erros.push({
        campo: 'itens',
        produtoId,
        mensagem: `O ${produto.nome} acabou por hoje (falta ingrediente fresco). Troque por outro sabor.`,
      });
      continue;
    }
    if (quantidade > LIMITES.quantidadePorSabor) {
      erros.push({ campo: 'itens', produtoId, mensagem: `Escolha no máximo ${LIMITES.quantidadePorSabor} unidades de ${produto.nome}.` });
      continue;
    }
    resultado.push({
      produtoId,
      nomeProduto: produto.nome,
      quantidade,
      precoUnitCentavos: tipo === 'CAIXA_50' ? 0 : produto.precoCentavos,
    });
  }
  return { itens: resultado, erros };
}

export function totalDeDoces(itens: readonly { quantidade: number }[]): number {
  return itens.reduce((soma, i) => soma + i.quantidade, 0);
}

/** Erro de quantidade conforme o tipo, ou null se estiver certo. */
export function erroDeQuantidade(tipo: 'AVULSO' | 'CAIXA_50', total: number): ErroCampo | null {
  if (tipo === 'CAIXA_50') {
    if (total === QUANTIDADE_CAIXA) return null;
    if (total < QUANTIDADE_CAIXA) {
      const faltam = QUANTIDADE_CAIXA - total;
      const falta = faltam === 1 ? 'Falta 1 doce' : `Faltam ${faltam}`;
      return { campo: 'itens', mensagem: `Sua caixa tem ${total} doces. ${falta} para completar 50.` };
    }
    const sobram = total - QUANTIDADE_CAIXA;
    return { campo: 'itens', mensagem: `Sua caixa tem ${total} doces. Tire ${sobram} para ficar com 50.` };
  }
  if (total === 0) return { campo: 'itens', mensagem: 'Escolha pelo menos um doce.' };
  if (total >= QUANTIDADE_CAIXA) {
    return {
      campo: 'itens',
      mensagem: 'Para 50 doces ou mais, escolha a Caixa de 50 (sai mais em conta) ou peça um orçamento de festa.',
    };
  }
  return null;
}

// ---------- Valores ----------

export function calcularSubtotal(tipo: 'AVULSO' | 'CAIXA_50', itens: readonly ItemNormalizado[], config: ConfigRegras): number {
  if (tipo === 'CAIXA_50') return config.precoCaixa50Centavos;
  return itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitCentavos, 0);
}

/**
 * Frete: retirada é grátis; entrega cobra a taxa do bairro;
 * pedido a partir do valor de cortesia tem frete grátis.
 */
export function calcularFrete(
  formaEntrega: FormaEntrega | undefined,
  bairro: BairroRegras | undefined,
  subtotalCentavos: number,
  config: ConfigRegras,
): { freteCentavos: number; freteCortesia: boolean } {
  if (formaEntrega !== 'ENTREGA' || !bairro) return { freteCentavos: 0, freteCortesia: false };
  if (subtotalCentavos >= config.freteCortesiaAcimaCentavos) return { freteCentavos: 0, freteCortesia: true };
  return { freteCentavos: bairro.freteCentavos, freteCortesia: false };
}

// ---------- Datas ----------

/** A partir de quando cada tipo pode ser entregue. */
export function primeiraDataPossivel(tipo: 'AVULSO' | 'CAIXA_50', ctx: Pick<ContextoPedido, 'config' | 'agora'>): DataISO {
  const { agora, config } = ctx;
  if (tipo === 'CAIXA_50') return somarDias(agora.data, config.antecedenciaDiasCaixaFesta);
  return mesmoDiaAberto(ctx) ? agora.data : somarDias(agora.data, 1);
}

/** Ainda dá para pedir avulso para hoje? */
export function mesmoDiaAberto(ctx: Pick<ContextoPedido, 'config' | 'agora'>): boolean {
  return antesDoHorario(ctx.agora.hora, ctx.config.horarioCorteMesmoDia);
}

export function diaFechado(data: DataISO, ctx: Pick<ContextoPedido, 'agendaPersonalizada'>): boolean {
  return ctx.agendaPersonalizada?.[data]?.aberto === false;
}

export function limiteCaixasNoDia(data: DataISO, ctx: Pick<ContextoPedido, 'config' | 'agendaPersonalizada'>): number {
  const personalizado = ctx.agendaPersonalizada?.[data]?.limiteCaixas;
  return typeof personalizado === 'number' && personalizado >= 0 ? personalizado : ctx.config.limiteCaixasPorDia;
}

export function caixaLotada(data: DataISO, ctx: Pick<ContextoPedido, 'config' | 'caixasPorDia' | 'agendaPersonalizada'>): boolean {
  return (ctx.caixasPorDia[data] ?? 0) >= limiteCaixasNoDia(data, ctx);
}

/** Datas que o cliente pode escolher, já sem os dias fechados ou lotados (Caixa de 50). */
export function datasPermitidas(tipo: 'AVULSO' | 'CAIXA_50', ctx: ContextoPedido): DataPermitida[] {
  const inicio = primeiraDataPossivel(tipo, ctx);
  const datas: DataPermitida[] = [];
  for (let i = 0; i < JANELA_DIAS; i++) {
    const data = somarDias(inicio, i);
    if (diaFechado(data, ctx)) continue;
    if (tipo === 'CAIXA_50' && caixaLotada(data, ctx)) continue;
    datas.push({ data, mesmoDia: data === ctx.agora.data });
  }
  return datas;
}

/** Explica por que uma data não pode ser escolhida (ou null se pode). */
export function erroDeData(tipo: 'AVULSO' | 'CAIXA_50', data: string, ctx: ContextoPedido): ErroCampo | null {
  const campo = 'dataEntrega';
  if (!ehDataISO(data)) return { campo, mensagem: 'Escolha o dia da entrega.' };

  const permitidas = datasPermitidas(tipo, ctx);
  if (permitidas.some((d) => d.data === data)) return null;

  const { agora, config } = ctx;
  if (diasEntre(agora.data, data) < 0) return { campo, mensagem: 'Essa data já passou. Escolha outro dia.' };

  if (diaFechado(data, ctx)) {
    const obs = ctx.agendaPersonalizada?.[data]?.observacao;
    return {
      campo,
      mensagem: obs
        ? `A cozinha estará fechada neste dia (${obs}). Escolha outra data.`
        : 'A cozinha não abre para entregas neste dia. Escolha outra data.',
    };
  }

  if (tipo === 'AVULSO' && data === agora.data) {
    return {
      campo,
      mensagem: `Pedidos para hoje só até as ${config.horarioCorteMesmoDia.replace(':', 'h')}. Escolha amanhã ou outro dia.`,
    };
  }

  if (tipo === 'CAIXA_50' && diasEntre(agora.data, data) < config.antecedenciaDiasCaixaFesta) {
    const primeira = permitidas[0];
    return {
      campo,
      mensagem:
        `A Caixa de 50 precisa de ${config.antecedenciaDiasCaixaFesta} dias de antecedência` +
        (primeira ? `. A primeira data livre é ${dataAmigavel(primeira.data, agora.data)}.` : '.'),
    };
  }

  if (tipo === 'CAIXA_50' && caixaLotada(data, ctx)) {
    return { campo, mensagem: 'Esse dia já está com a agenda cheia. Escolha outra data.' };
  }

  return { campo, mensagem: `Escolha uma data nos próximos ${JANELA_DIAS} dias.` };
}

// ---------- Cliente e entrega ----------

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

/** Texto opcional: vazio vira null; longo demais vira erro. */
function textoOpcional(valor: unknown, max: number, campo: string, erros: ErroCampo[], rotulo: string): string | null {
  const t = texto(valor);
  if (!t) return null;
  if (t.length > max) erros.push({ campo, mensagem: `${rotulo} pode ter até ${max} letras.` });
  return t.slice(0, max);
}

function validarNome(valor: unknown, campo: string, erros: ErroCampo[]): string {
  const nome = texto(valor).replace(/\s+/g, ' ');
  if (nome.length < LIMITES.nome.min) erros.push({ campo, mensagem: 'Escreva seu nome.' });
  else if (nome.length > LIMITES.nome.max) erros.push({ campo, mensagem: `O nome pode ter até ${LIMITES.nome.max} letras.` });
  return nome;
}

function validarWhatsapp(valor: unknown, campo: string, erros: ErroCampo[]): string {
  const bruto = texto(valor);
  if (!bruto) erros.push({ campo, mensagem: 'Escreva seu WhatsApp com DDD.' });
  else if (!whatsappValido(bruto)) erros.push({ campo, mensagem: 'Confira o WhatsApp: precisa ter DDD e 9 dígitos, ex.: (53) 99999-8888.' });
  return normalizarWhatsapp(bruto);
}

// ---------- Avaliação completa do pedido ----------

export type ModoAvaliacao =
  /** Site preenchendo o formulário: só reclama do que já foi preenchido. */
  | 'parcial'
  /** Na hora de criar o pedido: tudo é obrigatório. */
  | 'completo';

export interface PedidoAvaliado extends ResultadoCalculo {
  /** Dados limpos, prontos para gravar. Só confie neles quando ok === true e modo === 'completo'. */
  pedido: {
    tipo: 'AVULSO' | 'CAIXA_50';
    itens: ItemNormalizado[];
    cliente: { nome: string; whatsapp: string };
    formaEntrega: FormaEntrega;
    bairro: BairroRegras | null;
    endereco: string | null;
    dataEntrega: DataISO;
    mesmoDia: boolean;
    observacao: string | null;
  } | null;
}

/**
 * Avalia um pedido (parcial ou completo) e devolve totais, datas permitidas, erros
 * e, se tudo estiver certo, os dados normalizados para gravar.
 */
export function avaliarPedido(entrada: Partial<EntradaPedido>, ctx: ContextoPedido, modo: ModoAvaliacao): PedidoAvaliado {
  const erros: ErroCampo[] = [];
  const completo = modo === 'completo';
  const vazio = (): PedidoAvaliado => ({
    ok: false,
    erros,
    subtotalCentavos: 0,
    freteCentavos: 0,
    freteCortesia: false,
    totalCentavos: 0,
    datasPermitidas: [],
    pedido: null,
  });

  const tipo = entrada.tipo;
  if (tipo !== 'AVULSO' && tipo !== 'CAIXA_50') {
    erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo de pedido: poucos doces ou Caixa de 50.' });
    return vazio();
  }

  // Itens
  const itensEntrada = Array.isArray(entrada.itens) ? entrada.itens : [];
  const { itens, erros: errosItens } = normalizarItens(itensEntrada, tipo, ctx.produtos);
  erros.push(...errosItens);
  if (completo || itensEntrada.length > 0) {
    // Sabor esgotado já gerou erro; não somamos de novo a quantidade dele aqui.
    const total = totalDeDoces(itens) + totalDeDoces(itensEsgotados(itensEntrada, ctx));
    const erroQtd = erroDeQuantidade(tipo, total);
    if (erroQtd) erros.push(erroQtd);
  }

  // Valores
  const subtotalCentavos = calcularSubtotal(tipo, itens, ctx.config);
  const formaEntrega = entrada.formaEntrega;
  if (formaEntrega !== undefined && formaEntrega !== 'RETIRADA' && formaEntrega !== 'ENTREGA') {
    erros.push({ campo: 'formaEntrega', mensagem: 'Escolha se vai buscar ou se quer entrega.' });
  } else if (completo && !formaEntrega) {
    erros.push({ campo: 'formaEntrega', mensagem: 'Escolha se vai buscar ou se quer entrega.' });
  }

  let bairro: BairroRegras | undefined;
  let endereco: string | null = null;
  if (formaEntrega === 'ENTREGA') {
    if (entrada.bairroId) {
      bairro = ctx.bairros.get(entrada.bairroId);
      if (!bairro) erros.push({ campo: 'bairroId', mensagem: 'Ainda não entregamos nesse bairro. Escolha outro ou venha buscar.' });
    } else if (completo) {
      erros.push({ campo: 'bairroId', mensagem: 'Escolha o seu bairro.' });
    }
    const end = texto(entrada.endereco);
    if (end) {
      if (end.length < LIMITES.endereco.min) erros.push({ campo: 'endereco', mensagem: 'Escreva o endereço completo, com número.' });
      else if (end.length > LIMITES.endereco.max) erros.push({ campo: 'endereco', mensagem: `O endereço pode ter até ${LIMITES.endereco.max} letras.` });
      endereco = end.slice(0, LIMITES.endereco.max);
    } else if (completo) {
      erros.push({ campo: 'endereco', mensagem: 'Escreva o endereço da entrega, com número.' });
    }
  }
  const { freteCentavos, freteCortesia } = calcularFrete(formaEntrega, bairro, subtotalCentavos, ctx.config);

  // Datas
  const permitidas = datasPermitidas(tipo, ctx);
  const dataEntrega = texto(entrada.dataEntrega);
  if (dataEntrega || completo) {
    const erroData = erroDeData(tipo, dataEntrega, ctx);
    if (erroData) erros.push(erroData);
  }

  // Cliente
  const clienteEntrada = entrada.cliente;
  const cliente = { nome: '', whatsapp: '' };
  if (completo || clienteEntrada?.nome) cliente.nome = validarNome(clienteEntrada?.nome, 'cliente.nome', erros);
  if (completo || clienteEntrada?.whatsapp) cliente.whatsapp = validarWhatsapp(clienteEntrada?.whatsapp, 'cliente.whatsapp', erros);

  const observacao = textoOpcional(entrada.observacao, LIMITES.observacao, 'observacao', erros, 'A observação');

  if (completo) {
    if (entrada.formaPagamento !== 'PIX') erros.push({ campo: 'formaPagamento', mensagem: 'Por enquanto aceitamos só Pix.' });
    if (entrada.aceitouPrivacidade !== true) {
      erros.push({ campo: 'aceitouPrivacidade', mensagem: 'Para fazer o pedido, marque que leu o aviso de privacidade.' });
    }
  }

  const ok = erros.length === 0;
  return {
    ok,
    erros,
    subtotalCentavos,
    freteCentavos,
    freteCortesia,
    totalCentavos: subtotalCentavos + freteCentavos,
    datasPermitidas: permitidas,
    pedido:
      ok && completo
        ? {
            tipo,
            itens,
            cliente,
            formaEntrega: formaEntrega as FormaEntrega,
            bairro: bairro ?? null,
            endereco: formaEntrega === 'ENTREGA' ? endereco : null,
            dataEntrega,
            mesmoDia: dataEntrega === ctx.agora.data,
            observacao,
          }
        : null,
  };
}

/** Itens de sabores esgotados (para a contagem da caixa não mostrar "faltam" errado). */
function itensEsgotados(itens: readonly { produtoId: string; quantidade: number }[], ctx: ContextoPedido) {
  return itens.filter((i) => ctx.produtos.get(i.produtoId)?.disponivel === false && Number.isInteger(i.quantidade) && i.quantidade > 0);
}

// ---------- Orçamento de festa ----------

export interface OrcamentoAvaliado {
  ok: boolean;
  erros: ErroCampo[];
  dados: {
    nome: string;
    whatsapp: string;
    dataEvento: DataISO;
    tipoEvento: string;
    quantidadeDoces: number | null;
    observacao: string | null;
  } | null;
}

export function avaliarOrcamentoFesta(
  entrada: Partial<EntradaOrcamentoFesta>,
  ctx: Pick<ContextoPedido, 'config' | 'agora'>,
): OrcamentoAvaliado {
  const erros: ErroCampo[] = [];
  const nome = validarNome(entrada.nome, 'nome', erros);
  const whatsapp = validarWhatsapp(entrada.whatsapp, 'whatsapp', erros);

  const tipoEvento = texto(entrada.tipoEvento);
  if (!tipoEvento) erros.push({ campo: 'tipoEvento', mensagem: 'Conte que tipo de festa é.' });
  else if (tipoEvento.length > LIMITES.tipoEvento) erros.push({ campo: 'tipoEvento', mensagem: `Use até ${LIMITES.tipoEvento} letras.` });

  const dataEvento = texto(entrada.dataEvento);
  const antecedencia = ctx.config.antecedenciaDiasCaixaFesta;
  const minima = somarDias(ctx.agora.data, antecedencia);
  if (!ehDataISO(dataEvento)) {
    erros.push({ campo: 'dataEvento', mensagem: 'Escolha a data da festa.' });
  } else if (diasEntre(ctx.agora.data, dataEvento) < antecedencia) {
    erros.push({
      campo: 'dataEvento',
      mensagem: `Para festas, precisamos de pelo menos ${antecedencia} dias. A primeira data possível é ${dataAmigavel(minima, ctx.agora.data)}. Se for urgente, chame no WhatsApp.`,
    });
  } else if (diasEntre(ctx.agora.data, dataEvento) > 730) {
    erros.push({ campo: 'dataEvento', mensagem: 'Confira a data: aceitamos encomendas para até 2 anos.' });
  }

  let quantidadeDoces: number | null = null;
  if (entrada.quantidadeDoces !== null && entrada.quantidadeDoces !== undefined) {
    const q = entrada.quantidadeDoces;
    if (!Number.isInteger(q) || q < 1 || q > LIMITES.quantidadeFesta) {
      erros.push({ campo: 'quantidadeDoces', mensagem: 'Escreva a quantidade aproximada de doces (só números).' });
    } else {
      quantidadeDoces = q;
    }
  }

  const observacao = textoOpcional(entrada.observacao, LIMITES.observacaoFesta, 'observacao', erros, 'A observação');

  if (entrada.aceitouPrivacidade !== true) {
    erros.push({ campo: 'aceitouPrivacidade', mensagem: 'Para pedir o orçamento, marque que leu o aviso de privacidade.' });
  }

  const ok = erros.length === 0;
  return { ok, erros, dados: ok ? { nome, whatsapp, dataEvento, tipoEvento, quantidadeDoces, observacao } : null };
}

// ---------- Status do pedido ----------

/** Próximo passo normal. Retirada pula o "Saiu para entrega". */
export function proximoStatus(atual: StatusPedido, forma: FormaEntrega): StatusPedido | null {
  switch (atual) {
    case 'RECEBIDO':
      return 'FAZENDO';
    case 'FAZENDO':
      return 'PRONTO';
    case 'PRONTO':
      return forma === 'ENTREGA' ? 'SAIU' : 'ENTREGUE';
    case 'SAIU':
      return 'ENTREGUE';
    default:
      return null;
  }
}

/**
 * Pode ir de `atual` para `novo`?
 * - avançar um passo;
 * - voltar ao status anterior (o "Desfazer"), inclusive desfazer um cancelamento;
 * - cancelar qualquer pedido que ainda não foi entregue.
 */
export function transicaoPermitida(
  atual: StatusPedido,
  novo: StatusPedido,
  forma: FormaEntrega,
  anterior: StatusPedido | null,
): boolean {
  if (atual === novo) return false;
  if (proximoStatus(atual, forma) === novo) return true;
  if (anterior !== null && novo === anterior && anterior !== 'CANCELADO') return true;
  if (novo === 'CANCELADO') return atual !== 'ENTREGUE';
  return false;
}

export function mensagemTransicaoInvalida(atual: StatusPedido, novo: StatusPedido): string {
  if (atual === 'CANCELADO') return 'Esse pedido foi cancelado. Para reativar, use o "Desfazer" logo depois de cancelar.';
  if (atual === 'ENTREGUE' && novo === 'CANCELADO') return 'Esse pedido já foi entregue e não pode ser cancelado.';
  return 'Esse pedido mudou de situação em outra tela. A lista foi atualizada; confira e tente de novo.';
}

// ---------- Preço ----------

export function erroDePreco(precoCentavos: number): string | null {
  if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) return 'Escreva um preço válido, por exemplo 4,50.';
  if (precoCentavos > LIMITES.precoMaximoCentavos) return `Confira o preço: ${formatarReais(precoCentavos)} parece alto demais para um doce.`;
  return null;
}
