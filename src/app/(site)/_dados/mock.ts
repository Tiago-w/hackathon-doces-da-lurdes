import 'server-only';
/**
 * Mock do site do cliente: implementa o contrato de src/server/loja.ts em memória.
 * Usado enquanto as funções reais do Dev 1 não existem (SITE_USAR_MOCK="true").
 *
 * As regras aqui são uma versão SIMPLES das regras reais, só para o site funcionar de ponta a ponta.
 * Quem manda de verdade é o servidor do Dev 1.
 *
 * Variáveis opcionais para testar cenários:
 * - SITE_MOCK_ESGOTADOS="camafeu,bem-casado"  → sabores marcados como "acabou" (ids separados por vírgula)
 * - SITE_MOCK_AGORA="2026-11-07T15:30:00-03:00" → finge que agora é esse instante (testar o horário de corte)
 */
import type {
  Bairro,
  ConfigPublica,
  DataPermitida,
  EntradaOrcamentoFesta,
  EntradaPedido,
  ErroCampo,
  PedidoConfirmacao,
  Produto,
  ResultadoCalculo,
  ResultadoCriarPedido,
  ResultadoSimples,
} from '@/lib/contrato';
import { QUANTIDADE_CAIXA } from '@/lib/contrato';
import { antesDoHorario, diasEntre, ehDataISO, partesEmPelotas, somarDias } from '@/lib/datas';
import { normalizarWhatsapp, whatsappValido } from '@/lib/whatsapp';

// ---------- Dados de exemplo (mesmos valores fictícios do seed) ----------

const SABORES: Omit<Produto, 'disponivel' | 'ordem'>[] = [
  { id: 'quindim', nome: 'Quindim', descricao: 'Gema, açúcar e coco, assado em banho-maria. Brilhante e macio.', precoCentavos: 450, fotoUrl: null },
  { id: 'brigadeiro-de-ninho', nome: 'Brigadeiro de Ninho', descricao: 'Leite em pó e leite condensado, enrolado à mão.', precoCentavos: 400, fotoUrl: null },
  { id: 'pastel-de-santa-clara', nome: 'Pastel de Santa Clara', descricao: 'Massa fininha recheada com doce de ovos.', precoCentavos: 500, fotoUrl: null },
  { id: 'trouxinha', nome: 'Trouxinha de Ovos', descricao: 'Fios de ovos em calda, dobrados como uma trouxinha.', precoCentavos: 500, fotoUrl: null },
  { id: 'camafeu', nome: 'Camafeu', descricao: 'Pasta de nozes coberta com fondant e meia noz por cima.', precoCentavos: 550, fotoUrl: null },
  { id: 'olho-de-sogra', nome: 'Olho de Sogra', descricao: 'Ameixa recheada com doce de coco e ovos.', precoCentavos: 450, fotoUrl: null },
  { id: 'bem-casado', nome: 'Bem-Casado', descricao: 'Pão de ló com doce de leite, embrulhado no papel.', precoCentavos: 500, fotoUrl: null },
  { id: 'brigadeiro', nome: 'Brigadeiro', descricao: 'O clássico de chocolate com granulado.', precoCentavos: 350, fotoUrl: null },
  { id: 'queijadinha', nome: 'Queijadinha', descricao: 'Coco e queijo, com casquinha dourada.', precoCentavos: 400, fotoUrl: null },
  { id: 'ninho-de-amor', nome: 'Ninho de Amor', descricao: 'Docinho de coco com cravo, assado no forninho.', precoCentavos: 400, fotoUrl: null },
];

const ZONAS: { zona: number; frete: number; bairros: string[] }[] = [
  { zona: 1, frete: 1000, bairros: ['Centro', 'Fragata', 'Simões Lopes', 'Porto'] },
  { zona: 2, frete: 1500, bairros: ['Areal', 'Três Vendas', 'Guabiroba', 'Py Crespo', 'Cohab'] },
  { zona: 3, frete: 2200, bairros: ['Laranjal', 'Balneário dos Prazeres', 'Capão do Leão'] },
];

const BAIRROS: Bairro[] = ZONAS.flatMap((z) =>
  [...z.bairros]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((nome) => ({
      id: nome
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-'),
      nome,
      zona: z.zona,
      freteCentavos: z.frete,
    })),
);

