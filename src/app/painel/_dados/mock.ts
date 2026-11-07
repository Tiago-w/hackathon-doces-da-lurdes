import type {
  DataISO,
  DiaCalendario,
  EntradaEditarDiaCalendario,
  FiltroPedidos,
  OrcamentoFesta,
  PedidoResumo,
  Produto,
  StatusOrcamento,
  StatusPedido,
} from '@/lib/contrato';
import { diasEntre, hojeEmPelotas, somarDias } from '@/lib/datas';

interface PedidoSimuladoTemplate {
  cliente: { nome: string; whatsapp: string };
  formaEntrega: 'RETIRADA' | 'ENTREGA';
  bairro: string | null;
  endereco: string | null;
  observacao: string | null;
  statusPagamento: 'PAGO' | 'PENDENTE';
  itens: { slug: string; nomeProduto: string; quantidade: number; precoUnitCentavos: number }[];
  freteCentavos: number;
}

interface EstadoMockPainel {
  dataReferencia: string;
  catalogo: Produto[];
  pedidos: PedidoResumo[];
  orcamentos: OrcamentoFesta[];
  agendaDias: Record<DataISO, { aberto: boolean; limiteCaixas: number | null; observacao: string | null }>;
  proximoCodigo: number;
  indiceSimulado: number;
  proximoSimuladoEmMs: number;
}

const FILA_PEDIDOS_NOVOS: PedidoSimuladoTemplate[] = [
  {
    cliente: { nome: 'Dona Vera Lúcia', whatsapp: '53991445566' },
    formaEntrega: 'ENTREGA',
    bairro: 'Porto',
    endereco: 'Rua Gomes Carneiro, 1120',
    observacao: 'Se puder mandar bem fresquinho para o café das 17h, obrigada!',
    statusPagamento: 'PAGO',
    itens: [
      { slug: 'prod-quindim', nomeProduto: 'Quindim', quantidade: 10, precoUnitCentavos: 450 },
      {
        slug: 'prod-santa-clara',
        nomeProduto: 'Pastel de Santa Clara',
        quantidade: 8,
        precoUnitCentavos: 500,
      },
    ],
    freteCentavos: 1000,
  },
  {
    cliente: { nome: 'Lucas Borges', whatsapp: '53991778899' },
    formaEntrega: 'RETIRADA',
    bairro: null,
    endereco: null,
    observacao: 'Passo buscar saindo do trabalho.',
    statusPagamento: 'PENDENTE',
    itens: [
      { slug: 'prod-camafeu', nomeProduto: 'Camafeu de Nozes', quantidade: 12, precoUnitCentavos: 550 },
      { slug: 'prod-ninho', nomeProduto: 'Brigadeiro de Ninho', quantidade: 12, precoUnitCentavos: 400 },
    ],
    freteCentavos: 0,
  },
  {
    cliente: { nome: 'Patrícia Alves', whatsapp: '53991882233' },
    formaEntrega: 'ENTREGA',
    bairro: 'Simões Lopes',
    endereco: 'Av. Visconde da Graça, 440',
    observacao: null,
    statusPagamento: 'PAGO',
    itens: [
      { slug: 'prod-trouxinha', nomeProduto: 'Trouxinha de Ovos', quantidade: 10, precoUnitCentavos: 500 },
      { slug: 'prod-olho-sogra', nomeProduto: 'Olho de Sogra', quantidade: 10, precoUnitCentavos: 450 },
    ],
    freteCentavos: 1000,
  },
  {
    cliente: { nome: 'Gustavo Silveira', whatsapp: '53991993344' },
    formaEntrega: 'RETIRADA',
    bairro: null,
    endereco: null,
    observacao: 'Separar em duas caixinhas, por favor.',
    statusPagamento: 'PAGO',
    itens: [
      { slug: 'prod-bem-casado', nomeProduto: 'Bem-Casado', quantidade: 16, precoUnitCentavos: 500 },
    ],
    freteCentavos: 0,
  },
];

