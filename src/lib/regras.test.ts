import { describe, expect, it } from 'vitest';
import type { EntradaPedido } from './contrato';
import {
  avaliarOrcamentoFesta,
  avaliarPedido,
  calcularFrete,
  datasPermitidas,
  erroDeData,
  erroDePreco,
  erroDeQuantidade,
  normalizarItens,
  proximoStatus,
  transicaoPermitida,
  type ContextoPedido,
} from './regras';

// Sábado, 7/11/2026, 10h em Pelotas.
function ctx(over: Partial<ContextoPedido> = {}): ContextoPedido {
  return {
    config: {
      precoCaixa50Centavos: 14000,
      horarioCorteMesmoDia: '14:00',
      antecedenciaDiasCaixaFesta: 5,
      limiteCaixasPorDia: 2,
      freteCortesiaAcimaCentavos: 25000,
    },
    produtos: new Map([
      ['quindim', { id: 'quindim', nome: 'Quindim', precoCentavos: 450, disponivel: true }],
      ['camafeu', { id: 'camafeu', nome: 'Camafeu', precoCentavos: 550, disponivel: true }],
      ['ninho', { id: 'ninho', nome: 'Brigadeiro de Ninho', precoCentavos: 400, disponivel: false }],
    ]),
    bairros: new Map([
      ['centro', { id: 'centro', nome: 'Centro', freteCentavos: 1000 }],
      ['laranjal', { id: 'laranjal', nome: 'Laranjal', freteCentavos: 2200 }],
    ]),
    caixasPorDia: {},
    agora: { data: '2026-11-07', hora: '10:00' },
    ...over,
  };
}

const pedidoAvulsoOk: EntradaPedido = {
  tipo: 'AVULSO',
  itens: [
    { produtoId: 'quindim', quantidade: 10 },
    { produtoId: 'camafeu', quantidade: 2 },
  ],
  cliente: { nome: '  Maria   Souza ', whatsapp: '(53) 99999-8888' },
  formaEntrega: 'ENTREGA',
  bairroId: 'centro',
  endereco: 'Rua XV de Novembro, 100',
  dataEntrega: '2026-11-07',
  observacao: '',
  formaPagamento: 'PIX',
  aceitouPrivacidade: true,
};

const caixa = (quindim: number, camafeu: number): EntradaPedido => ({
  ...pedidoAvulsoOk,
  tipo: 'CAIXA_50',
  itens: [
    { produtoId: 'quindim', quantidade: quindim },
    { produtoId: 'camafeu', quantidade: camafeu },
  ],
  dataEntrega: '2026-11-12',
});

describe('itens', () => {
  it('junta itens repetidos e ignora quantidade zero', () => {
    const r = normalizarItens(
      [
        { produtoId: 'quindim', quantidade: 3 },
        { produtoId: 'quindim', quantidade: 2 },
        { produtoId: 'camafeu', quantidade: 0 },
      ],
      'AVULSO',
      ctx().produtos,
    );
    expect(r.erros).toEqual([]);
    expect(r.itens).toEqual([{ produtoId: 'quindim', nomeProduto: 'Quindim', quantidade: 5, precoUnitCentavos: 450 }]);
  });

  it('recusa sabor esgotado citando o nome', () => {
    const r = normalizarItens([{ produtoId: 'ninho', quantidade: 2 }], 'AVULSO', ctx().produtos);
    expect(r.itens).toEqual([]);
    expect(r.erros[0]).toMatchObject({ produtoId: 'ninho' });
    expect(r.erros[0].mensagem).toContain('Brigadeiro de Ninho acabou');
  });

  it('recusa sabor inexistente, quantidade quebrada ou negativa', () => {
    const r = normalizarItens(
      [
        { produtoId: 'xyz', quantidade: 1 },
        { produtoId: 'quindim', quantidade: 1.5 },
        { produtoId: 'camafeu', quantidade: -1 },
      ],
      'AVULSO',
      ctx().produtos,
    );
    expect(r.erros).toHaveLength(3);
  });

  it('na Caixa de 50 o preço unitário é zero (vale o preço da caixa)', () => {
    const r = normalizarItens([{ produtoId: 'quindim', quantidade: 50 }], 'CAIXA_50', ctx().produtos);
    expect(r.itens[0].precoUnitCentavos).toBe(0);
  });
});