const CONFIG: ConfigPublica = {
  precoCaixa50Centavos: 14000,
  horarioCorteMesmoDia: '14:00',
  antecedenciaDiasCaixaFesta: 5,
  freteCortesiaAcimaCentavos: 25000,
  whatsappLoja: '53900000000',
  enderecoRetirada: 'Centro de Pelotas (combinamos o horário pelo WhatsApp)',
  ambienteTeste: true,
};

/** Em quantos dias a partir de hoje a agenda de caixas está lotada (simula o limite por dia). */
const DIAS_LOTADOS_CAIXA = [7, 12];
const DIAS_NA_AGENDA = 30;

// ---------- Estado em memória (sobrevive ao hot reload do Next) ----------

interface PedidoMock extends PedidoConfirmacao {
  whatsapp: string;
}

interface EstadoMock {
  pedidos: Map<string, PedidoMock>;
  proximoCodigo: number;
  orcamentos: EntradaOrcamentoFesta[];
}
const memoria = globalThis as unknown as { __lojaMock?: EstadoMock };
const estado: EstadoMock = (memoria.__lojaMock ??= { pedidos: new Map(), proximoCodigo: 27, orcamentos: [] });

// ---------- Ajudantes ----------

function agora(): Date {
  const fingido = process.env.SITE_MOCK_AGORA;
  const d = fingido ? new Date(fingido) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function esgotados(): Set<string> {
  const lista = process.env.SITE_MOCK_ESGOTADOS ?? 'camafeu,bem-casado';
  return new Set(lista.split(',').map((x) => x.trim()).filter(Boolean));
}

function catalogo(): Produto[] {
  const fora = esgotados();
  return SABORES.map((s, ordem) => ({ ...s, disponivel: !fora.has(s.id), ordem }));
}

function idAleatorio(): string {
  // Não adivinhável, como o cuid do servidor real.
  return `c${crypto.randomUUID().replace(/-/g, '')}`;
}

/** Placeholder de QR Code: SVG estático com aviso de teste (o real vem do servidor). */
function qrPlaceholder(): string {
  const n = 21;
  let quadrados = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const marcador = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      const ligado = marcador
        ? x % 6 === 0 || y % 6 === 0 || (x % 7 >= 2 && x % 7 <= 4 && y % 7 >= 2 && y % 7 <= 4) || x === n - 1 || x === n - 7
        : (x * 7 + y * 13 + x * y) % 3 === 0;
      if (ligado) quadrados += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><g fill="#3b2416">${quadrados}</g><rect x="4.5" y="8.5" width="12" height="4" fill="#fff" stroke="#b42318" stroke-width="0.3"/><text x="10.5" y="11.3" font-size="2" text-anchor="middle" fill="#b42318" font-family="sans-serif" font-weight="bold">TESTE</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function copiaEColaFicticio(totalCentavos: number, codigo: number): string {
  const valor = (totalCentavos / 100).toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0130pix-teste@docesdalurdes.com.br5204000053039865406${valor}5802BR5915DOCES DA LURDES6007PELOTAS62110507PED${codigo}6304TEST`;
}

function datasPermitidas(entrada: Partial<EntradaPedido>, produtos: Produto[]): DataPermitida[] {
  const { data: hoje, hora } = partesEmPelotas(agora());
  if (entrada.tipo === 'CAIXA_50') {
    const datas: DataPermitida[] = [];
    for (let d = CONFIG.antecedenciaDiasCaixaFesta; d < DIAS_NA_AGENDA + CONFIG.antecedenciaDiasCaixaFesta; d++) {
      if (!DIAS_LOTADOS_CAIXA.includes(d)) datas.push({ data: somarDias(hoje, d), mesmoDia: false });
    }
    return datas;
  }
  const disponiveis = new Set(produtos.filter((p) => p.disponivel).map((p) => p.id));
  const saboresOk = (entrada.itens ?? []).every((i) => disponiveis.has(i.produtoId));
  const mesmoDia = antesDoHorario(hora, CONFIG.horarioCorteMesmoDia) && saboresOk;
  const datas: DataPermitida[] = mesmoDia ? [{ data: hoje, mesmoDia: true }] : [];
  for (let d = 1; d <= DIAS_NA_AGENDA; d++) datas.push({ data: somarDias(hoje, d), mesmoDia: false });
  return datas;
}

/**
 * Validação simples. `completo=false` (calcularPedido) só reclama do que já foi preenchido,
 * para o site ir mostrando o resumo; `completo=true` (criarPedido) exige tudo.
 */
function calcular(entrada: Partial<EntradaPedido>, completo: boolean): ResultadoCalculo {
  const produtos = catalogo();
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const erros: ErroCampo[] = [];
  const itens = entrada.itens ?? [];

  if (entrada.tipo !== 'AVULSO' && entrada.tipo !== 'CAIXA_50') {
    erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo de pedido.' });
  }

  let unidades = 0;
  let somaAvulso = 0;
  for (const item of itens) {
    const p = porId.get(item.produtoId);
    if (!p) {
      erros.push({ campo: 'itens', produtoId: item.produtoId, mensagem: 'Um dos doces não existe mais. Escolha outro sabor.' });
      continue;
    }
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1) {
      erros.push({ campo: 'itens', produtoId: p.id, mensagem: `A quantidade de ${p.nome} não está certa.` });
      continue;
    }
    if (!p.disponivel) {
      erros.push({ campo: 'itens', produtoId: p.id, mensagem: `O ${p.nome} acabou agora há pouco. Troque por outro sabor.` });
    }
    unidades += item.quantidade;
    somaAvulso += item.quantidade * p.precoCentavos;
  }

  if (entrada.itens !== undefined || completo) {
    if (unidades === 0) {
      erros.push({ campo: 'itens', mensagem: 'Escolha pelo menos um doce.' });
    } else if (entrada.tipo === 'CAIXA_50' && unidades !== QUANTIDADE_CAIXA) {
      erros.push({ campo: 'itens', mensagem: `A Caixa precisa ter exatamente 50 doces. Agora tem ${unidades}.` });
    } else if (entrada.tipo === 'AVULSO' && unidades >= QUANTIDADE_CAIXA) {
      erros.push({ campo: 'itens', mensagem: 'Pedido avulso é de até 49 doces. Com 50, monte a Caixa de 50.' });
    }
  }

  const subtotalCentavos = entrada.tipo === 'CAIXA_50' ? (unidades > 0 ? CONFIG.precoCaixa50Centavos : 0) : somaAvulso;

  let freteCentavos = 0;
  let freteCortesia = false;
  if (entrada.formaEntrega === 'ENTREGA') {
    const bairro = BAIRROS.find((b) => b.id === entrada.bairroId);
    if (bairro) {
      if (subtotalCentavos >= CONFIG.freteCortesiaAcimaCentavos) freteCortesia = true;
      else freteCentavos = bairro.freteCentavos;
    } else if (entrada.bairroId || completo) {
      erros.push({ campo: 'bairroId', mensagem: 'Escolha o seu bairro.' });
    }
    if ((entrada.endereco !== undefined || completo) && !entrada.endereco?.trim()) {
      if (completo) erros.push({ campo: 'endereco', mensagem: 'Escreva o endereço para a entrega.' });
    }
  } else if (completo && entrada.formaEntrega !== 'RETIRADA') {
    erros.push({ campo: 'formaEntrega', mensagem: 'Escolha se vai buscar ou se quer entrega.' });
  }

  const datas = datasPermitidas(entrada, produtos);
  if (entrada.dataEntrega || completo) {
    if (!entrada.dataEntrega || !datas.some((d) => d.data === entrada.dataEntrega)) {
      erros.push({ campo: 'dataEntrega', mensagem: 'Essa data não está disponível. Escolha outra.' });
    }
  }

  if (completo) {
    if (!entrada.cliente?.nome?.trim() || entrada.cliente.nome.trim().length < 2) {
      erros.push({ campo: 'cliente.nome', mensagem: 'Escreva o seu nome.' });
    }
    if (!entrada.cliente?.whatsapp || !whatsappValido(entrada.cliente.whatsapp)) {
      erros.push({ campo: 'cliente.whatsapp', mensagem: 'Confira o WhatsApp: DDD e mais 9 números.' });
    }
    if (entrada.aceitouPrivacidade !== true) {
      erros.push({ campo: 'aceitouPrivacidade', mensagem: 'Marque que você concorda com o aviso de privacidade.' });
    }
  }

  return {
    ok: erros.length === 0,
    erros,
    subtotalCentavos,
    freteCentavos,
    freteCortesia,
    totalCentavos: subtotalCentavos + freteCentavos,
    datasPermitidas: datas,
  };
}

async function esperar(ms = 250): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

// ---------- Contrato ----------

export async function listarCatalogo(): Promise<Produto[]> {
  return catalogo();
}

export async function listarBairros(): Promise<Bairro[]> {
  return BAIRROS;
}

export async function obterConfigPublica(): Promise<ConfigPublica> {
  return CONFIG;
}

export async function calcularPedido(entrada: Partial<EntradaPedido>): Promise<ResultadoCalculo> {
  return calcular(entrada, false);
}

export async function criarPedido(entrada: EntradaPedido): Promise<ResultadoCriarPedido> {
  await esperar(600); // simula a rede, para ver o "Enviando..."
  const r = calcular(entrada, true);
  if (!r.ok) return { ok: false, erros: r.erros };

  const porId = new Map(catalogo().map((p) => [p.id, p]));
  const bairro = entrada.formaEntrega === 'ENTREGA' ? BAIRROS.find((b) => b.id === entrada.bairroId) ?? null : null;
  const id = idAleatorio();
  const codigo = estado.proximoCodigo++;
  estado.pedidos.set(id, {
    id,
    codigo,
    tipo: entrada.tipo,
    cliente: { nome: entrada.cliente.nome.trim() },
    whatsapp: normalizarWhatsapp(entrada.cliente.whatsapp),
    dataEntrega: entrada.dataEntrega,
    formaEntrega: entrada.formaEntrega,
    bairro: bairro?.nome ?? null,
    itens: entrada.itens.map((i) => ({ nomeProduto: porId.get(i.produtoId)?.nome ?? i.produtoId, quantidade: i.quantidade })),
    totalCentavos: r.totalCentavos,
    pix: { copiaECola: copiaEColaFicticio(r.totalCentavos, codigo), qrCodeDataUrl: qrPlaceholder() },
    statusPagamento: 'PENDENTE',
  });
  return { ok: true, pedidoId: id };
}

export async function obterPedidoConfirmacao(pedidoId: string): Promise<PedidoConfirmacao | null> {
  const p = estado.pedidos.get(pedidoId);
  if (!p) return null;
  const { whatsapp, ...confirmacao } = p;
  void whatsapp;
  return confirmacao;
}

export async function criarOrcamentoFesta(entrada: EntradaOrcamentoFesta): Promise<ResultadoSimples> {
  await esperar(600);
  const erros: ErroCampo[] = [];
  const hoje = partesEmPelotas(agora()).data;
  if (!entrada.nome?.trim() || entrada.nome.trim().length < 2) erros.push({ campo: 'nome', mensagem: 'Escreva o seu nome.' });
  if (!whatsappValido(entrada.whatsapp ?? '')) erros.push({ campo: 'whatsapp', mensagem: 'Confira o WhatsApp: DDD e mais 9 números.' });
  if (!entrada.tipoEvento?.trim()) erros.push({ campo: 'tipoEvento', mensagem: 'Escolha o tipo de festa.' });
  if (!ehDataISO(entrada.dataEvento) || diasEntre(hoje, entrada.dataEvento) < CONFIG.antecedenciaDiasCaixaFesta) {
    erros.push({ campo: 'dataEvento', mensagem: `A data da festa precisa ser daqui a pelo menos ${CONFIG.antecedenciaDiasCaixaFesta} dias.` });
  }
  if (entrada.quantidadeDoces !== null && (!Number.isInteger(entrada.quantidadeDoces) || entrada.quantidadeDoces < 1)) {
    erros.push({ campo: 'quantidadeDoces', mensagem: 'A quantidade de doces precisa ser um número.' });
  }
  if (entrada.aceitouPrivacidade !== true) {
    erros.push({ campo: 'aceitouPrivacidade', mensagem: 'Marque que você concorda com o aviso de privacidade.' });
  }
  if (erros.length) return { ok: false, erros };
  estado.orcamentos.push({ ...entrada, whatsapp: normalizarWhatsapp(entrada.whatsapp) });
  return { ok: true };
}