function criarEstadoInicial(): EstadoMockPainel {
  const hoje = hojeEmPelotas();
  const agora = Date.now();
  const isoMinutosAtras = (min: number) => new Date(agora - min * 60_000).toISOString();

  const catalogo: Produto[] = [
    {
      id: 'prod-quindim',
      nome: 'Quindim',
      descricao: 'Gema, açúcar e coco, assado em banho-maria. Brilhante e macio.',
      precoCentavos: 450,
      fotoUrl: null,
      disponivel: true,
      ordem: 0,
    },
    {
      id: 'prod-ninho',
      nome: 'Brigadeiro de Ninho',
      descricao: 'Leite em pó e leite condensado, enrolado à mão.',
      precoCentavos: 400,
      fotoUrl: null,
      disponivel: true,
      ordem: 1,
    },
    {
      id: 'prod-santa-clara',
      nome: 'Pastel de Santa Clara',
      descricao: 'Massa fininha recheada com doce de ovos tradicional de Pelotas.',
      precoCentavos: 500,
      fotoUrl: null,
      disponivel: true,
      ordem: 2,
    },
    {
      id: 'prod-trouxinha',
      nome: 'Trouxinha de Ovos',
      descricao: 'Fios de ovos em calda, dobrados como uma trouxinha.',
      precoCentavos: 500,
      fotoUrl: null,
      disponivel: true,
      ordem: 3,
    },
    {
      id: 'prod-camafeu',
      nome: 'Camafeu de Nozes',
      descricao: 'Pasta de nozes coberta com fondant e meia noz por cima.',
      precoCentavos: 550,
      fotoUrl: null,
      disponivel: true,
      ordem: 4,
    },
    {
      id: 'prod-olho-sogra',
      nome: 'Olho de Sogra',
      descricao: 'Ameixa macia recheada com doce de coco e ovos.',
      precoCentavos: 450,
      fotoUrl: null,
      disponivel: true,
      ordem: 5,
    },
    {
      id: 'prod-bem-casado',
      nome: 'Bem-Casado',
      descricao: 'Pão de ló fofinho com doce de leite caseiro.',
      precoCentavos: 500,
      fotoUrl: null,
      disponivel: true,
      ordem: 6,
    },
    {
      id: 'prod-brigadeiro',
      nome: 'Brigadeiro Tradicional',
      descricao: 'O clássico de chocolate com granulado macio.',
      precoCentavos: 350,
      fotoUrl: null,
      disponivel: true,
      ordem: 7,
    },
    {
      id: 'prod-queijadinha',
      nome: 'Queijadinha',
      descricao: 'Coco ralado e queijo, com casquinha dourada do forno.',
      precoCentavos: 400,
      fotoUrl: null,
      disponivel: false,
      ordem: 8,
    },
  ];

  const pedidos: PedidoResumo[] = [
    {
      id: 'ped-27',
      codigo: 27,
      tipo: 'AVULSO',
      status: 'RECEBIDO',
      criadoEm: isoMinutosAtras(12),
      dataEntrega: hoje,
      mesmoDia: true,
      cliente: { nome: 'Maria Souza', whatsapp: '53991110001' },
      formaEntrega: 'ENTREGA',
      bairro: 'Centro',
      endereco: 'Rua XV de Novembro, 412',
      observacao: 'É para o aniversário da minha mãe! Se puder colocar um lacinho, agradeço.',
      itens: [
        {
          produtoId: 'prod-quindim',
          nomeProduto: 'Quindim',
          quantidade: 12,
          precoUnitCentavos: 450,
        },
        {
          produtoId: 'prod-ninho',
          nomeProduto: 'Brigadeiro de Ninho',
          quantidade: 6,
          precoUnitCentavos: 400,
        },
      ],
      subtotalCentavos: 12 * 450 + 6 * 400,
      freteCentavos: 1000,
      totalCentavos: 12 * 450 + 6 * 400 + 1000,
      formaPagamento: 'PIX',
      statusPagamento: 'PAGO',
    },
    {
      id: 'ped-28',
      codigo: 28,
      tipo: 'AVULSO',
      status: 'RECEBIDO',
      criadoEm: isoMinutosAtras(5),
      dataEntrega: hoje,
      mesmoDia: true,
      cliente: { nome: 'João Pereira', whatsapp: '53991110002' },
      formaEntrega: 'RETIRADA',
      bairro: null,
      endereco: null,
      observacao: 'Passo aí perto das 16h30.',
      itens: [
        {
          produtoId: 'prod-santa-clara',
          nomeProduto: 'Pastel de Santa Clara',
          quantidade: 10,
          precoUnitCentavos: 500,
        },
        {
          produtoId: 'prod-trouxinha',
          nomeProduto: 'Trouxinha de Ovos',
          quantidade: 6,
          precoUnitCentavos: 500,
        },
      ],
      subtotalCentavos: 10 * 500 + 6 * 500,
      freteCentavos: 0,
      totalCentavos: 10 * 500 + 6 * 500,
      formaPagamento: 'PIX',
      statusPagamento: 'PENDENTE',
    },
    {
      id: 'ped-26',
      codigo: 26,
      tipo: 'CAIXA_50',
      status: 'FAZENDO',
      criadoEm: isoMinutosAtras(180),
      dataEntrega: hoje,
      mesmoDia: false,
      cliente: { nome: 'Carla Mendes', whatsapp: '53991110004' },
      formaEntrega: 'ENTREGA',
      bairro: 'Laranjal',
      endereco: 'Av. Rio Grande do Sul, 850',
      observacao: 'Interfone 12. Ligar ao chegar.',
      itens: [
        { produtoId: 'prod-quindim', nomeProduto: 'Quindim', quantidade: 15, precoUnitCentavos: 0 },
        {
          produtoId: 'prod-camafeu',
          nomeProduto: 'Camafeu de Nozes',
          quantidade: 15,
          precoUnitCentavos: 0,
        },
        {
          produtoId: 'prod-olho-sogra',
          nomeProduto: 'Olho de Sogra',
          quantidade: 10,
          precoUnitCentavos: 0,
        },
        {
          produtoId: 'prod-bem-casado',
          nomeProduto: 'Bem-Casado',
          quantidade: 10,
          precoUnitCentavos: 0,
        },
      ],
      subtotalCentavos: 14000,
      freteCentavos: 2200,
      totalCentavos: 16200,
      formaPagamento: 'PIX',
      statusPagamento: 'PAGO',
    },
    {
      id: 'ped-25',
      codigo: 25,
      tipo: 'AVULSO',
      status: 'PRONTO',
      criadoEm: isoMinutosAtras(95),
      dataEntrega: hoje,
      mesmoDia: true,
      cliente: { nome: 'Seu Roberto', whatsapp: '53991110005' },
      formaEntrega: 'RETIRADA',
      bairro: null,
      endereco: null,
      observacao: null,
      itens: [
        {
          produtoId: 'prod-camafeu',
          nomeProduto: 'Camafeu de Nozes',
          quantidade: 8,
          precoUnitCentavos: 550,
        },
        { produtoId: 'prod-quindim', nomeProduto: 'Quindim', quantidade: 8, precoUnitCentavos: 450 },
      ],
      subtotalCentavos: 8 * 550 + 8 * 450,
      freteCentavos: 0,
      totalCentavos: 8 * 550 + 8 * 450,
      formaPagamento: 'PIX',
      statusPagamento: 'PAGO',
    },
    {
      id: 'ped-24',
      codigo: 24,
      tipo: 'AVULSO',
      status: 'SAIU',
      criadoEm: isoMinutosAtras(140),
      dataEntrega: hoje,
      mesmoDia: true,
      cliente: { nome: 'Fernanda Costa', whatsapp: '53991110006' },
      formaEntrega: 'ENTREGA',
      bairro: 'Fragata',
      endereco: 'Av. Duque de Caxias, 320, ap. 202',
      observacao: null,
      itens: [
        {
          produtoId: 'prod-brigadeiro',
          nomeProduto: 'Brigadeiro Tradicional',
          quantidade: 20,
          precoUnitCentavos: 350,
        },
        {
          produtoId: 'prod-ninho',
          nomeProduto: 'Brigadeiro de Ninho',
          quantidade: 10,
          precoUnitCentavos: 400,
        },
      ],
      subtotalCentavos: 20 * 350 + 10 * 400,
      freteCentavos: 1000,
      totalCentavos: 20 * 350 + 10 * 400 + 1000,
      formaPagamento: 'PIX',
      statusPagamento: 'PAGO',
    },
    {
      id: 'ped-23',
      codigo: 23,
      tipo: 'AVULSO',
      status: 'ENTREGUE',
      criadoEm: isoMinutosAtras(240),
      dataEntrega: hoje,
      mesmoDia: false,
      cliente: { nome: 'Dona Helena', whatsapp: '53991110007' },
      formaEntrega: 'RETIRADA',
      bairro: null,
      endereco: null,
      observacao: null,
      itens: [
        {
          produtoId: 'prod-bem-casado',
          nomeProduto: 'Bem-Casado',
          quantidade: 12,
          precoUnitCentavos: 500,
        },
      ],
      subtotalCentavos: 12 * 500,
      freteCentavos: 0,
      totalCentavos: 12 * 500,
      formaPagamento: 'PIX',
      statusPagamento: 'PAGO',
    },
    {
      id: 'ped-29',
      codigo: 29,
      tipo: 'CAIXA_50',
      status: 'RECEBIDO',
      criadoEm: isoMinutosAtras(60),
      dataEntrega: somarDias(hoje, 1),
      mesmoDia: false,
      cliente: { nome: 'Ana Lima', whatsapp: '53991110003' },
      formaEntrega: 'ENTREGA',
      bairro: 'Areal',
      endereco: 'Av. Domingos de Almeida, 2000, ap. 31',
      observacao: 'Caixa para café da tarde na firma.',
      itens: [
        { produtoId: 'prod-quindim', nomeProduto: 'Quindim', quantidade: 15, precoUnitCentavos: 0 },
        {
          produtoId: 'prod-camafeu',
          nomeProduto: 'Camafeu de Nozes',
          quantidade: 10,
          precoUnitCentavos: 0,
        },
        {
          produtoId: 'prod-santa-clara',
          nomeProduto: 'Pastel de Santa Clara',
          quantidade: 15,
          precoUnitCentavos: 0,
        },
        {
          produtoId: 'prod-ninho',
          nomeProduto: 'Brigadeiro de Ninho',
          quantidade: 10,
          precoUnitCentavos: 0,
        },
      ],
      subtotalCentavos: 14000,
      freteCentavos: 1500,
      totalCentavos: 15500,
      formaPagamento: 'PIX',
      statusPagamento: 'PAGO',
    },
    {
      id: 'ped-30',
      codigo: 30,
      tipo: 'CAIXA_50',
      status: 'FAZENDO',
      criadoEm: isoMinutosAtras(300),
      dataEntrega: somarDias(hoje, 1),
      mesmoDia: false,
      cliente: { nome: 'Marcos Oliveira', whatsapp: '53991110008' },
      formaEntrega: 'RETIRADA',
      bairro: null,
      endereco: null,
      observacao: null,
      itens: [
        {
          produtoId: 'prod-brigadeiro',
          nomeProduto: 'Brigadeiro Tradicional',
          quantidade: 25,
          precoUnitCentavos: 0,
        },
        {
          produtoId: 'prod-ninho',
          nomeProduto: 'Brigadeiro de Ninho',
          quantidade: 25,
          precoUnitCentavos: 0,
        },
      ],
      subtotalCentavos: 14000,
      freteCentavos: 0,
      totalCentavos: 14000,
      formaPagamento: 'PIX',
      statusPagamento: 'PENDENTE',
    },
    {
      id: 'ped-31',
      codigo: 31,
      tipo: 'CAIXA_50',
      status: 'RECEBIDO',
      criadoEm: isoMinutosAtras(400),
      dataEntrega: somarDias(hoje, 2),
      mesmoDia: false,
      cliente: { nome: 'Beatriz Santos', whatsapp: '53991110009' },
      formaEntrega: 'ENTREGA',
      bairro: 'Três Vendas',
      endereco: 'Av. Fernando Osório, 1540',
      observacao: 'Forminhas brancas, por favor.',
      itens: [
        {
          produtoId: 'prod-bem-casado',
          nomeProduto: 'Bem-Casado',
          quantidade: 20,
          precoUnitCentavos: 0,
        },
        {
          produtoId: 'prod-olho-sogra',
          nomeProduto: 'Olho de Sogra',
          quantidade: 15,
          precoUnitCentavos: 0,
        },
        {
          produtoId: 'prod-trouxinha',
          nomeProduto: 'Trouxinha de Ovos',
          quantidade: 15,
          precoUnitCentavos: 0,
        },
      ],
      subtotalCentavos: 14000,
      freteCentavos: 1500,
      totalCentavos: 15500,
      formaPagamento: 'PIX',
      statusPagamento: 'PAGO',
    },
  ];

  const orcamentos: OrcamentoFesta[] = [
    {
      id: 'orc-1',
      criadoEm: isoMinutosAtras(45),
      nome: 'Luciana Silveira',
      whatsapp: '53991234567',
      dataEvento: somarDias(hoje, 30),
      tipoEvento: 'Casamento',
      quantidadeDoces: 600,
      observacao: 'Gostaríamos de bem-casados, camafeus e quindins. Festa no salão do Centro.',
      status: 'NOVO',
    },
    {
      id: 'orc-2',
      criadoEm: isoMinutosAtras(190),
      nome: 'Pedro Azevedo',
      whatsapp: '53998765432',
      dataEvento: somarDias(hoje, 18),
      tipoEvento: 'Formatura',
      quantidadeDoces: 300,
      observacao: 'Formatura da UFPel. Preciso saber valor de entrega no Laranjal.',
      status: 'NOVO',
    },
    {
      id: 'orc-3',
      criadoEm: isoMinutosAtras(720),
      nome: 'Cláudia Vieira',
      whatsapp: '53993334444',
      dataEvento: somarDias(hoje, 12),
      tipoEvento: 'Aniversário de 80 anos',
      quantidadeDoces: 150,
      observacao: 'Doces tradicionais de Pelotas variados.',
      status: 'RESPONDIDO',
    },
  ];

  return {
    dataReferencia: hoje,
    catalogo,
    pedidos,
    orcamentos,
    agendaDias: {},
    proximoCodigo: 32,
    indiceSimulado: 0,
    // Primeiro pedido novo chega ~6s após a inicialização (aparece no primeiro ciclo de 10s),
    // e os seguintes chegam a cada 60s.
    proximoSimuladoEmMs: agora + 6_000,
  };
}