describe('quantidade por tipo', () => {
  it('caixa precisa ter exatamente 50', () => {
    expect(erroDeQuantidade('CAIXA_50', 50)).toBeNull();
    expect(erroDeQuantidade('CAIXA_50', 37)?.mensagem).toBe('Sua caixa tem 37 doces. Faltam 13 para completar 50.');
    expect(erroDeQuantidade('CAIXA_50', 52)?.mensagem).toBe('Sua caixa tem 52 doces. Tire 2 para ficar com 50.');
  });

  it('avulso vai de 1 a 49', () => {
    expect(erroDeQuantidade('AVULSO', 0)).not.toBeNull();
    expect(erroDeQuantidade('AVULSO', 1)).toBeNull();
    expect(erroDeQuantidade('AVULSO', 49)).toBeNull();
    expect(erroDeQuantidade('AVULSO', 50)?.mensagem).toContain('Caixa de 50');
  });
});

describe('frete', () => {
  const c = ctx().config;
  const centro = { id: 'centro', nome: 'Centro', freteCentavos: 1000 };

  it('retirada é grátis', () => {
    expect(calcularFrete('RETIRADA', undefined, 5000, c)).toEqual({ freteCentavos: 0, freteCortesia: false });
  });

  it('entrega cobra a taxa do bairro', () => {
    expect(calcularFrete('ENTREGA', centro, 5000, c)).toEqual({ freteCentavos: 1000, freteCortesia: false });
  });

  it('a partir de R$ 250 o frete é cortesia', () => {
    expect(calcularFrete('ENTREGA', centro, 24999, c).freteCortesia).toBe(false);
    expect(calcularFrete('ENTREGA', centro, 25000, c)).toEqual({ freteCentavos: 0, freteCortesia: true });
  });
});

describe('datas', () => {
  it('avulso antes do corte pode sair hoje', () => {
    const d = datasPermitidas('AVULSO', ctx());
    expect(d[0]).toEqual({ data: '2026-11-07', mesmoDia: true });
    expect(d).toHaveLength(30);
  });

  it('avulso no horário do corte já não sai hoje', () => {
    const c = ctx({ agora: { data: '2026-11-07', hora: '14:00' } });
    expect(datasPermitidas('AVULSO', c)[0]).toEqual({ data: '2026-11-08', mesmoDia: false });
    expect(erroDeData('AVULSO', '2026-11-07', c)?.mensagem).toBe('Pedidos para hoje só até as 14h00. Escolha amanhã ou outro dia.');
  });

  it('Caixa de 50 só a partir de 5 dias', () => {
    const c = ctx();
    expect(datasPermitidas('CAIXA_50', c)[0].data).toBe('2026-11-12');
    expect(erroDeData('CAIXA_50', '2026-11-11', c)?.mensagem).toBe(
      'A Caixa de 50 precisa de 5 dias de antecedência. A primeira data livre é quinta, 12 nov.',
    );
  });

  it('dia lotado some da lista e a mensagem explica', () => {
    const c = ctx({ caixasPorDia: { '2026-11-12': 2, '2026-11-13': 1 } });
    const datas = datasPermitidas('CAIXA_50', c).map((d) => d.data);
    expect(datas).not.toContain('2026-11-12');
    expect(datas).toContain('2026-11-13');
    expect(erroDeData('CAIXA_50', '2026-11-12', c)?.mensagem).toContain('agenda cheia');
  });

  it('recusa data passada, inválida e longe demais', () => {
    const c = ctx();
    expect(erroDeData('AVULSO', '2026-11-06', c)?.mensagem).toContain('já passou');
    expect(erroDeData('AVULSO', '07/11/2026', c)?.mensagem).toBe('Escolha o dia da entrega.');
    expect(erroDeData('AVULSO', '2027-03-01', c)?.mensagem).toContain('próximos 30 dias');
  });
});

