/**
 * Testes de integração: funções reais do servidor contra um Postgres de verdade.
 * Rodar: npm run test:integracao   (precisa do banco no ar: npm run db:up)
 *
 * Usa um banco SEPARADO (<seu banco>_teste), criado e zerado automaticamente.
 * Os dados de desenvolvimento não são tocados.
 */
import 'dotenv/config';
import { Client } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { EntradaPedido } from '@/lib/contrato';
import { hojeEmPelotas, somarDias } from '@/lib/datas';

type Loja = typeof import('./loja');
type Painel = typeof import('./painel');
type Banco = typeof import('@/lib/db');
type Erros = typeof import('@/lib/erros');

let loja: Loja;
let painel: Painel;
let banco: Banco;
let erros: Erros;
let ids: { quindim: string; camafeu: string; ninho: string; centro: string };

const urlPrincipal = process.env.DATABASE_URL ?? '';
const urlTeste = (() => {
  if (!urlPrincipal) return '';
  const u = new URL(urlPrincipal);
  u.pathname = `${u.pathname.replace(/^\//, '')}_teste`;
  return u.toString();
})();
const nomeBancoTeste = urlTeste ? new URL(urlTeste).pathname.slice(1) : '';

async function sql(url: string, comando: string) {
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    return await c.query(comando);
  } finally {
    await c.end();
  }
}

beforeAll(async () => {
  if (!urlPrincipal) throw new Error('DATABASE_URL não definida. Copie .env.example para .env.');
  const existe = await sql(urlPrincipal, `select 1 from pg_database where datname = '${nomeBancoTeste}'`);
  if (existe.rowCount === 0) await sql(urlPrincipal, `create database "${nomeBancoTeste}"`);
  await sql(urlTeste, 'drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;');

  // A conexão do app lê DATABASE_URL na importação: trocamos antes de importar.
  process.env.DATABASE_URL = urlTeste;
  banco = await import('@/lib/db');
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  await migrate(banco.db, { migrationsFolder: 'drizzle' });

  loja = await import('./loja');
  painel = await import('./painel');
  erros = await import('@/lib/erros');
}, 60_000);

beforeEach(async () => {
  const s = banco.schema;
  const db = banco.db;
  await db.delete(s.itensPedido);
  await db.delete(s.pedidos);
  await db.delete(s.orcamentosFesta);
  await db.delete(s.clientes);
  await db.delete(s.produtos);
  await db.delete(s.bairros);
  await db.delete(s.config);

  await db.insert(s.config).values({
    id: 1,
    precoCaixa50Centavos: 14000,
    horarioCorteMesmoDia: '14:00',
    antecedenciaDiasCaixaFesta: 5,
    limiteCaixasPorDia: 1,
    freteCortesiaAcimaCentavos: 25000,
    whatsappLoja: '53900000000',
    enderecoRetirada: 'Centro',
    pixChave: 'pix-teste@docesdalurdes.com.br',
    pixNomeRecebedor: 'DOCES DA LURDES',
    pixCidade: 'PELOTAS',
  });
  const produtos = await db
    .insert(s.produtos)
    .values([
      { slug: 'quindim', nome: 'Quindim', precoCentavos: 450, ordem: 0 },
      { slug: 'camafeu', nome: 'Camafeu', precoCentavos: 550, ordem: 1 },
      { slug: 'ninho', nome: 'Brigadeiro de Ninho', precoCentavos: 400, ordem: 2, disponivel: false },
      { slug: 'antigo', nome: 'Sabor Antigo', precoCentavos: 400, ordem: 3, ativo: false },
    ])
    .returning();
  const [centro] = await db.insert(s.bairros).values({ nome: 'Centro', zona: 1, freteCentavos: 1000 }).returning();
  const porSlug = Object.fromEntries(produtos.map((p) => [p.slug, p.id]));
  ids = { quindim: porSlug.quindim, camafeu: porSlug.camafeu, ninho: porSlug.ninho, centro: centro.id };
});

afterAll(async () => {
  // Fecha o pool do app para o Vitest terminar.
  await (banco?.db.$client as { end?: () => Promise<void> } | undefined)?.end?.();
});

const amanha = () => somarDias(hojeEmPelotas(), 1);
const diaDaCaixa = () => somarDias(hojeEmPelotas(), 5);

function avulso(over: Partial<EntradaPedido> = {}): EntradaPedido {
  return {
    tipo: 'AVULSO',
    itens: [
      { produtoId: ids.quindim, quantidade: 10 },
      { produtoId: ids.camafeu, quantidade: 2 },
    ],
    cliente: { nome: 'Maria Souza', whatsapp: '(53) 99999-8888' },
    formaEntrega: 'ENTREGA',
    bairroId: ids.centro,
    endereco: 'Rua XV de Novembro, 100',
    dataEntrega: amanha(),
    observacao: null,
    formaPagamento: 'PIX',
    aceitouPrivacidade: true,
    ...over,
  };
}