const globalParaMock = globalThis as unknown as {
  __estadoMockPainelLurdes?: EstadoMockPainel;
};

function obterEstado(): EstadoMockPainel {
  const hoje = hojeEmPelotas();
  if (
    !globalParaMock.__estadoMockPainelLurdes ||
    globalParaMock.__estadoMockPainelLurdes.dataReferencia !== hoje
  ) {
    globalParaMock.__estadoMockPainelLurdes = criarEstadoInicial();
  }
  return globalParaMock.__estadoMockPainelLurdes;
}

function verificarPedidoNovoSimulado(estado: EstadoMockPainel): void {
  const agora = Date.now();
  if (estado.indiceSimulado >= FILA_PEDIDOS_NOVOS.length) return;
  if (agora < estado.proximoSimuladoEmMs) return;

  const template = FILA_PEDIDOS_NOVOS[estado.indiceSimulado];
  const codigo = estado.proximoCodigo++;
  estado.indiceSimulado += 1;
  estado.proximoSimuladoEmMs = agora + 60_000;

  const subtotalCentavos = template.itens.reduce(
    (acc, item) => acc + item.quantidade * item.precoUnitCentavos,
    0,
  );

  const novoPedido: PedidoResumo = {
    id: `ped-${codigo}`,
    codigo,
    tipo: 'AVULSO',
    status: 'RECEBIDO',
    criadoEm: new Date(agora).toISOString(),
    dataEntrega: hojeEmPelotas(),
    mesmoDia: true,
    cliente: template.cliente,
    formaEntrega: template.formaEntrega,
    bairro: template.bairro,
    endereco: template.endereco,
    observacao: template.observacao,
    itens: template.itens.map((i) => ({
      produtoId: i.slug,
      nomeProduto: i.nomeProduto,
      quantidade: i.quantidade,
      precoUnitCentavos: i.precoUnitCentavos,
    })),
    subtotalCentavos,
    freteCentavos: template.freteCentavos,
    totalCentavos: subtotalCentavos + template.freteCentavos,
    formaPagamento: 'PIX',
    statusPagamento: template.statusPagamento,
  };

  estado.pedidos.unshift(novoPedido);
}