describe('avaliarPedido (completo)', () => {
  it('pedido avulso certo sai limpo e com totais', () => {
    const r = avaliarPedido(pedidoAvulsoOk, ctx(), 'completo');
    expect(r.erros).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.subtotalCentavos).toBe(10 * 450 + 2 * 550);
    expect(r.freteCentavos).toBe(1000);
    expect(r.totalCentavos).toBe(10 * 450 + 2 * 550 + 1000);
    expect(r.pedido).toMatchObject({
      cliente: { nome: 'Maria Souza', whatsapp: '53999998888' },
      mesmoDia: true,
      observacao: null,
      bairro: { nome: 'Centro' },
    });
  });

  it('caixa certa usa o preço fixo, não a soma', () => {
    const r = avaliarPedido(caixa(30, 20), ctx(), 'completo');
    expect(r.ok).toBe(true);
    expect(r.subtotalCentavos).toBe(14000);
    expect(r.pedido?.itens.every((i) => i.precoUnitCentavos === 0)).toBe(true);
    expect(r.pedido?.mesmoDia).toBe(false);
  });

  it('caixa incompleta não passa', () => {
    const r = avaliarPedido(caixa(30, 19), ctx(), 'completo');
    expect(r.ok).toBe(false);
    expect(r.erros.map((e) => e.mensagem)).toContain('Sua caixa tem 49 doces. Falta 1 doce para completar 50.');
  });

  it('sabor que acabou na caixa: um erro só, sem dizer que "faltam" doces', () => {
    const entrada = { ...caixa(30, 0), itens: [{ produtoId: 'quindim', quantidade: 30 }, { produtoId: 'ninho', quantidade: 20 }] };
    const r = avaliarPedido(entrada, ctx(), 'completo');
    expect(r.erros).toHaveLength(1);
    expect(r.erros[0].produtoId).toBe('ninho');
  });

  it('retirada não exige bairro nem endereço e descarta endereço enviado', () => {
    const r = avaliarPedido({ ...pedidoAvulsoOk, formaEntrega: 'RETIRADA', bairroId: null }, ctx(), 'completo');
    expect(r.ok).toBe(true);
    expect(r.freteCentavos).toBe(0);
    expect(r.pedido?.endereco).toBeNull();
  });

  it('entrega exige bairro atendido e endereço', () => {
    const r = avaliarPedido({ ...pedidoAvulsoOk, bairroId: 'pelotas-de-marte', endereco: '' }, ctx(), 'completo');
    expect(r.erros.map((e) => e.campo)).toEqual(expect.arrayContaining(['bairroId', 'endereco']));
  });

  it('exige aceite da privacidade, nome e WhatsApp válidos', () => {
    const r = avaliarPedido(
      { ...pedidoAvulsoOk, aceitouPrivacidade: false, cliente: { nome: 'M', whatsapp: '3222-1111' } },
      ctx(),
      'completo',
    );
    expect(r.erros.map((e) => e.campo)).toEqual(
      expect.arrayContaining(['aceitouPrivacidade', 'cliente.nome', 'cliente.whatsapp']),
    );
  });

  it('não aceita outro pagamento além de Pix', () => {
    const r = avaliarPedido({ ...pedidoAvulsoOk, formaPagamento: 'CARTAO' as 'PIX' }, ctx(), 'completo');
    expect(r.erros.map((e) => e.campo)).toContain('formaPagamento');
  });
});