function caixa(whatsapp = '(53) 98888-7777'): EntradaPedido {
  return avulso({
    tipo: 'CAIXA_50',
    itens: [
      { produtoId: ids.quindim, quantidade: 25 },
      { produtoId: ids.camafeu, quantidade: 25 },
    ],
    cliente: { nome: 'Ana Lima', whatsapp },
    dataEntrega: diaDaCaixa(),
  });
}

async function criarOk(entrada: EntradaPedido): Promise<string> {
  const r = await loja.criarPedido(entrada);
  if (!r.ok) throw new Error(`Pedido recusado: ${JSON.stringify(r.erros)}`);
  return r.pedidoId;
}

describe('catálogo e configuração', () => {
  it('lista sabores ativos (inclusive esgotados) e esconde os inativos', async () => {
    const cat = await loja.listarCatalogo();
    expect(cat.map((p) => p.nome)).toEqual(['Quindim', 'Camafeu', 'Brigadeiro de Ninho']);
    expect(cat[2].disponivel).toBe(false);
  });

  it('config pública não expõe a chave Pix', async () => {
    const c = await loja.obterConfigPublica();
    expect(c.precoCaixa50Centavos).toBe(14000);
    expect(JSON.stringify(c)).not.toContain('pix-teste');
  });
});

describe('pedido do site', () => {
  it('calcula enquanto a pessoa preenche', async () => {
    const r = await loja.calcularPedido({ tipo: 'AVULSO', itens: [{ produtoId: ids.quindim, quantidade: 4 }], formaEntrega: 'ENTREGA', bairroId: ids.centro });
    expect(r).toMatchObject({ ok: true, subtotalCentavos: 1800, freteCentavos: 1000, totalCentavos: 2800 });
    expect(r.datasPermitidas.length).toBe(30);
    expect(r).not.toHaveProperty('pedido');
  });

  it('cria o pedido, gera o Pix e mostra a confirmação', async () => {
    const id = await criarOk(avulso());
    const conf = await loja.obterPedidoConfirmacao(id);
    expect(conf).toMatchObject({
      tipo: 'AVULSO',
      cliente: { nome: 'Maria Souza' },
      totalCentavos: 10 * 450 + 2 * 550 + 1000,
      bairro: 'Centro',
      statusPagamento: 'PENDENTE',
    });
    expect(conf?.pix.copiaECola).toContain('540566.00');
    expect(conf?.pix.copiaECola).toContain(`PEDIDO${conf?.codigo}`);
    expect(conf?.pix.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('ignora preço mandado pelo navegador (recalcula tudo)', async () => {
    const malicioso = { ...avulso(), subtotalCentavos: 1, totalCentavos: 1 } as EntradaPedido;
    const id = await criarOk(malicioso);
    expect((await loja.obterPedidoConfirmacao(id))?.totalCentavos).toBe(6600);
  });

  it('recusa sabor esgotado e não grava nada', async () => {
    const r = await loja.criarPedido(avulso({ itens: [{ produtoId: ids.ninho, quantidade: 5 }] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros[0]).toMatchObject({ produtoId: ids.ninho });
    expect(await painel.listarPedidos()).toHaveLength(0);
  });

  it('mesmo cliente (mesmo WhatsApp) não é duplicado e fica com o nome mais recente', async () => {
    await criarOk(avulso());
    await criarOk(avulso({ cliente: { nome: 'Maria S. Souza', whatsapp: '53 99999 8888' } }));
    const clientes = await banco.db.select().from(banco.schema.clientes);
    expect(clientes).toHaveLength(1);
    expect(clientes[0]).toMatchObject({ nome: 'Maria S. Souza', whatsapp: '53999998888' });
  });

  it('entrada sem sentido devolve erro amigável, não quebra', async () => {
    const r = await loja.criarPedido({ tipo: 'AVULSO', itens: 'tudo' } as unknown as EntradaPedido);
    expect(r).toEqual({ ok: false, erros: [{ mensagem: expect.stringContaining('Recarregue a página') }] });
    expect(await loja.obterPedidoConfirmacao('nao-existe')).toBeNull();
    expect(await loja.obterPedidoConfirmacao('00000000-0000-4000-8000-000000000000')).toBeNull();
  });
});

describe('capacidade de Caixas de 50 por dia', () => {
  it('com limite 1, a segunda caixa do mesmo dia é recusada e o dia some da lista', async () => {
    await criarOk(caixa());
    const segunda = await loja.criarPedido(caixa('(53) 97777-6666'));
    expect(segunda.ok).toBe(false);
    if (!segunda.ok) expect(segunda.erros[0].mensagem).toContain('agenda cheia');

    const calc = await loja.calcularPedido({ tipo: 'CAIXA_50' });
    expect(calc.datasPermitidas.map((d) => d.data)).not.toContain(diaDaCaixa());
  });

  it('dois clientes ao mesmo tempo pela última vaga: só um consegue', async () => {
    const resultados = await Promise.all([
      loja.criarPedido(caixa('(53) 91111-1111')),
      loja.criarPedido(caixa('(53) 92222-2222')),
      loja.criarPedido(caixa('(53) 93333-3333')),
    ]);
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
  });

  it('caixa cancelada libera a vaga', async () => {
    const id = await criarOk(caixa());
    await painel.mudarStatus(id, 'CANCELADO');
    await criarOk(caixa('(53) 97777-6666'));
  });
});

describe('Modo Vovó', () => {
  it('lista pedidos com itens, filtrando por data e status', async () => {
    await criarOk(avulso());
    await criarOk(caixa());
    const todos = await painel.listarPedidos();
    expect(todos.map((p) => p.tipo)).toEqual(['AVULSO', 'CAIXA_50']);
    expect(todos[0].itens).toHaveLength(2);
    expect(todos[0].cliente.whatsapp).toBe('53999998888');

    expect(await painel.listarPedidos({ de: diaDaCaixa(), ate: diaDaCaixa() })).toHaveLength(1);
    expect(await painel.listarPedidos({ status: ['ENTREGUE'] })).toHaveLength(0);
    await expect(painel.listarPedidos({ de: 'ontem' })).rejects.toBeInstanceOf(erros.ErroNegocio);
  });

  it('leva um pedido de retirada do início ao fim, com desfazer', async () => {
    const id = await criarOk(avulso({ formaEntrega: 'RETIRADA', bairroId: null, endereco: null }));
    await painel.mudarStatus(id, 'FAZENDO');
    await painel.mudarStatus(id, 'RECEBIDO'); // desfazer
    await painel.mudarStatus(id, 'FAZENDO');
    await painel.mudarStatus(id, 'PRONTO');
    await expect(painel.mudarStatus(id, 'SAIU')).rejects.toThrow(); // retirada não "sai"
    await painel.mudarStatus(id, 'ENTREGUE');
    await painel.mudarStatus(id, 'ENTREGUE'); // toque duplo não é erro
    await expect(painel.mudarStatus(id, 'CANCELADO')).rejects.toThrow('já foi entregue');
    const [p] = await painel.listarPedidos();
    expect(p.status).toBe('ENTREGUE');
  });

  it('cancelar e desfazer o cancelamento volta para onde estava', async () => {
    const id = await criarOk(avulso());
    await painel.mudarStatus(id, 'FAZENDO');
    await painel.mudarStatus(id, 'CANCELADO');
    await painel.mudarStatus(id, 'FAZENDO');
    expect((await painel.listarPedidos())[0].status).toBe('FAZENDO');
  });

  it('não pula etapas', async () => {
    const id = await criarOk(avulso());
    await expect(painel.mudarStatus(id, 'PRONTO')).rejects.toBeInstanceOf(erros.ErroNegocio);
    await expect(painel.mudarStatus('xyz', 'PRONTO')).rejects.toThrow('Não encontrei');
  });

  it('"Acabou" bloqueia o sabor no site na hora, e "Tem" libera', async () => {
    await painel.marcarDisponivel(ids.quindim, false);
    const r = await loja.calcularPedido({ tipo: 'AVULSO', itens: [{ produtoId: ids.quindim, quantidade: 2 }] });
    expect(r.erros[0].mensagem).toContain('Quindim acabou');
    await painel.marcarDisponivel(ids.quindim, true);
    expect((await loja.calcularPedido({ tipo: 'AVULSO', itens: [{ produtoId: ids.quindim, quantidade: 2 }] })).ok).toBe(true);
  });

  it('mudar preço vale para pedidos novos, não para os antigos', async () => {
    const antigo = await criarOk(avulso());
    await painel.mudarPreco(ids.quindim, 500);
    const novo = await criarOk(avulso());
    expect((await loja.obterPedidoConfirmacao(antigo))?.totalCentavos).toBe(6600);
    expect((await loja.obterPedidoConfirmacao(novo))?.totalCentavos).toBe(7100);
    await expect(painel.mudarPreco(ids.quindim, 0)).rejects.toThrow('preço válido');
  });
});

describe('orçamento de festa', () => {
  it('cria, lista os novos primeiro e muda o status', async () => {
    const base = {
      nome: 'Ana Lima',
      whatsapp: '53991110003',
      dataEvento: somarDias(hojeEmPelotas(), 30),
      tipoEvento: 'Casamento',
      quantidadeDoces: 600,
      observacao: null,
      aceitouPrivacidade: true,
    };
    expect(await loja.criarOrcamentoFesta(base)).toEqual({ ok: true });
    expect(await loja.criarOrcamentoFesta({ ...base, tipoEvento: 'Formatura' })).toEqual({ ok: true });

    const [primeiro] = await painel.listarOrcamentosFesta();
    await painel.mudarStatusOrcamento(primeiro.id, 'RESPONDIDO');
    const lista = await painel.listarOrcamentosFesta();
    expect(lista.map((o) => o.status)).toEqual(['NOVO', 'RESPONDIDO']);

    const curto = await loja.criarOrcamentoFesta({ ...base, dataEvento: somarDias(hojeEmPelotas(), 2) });
    expect(curto.ok).toBe(false);
  });
});