export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<PedidoResumo[]> {
  const estado = obterEstado();
  verificarPedidoNovoSimulado(estado);

  return estado.pedidos
    .filter((p) => {
      if (filtro.de && p.dataEntrega < filtro.de) return false;
      if (filtro.ate && p.dataEntrega > filtro.ate) return false;
      if (filtro.status && filtro.status.length > 0 && !filtro.status.includes(p.status)) {
        return false;
      }
      return true;
    })
    .map((p) => ({
      ...p,
      cliente: { ...p.cliente },
      itens: p.itens.map((i) => ({ ...i })),
    }));
}

export async function mudarStatus(pedidoId: string, status: StatusPedido): Promise<void> {
  const estado = obterEstado();
  const pedido = estado.pedidos.find((p) => p.id === pedidoId);
  if (!pedido) {
    throw new Error('Não encontrei esse pedido. Atualize a tela e tente de novo.');
  }
  pedido.status = status;
}

export async function listarCatalogo(): Promise<Produto[]> {
  const estado = obterEstado();
  return [...estado.catalogo]
    .sort((a, b) => a.ordem - b.ordem)
    .map((p) => ({ ...p }));
}

export async function marcarDisponivel(produtoId: string, disponivel: boolean): Promise<void> {
  const estado = obterEstado();
  const produto = estado.catalogo.find((p) => p.id === produtoId);
  if (!produto) {
    throw new Error('Não encontrei esse sabor.');
  }
  produto.disponivel = disponivel;
}