describe('avaliarPedido (parcial, enquanto a pessoa preenche)', () => {
  it('só com os itens: mostra totais e datas, sem reclamar do resto', () => {
    const r = avaliarPedido({ tipo: 'AVULSO', itens: [{ produtoId: 'quindim', quantidade: 4 }] }, ctx(), 'parcial');
    expect(r.erros).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.subtotalCentavos).toBe(1800);
    expect(r.datasPermitidas[0].mesmoDia).toBe(true);
    expect(r.pedido).toBeNull();
  });

  it('ao escolher o bairro, já mostra o frete', () => {
    const r = avaliarPedido(
      { tipo: 'AVULSO', itens: [{ produtoId: 'quindim', quantidade: 4 }], formaEntrega: 'ENTREGA', bairroId: 'laranjal' },
      ctx(),
      'parcial',
    );
    expect(r.erros).toEqual([]);
    expect(r.freteCentavos).toBe(2200);
    expect(r.totalCentavos).toBe(1800 + 2200);
  });

  it('sem tipo: pede o tipo', () => {
    expect(avaliarPedido({}, ctx(), 'parcial').erros[0].campo).toBe('tipo');
  });
});

describe('orçamento de festa', () => {
  const ok = {
    nome: 'Ana Lima',
    whatsapp: '53991110003',
    dataEvento: '2026-12-12',
    tipoEvento: 'Casamento',
    quantidadeDoces: 600,
    observacao: 'Tema branco',
    aceitouPrivacidade: true,
  };

  it('aceita orçamento completo', () => {
    const r = avaliarOrcamentoFesta(ok, ctx());
    expect(r.ok).toBe(true);
    expect(r.dados?.quantidadeDoces).toBe(600);
  });

  it('festa precisa de 5 dias', () => {
    const r = avaliarOrcamentoFesta({ ...ok, dataEvento: '2026-11-10' }, ctx());
    expect(r.erros[0].mensagem).toContain('pelo menos 5 dias');
  });

  it('quantidade é opcional, mas se vier tem que ser número inteiro', () => {
    expect(avaliarOrcamentoFesta({ ...ok, quantidadeDoces: null }, ctx()).ok).toBe(true);
    expect(avaliarOrcamentoFesta({ ...ok, quantidadeDoces: 0 }, ctx()).ok).toBe(false);
  });
});

describe('status do pedido', () => {
  it('fluxo de entrega e de retirada', () => {
    expect(proximoStatus('PRONTO', 'ENTREGA')).toBe('SAIU');
    expect(proximoStatus('PRONTO', 'RETIRADA')).toBe('ENTREGUE');
    expect(proximoStatus('ENTREGUE', 'ENTREGA')).toBeNull();
  });

  it('avança um passo, não pula', () => {
    expect(transicaoPermitida('RECEBIDO', 'FAZENDO', 'ENTREGA', null)).toBe(true);
    expect(transicaoPermitida('RECEBIDO', 'PRONTO', 'ENTREGA', null)).toBe(false);
    expect(transicaoPermitida('PRONTO', 'SAIU', 'RETIRADA', 'FAZENDO')).toBe(false);
  });

  it('desfazer volta para o status anterior, inclusive depois de cancelar', () => {
    expect(transicaoPermitida('FAZENDO', 'RECEBIDO', 'ENTREGA', 'RECEBIDO')).toBe(true);
    expect(transicaoPermitida('CANCELADO', 'PRONTO', 'ENTREGA', 'PRONTO')).toBe(true);
    expect(transicaoPermitida('CANCELADO', 'RECEBIDO', 'ENTREGA', 'PRONTO')).toBe(false);
  });

  it('cancela qualquer um que ainda não foi entregue', () => {
    expect(transicaoPermitida('SAIU', 'CANCELADO', 'ENTREGA', 'PRONTO')).toBe(true);
    expect(transicaoPermitida('ENTREGUE', 'CANCELADO', 'ENTREGA', 'SAIU')).toBe(false);
  });
});

describe('preço', () => {
  it('valida o preço digitado no painel', () => {
    expect(erroDePreco(450)).toBeNull();
    expect(erroDePreco(0)).not.toBeNull();
    expect(erroDePreco(4.5)).not.toBeNull();
    expect(erroDePreco(500_000)).toContain('alto demais');
  });
});
