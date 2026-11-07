/**
 * Dados de exemplo (fictícios) para desenvolvimento e demo.
 * Rodar: npm run db:seed
 *
 * Pode rodar várias vezes: sabores, bairros e config são atualizados pelo slug/nome,
 * e os pedidos de exemplo só são criados se o banco ainda não tiver nenhum pedido.
 *
 * Preços, bairros e taxas são FICTÍCIOS até o cliente passar os valores reais.
 *
 * Este script roda fora do Next (com tsx), por isso cria a própria conexão
 * em vez de importar src/lib/db/index.ts (que é 'server-only').
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { count, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as s from './schema';
import { hojeEmPelotas, somarDias } from '../datas';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: s });

const SABORES = [
  { slug: 'quindim', nome: 'Quindim', descricao: 'Gema, açúcar e coco, assado em banho-maria. Brilhante e macio.', preco: 450 },
  { slug: 'brigadeiro-de-ninho', nome: 'Brigadeiro de Ninho', descricao: 'Leite em pó e leite condensado, enrolado à mão.', preco: 400 },
  { slug: 'pastel-de-santa-clara', nome: 'Pastel de Santa Clara', descricao: 'Massa fininha recheada com doce de ovos.', preco: 500 },
  { slug: 'trouxinha', nome: 'Trouxinha de Ovos', descricao: 'Fios de ovos em calda, dobrados como uma trouxinha.', preco: 500 },
  { slug: 'camafeu', nome: 'Camafeu', descricao: 'Pasta de nozes coberta com fondant e meia noz por cima.', preco: 550 },
  { slug: 'olho-de-sogra', nome: 'Olho de Sogra', descricao: 'Ameixa recheada com doce de coco e ovos.', preco: 450 },
  { slug: 'bem-casado', nome: 'Bem-Casado', descricao: 'Pão de ló com doce de leite, embrulhado no papel.', preco: 500 },
  { slug: 'brigadeiro', nome: 'Brigadeiro', descricao: 'O clássico de chocolate com granulado.', preco: 350 },
  { slug: 'queijadinha', nome: 'Queijadinha', descricao: 'Coco e queijo, com casquinha dourada.', preco: 400 },
  { slug: 'ninho-de-amor', nome: 'Ninho de Amor', descricao: 'Docinho de coco com cravo, assado no forninho.', preco: 400 },
] as const;

const ZONAS: { zona: number; frete: number; bairros: string[] }[] = [
  { zona: 1, frete: 1000, bairros: ['Centro', 'Fragata', 'Simões Lopes', 'Porto'] },
  { zona: 2, frete: 1500, bairros: ['Areal', 'Três Vendas', 'Guabiroba', 'Py Crespo', 'Cohab'] },
  { zona: 3, frete: 2200, bairros: ['Laranjal', 'Balneário dos Prazeres', 'Capão do Leão'] },
];

const CONFIG = {
  precoCaixa50Centavos: 14000,
  horarioCorteMesmoDia: '14:00',
  antecedenciaDiasCaixaFesta: 5,
  limiteCaixasPorDia: 6,
  freteCortesiaAcimaCentavos: 25000,
  whatsappLoja: '53900000000',
  enderecoRetirada: 'Centro de Pelotas (combinamos o horário pelo WhatsApp)',
  pixChave: 'pix-teste@docesdalurdes.com.br',
  pixNomeRecebedor: 'DOCES DA LURDES',
  pixCidade: 'PELOTAS',
};

async function main() {
  for (const [i, sabor] of SABORES.entries()) {
    await db
      .insert(s.produtos)
      .values({ slug: sabor.slug, nome: sabor.nome, descricao: sabor.descricao, precoCentavos: sabor.preco, ordem: i })
      // Não sobrescreve preço nem disponibilidade: podem ter sido mudados no painel.
      .onConflictDoUpdate({ target: s.produtos.slug, set: { nome: sabor.nome, descricao: sabor.descricao, ordem: i } });
  }

  for (const z of ZONAS) {
    for (const nome of z.bairros) {
      await db
        .insert(s.bairros)
        .values({ nome, zona: z.zona, freteCentavos: z.frete })
        .onConflictDoUpdate({ target: s.bairros.nome, set: { zona: z.zona, freteCentavos: z.frete, ativo: true } });
    }
  }

  await db.insert(s.config).values({ id: 1, ...CONFIG }).onConflictDoUpdate({ target: s.config.id, set: CONFIG });

  const [{ n }] = await db.select({ n: count() }).from(s.pedidos);
  if (n === 0) await criarExemplos();

  const totais = await db.execute<{ tabela: string; n: number }>(sql`
    select 'sabores' as tabela, count(*)::int as n from produtos
    union all select 'bairros', count(*)::int from bairros
    union all select 'pedidos', count(*)::int from pedidos
    union all select 'orçamentos de festa', count(*)::int from orcamentos_festa`);
  console.log('Seed ok:', totais.rows.map((r) => `${r.n} ${r.tabela}`).join(', '));
}

/** Alguns pedidos e um orçamento para o Modo Vovó não começar vazio. */
async function criarExemplos() {
  const hoje = hojeEmPelotas();
  const agora = new Date();
  const sabores = Object.fromEntries((await db.select().from(s.produtos)).map((p) => [p.slug, p]));
  const bairro = Object.fromEntries((await db.select().from(s.bairros)).map((b) => [b.nome, b]));

  const clientes = await db
    .insert(s.clientes)
    .values([
      { nome: 'Maria Souza', whatsapp: '53991110001', aceitouPrivacidadeEm: agora },
      { nome: 'João Pereira', whatsapp: '53991110002', aceitouPrivacidadeEm: agora },
      { nome: 'Ana Lima', whatsapp: '53991110003', aceitouPrivacidadeEm: agora },
    ])
    .onConflictDoUpdate({ target: s.clientes.whatsapp, set: { atualizadoEm: agora } })
    .returning();
  const [maria, joao, ana] = clientes;

  const item = (slug: string, quantidade: number, precoUnitCentavos = sabores[slug].precoCentavos) => ({
    produtoId: sabores[slug].id,
    nomeProduto: sabores[slug].nome,
    quantidade,
    precoUnitCentavos,
  });

  const exemplos = [
    {
      pedido: {
        tipo: 'AVULSO' as const,
        clienteId: maria.id,
        nomeCliente: maria.nome,
        whatsappCliente: maria.whatsapp,
        formaEntrega: 'ENTREGA' as const,
        bairroId: bairro['Centro'].id,
        bairroNome: 'Centro',
        endereco: 'Rua XV de Novembro, 100',
        dataEntrega: hoje,
        mesmoDia: true,
        observacao: 'É para o aniversário da minha mãe!',
        subtotalCentavos: 12 * 450 + 6 * 400,
        freteCentavos: bairro['Centro'].freteCentavos,
        totalCentavos: 12 * 450 + 6 * 400 + bairro['Centro'].freteCentavos,
        statusPagamento: 'PAGO' as const,
      },
      itens: [item('quindim', 12), item('brigadeiro-de-ninho', 6)],
    },
    {
      pedido: {
        tipo: 'AVULSO' as const,
        status: 'FAZENDO' as const,
        clienteId: joao.id,
        nomeCliente: joao.nome,
        whatsappCliente: joao.whatsapp,
        formaEntrega: 'RETIRADA' as const,
        dataEntrega: hoje,
        mesmoDia: true,
        subtotalCentavos: 10 * 500,
        freteCentavos: 0,
        totalCentavos: 10 * 500,
      },
      itens: [item('pastel-de-santa-clara', 10)],
    },
    {
      pedido: {
        tipo: 'CAIXA_50' as const,
        clienteId: ana.id,
        nomeCliente: ana.nome,
        whatsappCliente: ana.whatsapp,
        formaEntrega: 'ENTREGA' as const,
        bairroId: bairro['Areal'].id,
        bairroNome: 'Areal',
        endereco: 'Av. Domingos de Almeida, 2000, ap. 31',
        dataEntrega: somarDias(hoje, CONFIG.antecedenciaDiasCaixaFesta),
        subtotalCentavos: CONFIG.precoCaixa50Centavos,
        freteCentavos: bairro['Areal'].freteCentavos,
        totalCentavos: CONFIG.precoCaixa50Centavos + bairro['Areal'].freteCentavos,
        statusPagamento: 'PAGO' as const,
      },
      itens: [item('quindim', 15, 0), item('camafeu', 10, 0), item('olho-de-sogra', 10, 0), item('bem-casado', 15, 0)],
    },
  ];

  for (const ex of exemplos) {
    await db.transaction(async (tx) => {
      const [p] = await tx.insert(s.pedidos).values(ex.pedido).returning({ id: s.pedidos.id });
      await tx.insert(s.itensPedido).values(ex.itens.map((i) => ({ ...i, pedidoId: p.id })));
    });
  }

  await db.insert(s.orcamentosFesta).values({
    clienteId: maria.id,
    nome: maria.nome,
    whatsapp: maria.whatsapp,
    dataEvento: somarDias(hoje, 30),
    tipoEvento: 'Casamento',
    quantidadeDoces: 600,
    observacao: 'Gostaríamos de bem-casados e camafeus. Tema branco e dourado.',
    aceitouPrivacidadeEm: agora,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