export async function mudarPreco(produtoId: string, precoCentavos: number): Promise<void> {
  if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) {
    throw new Error('Digite um valor válido maior que zero.');
  }
  const estado = obterEstado();
  const produto = estado.catalogo.find((p) => p.id === produtoId);
  if (!produto) {
    throw new Error('Não encontrei esse sabor.');
  }
  produto.precoCentavos = precoCentavos;
}

export async function listarOrcamentosFesta(): Promise<OrcamentoFesta[]> {
  const estado = obterEstado();
  return [...estado.orcamentos]
    .sort((a, b) => {
      if (a.status === 'NOVO' && b.status !== 'NOVO') return -1;
      if (a.status !== 'NOVO' && b.status === 'NOVO') return 1;
      return b.criadoEm.localeCompare(a.criadoEm);
    })
    .map((o) => ({ ...o }));
}

export async function mudarStatusOrcamento(id: string, status: StatusOrcamento): Promise<void> {
  const estado = obterEstado();
  const orc = estado.orcamentos.find((o) => o.id === id);
  if (!orc) {
    throw new Error('Não encontrei esse orçamento de festa.');
  }
  orc.status = status;
}

export async function listarCalendario(): Promise<DiaCalendario[]> {
  const estado = obterEstado();
  const hoje = hojeEmPelotas();
  const limitePadrao = 5;
  const dias: DiaCalendario[] = [];

  for (let i = 0; i < 30; i++) {
    const data = somarDias(hoje, i);
    const regra = estado.agendaDias[data];
    const aberto = regra ? regra.aberto : true;
    const limitePersonalizado = typeof regra?.limiteCaixas === 'number';
    const limiteCaixas = limitePersonalizado ? (regra!.limiteCaixas as number) : limitePadrao;
    const pedidosDia = estado.pedidos.filter((p) => p.dataEntrega === data && p.status !== 'CANCELADO');
    const caixasAgendadas = pedidosDia.filter((p) => p.tipo === 'CAIXA_50').length;
    const totalPedidos = pedidosDia.length;
    const vagasCaixaRestantes = !aberto ? 0 : Math.max(0, limiteCaixas - caixasAgendadas);

    dias.push({
      data,
      aberto,
      limiteCaixas,
      limitePersonalizado,
      caixasAgendadas,
      totalPedidos,
      vagasCaixaRestantes,
      observacao: regra?.observacao ?? null,
      disponivelAvulso: aberto,
      disponivelCaixa: aberto && diasEntre(hoje, data) >= 5 && caixasAgendadas < limiteCaixas,
    });
  }

  return dias;
}

export async function editarDiaCalendario(entrada: EntradaEditarDiaCalendario): Promise<void> {
  const estado = obterEstado();
  estado.agendaDias[entrada.data] = {
    aberto: entrada.aberto,
    limiteCaixas: entrada.limiteCaixas,
    observacao: entrada.observacao ? entrada.observacao.trim().slice(0, 140) || null : null,
  };
}
