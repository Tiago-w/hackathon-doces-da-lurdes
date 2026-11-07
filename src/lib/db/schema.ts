/**
 * Schema do banco da Doces da Lurdes (Drizzle ORM + PostgreSQL).
 * Dono: Dev 1. Precisa de um campo novo? Peça no grupo, não altere direto.
 *
 * Depois de mudar este arquivo:  npm run db:generate  (cria a migration em drizzle/)
 *                                npm run db:migrate   (aplica no banco)
 *
 * Convenções:
 * - Dinheiro sempre em centavos (integer).
 * - Datas de entrega/evento são só data (date, como texto YYYY-MM-DD), no fuso America/Sao_Paulo.
 * - Pedidos guardam uma cópia (snapshot) de nome, preço e bairro: se o preço mudar amanhã,
 *   o pedido de ontem continua mostrando o valor que o cliente pagou.
 * - Ids são UUID aleatórios (não dá para adivinhar o link da confirmação de outro cliente).
 */
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const tipoPedido = pgEnum('tipo_pedido', ['AVULSO', 'CAIXA_50', 'FESTA']);
export const statusPedido = pgEnum('status_pedido', ['RECEBIDO', 'FAZENDO', 'PRONTO', 'SAIU', 'ENTREGUE', 'CANCELADO']);
export const formaEntrega = pgEnum('forma_entrega', ['RETIRADA', 'ENTREGA']);
export const formaPagamento = pgEnum('forma_pagamento', ['PIX', 'CARTAO']);
export const statusPagamento = pgEnum('status_pagamento', ['PENDENTE', 'PAGO']);
export const statusOrcamento = pgEnum('status_orcamento', ['NOVO', 'RESPONDIDO', 'FECHADO', 'RECUSADO']);

const criadoEm = () => timestamp('criado_em', { withTimezone: true }).notNull().defaultNow();
const atualizadoEm = () =>
  timestamp('atualizado_em', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const produtos = pgTable('produtos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  descricao: text('descricao'),
  precoCentavos: integer('preco_centavos').notNull(),
  fotoUrl: text('foto_url'),
  /** "Tem" / "Acabou" do Modo Vovó. */
  disponivel: boolean('disponivel').notNull().default(true),
  /** Sai do catálogo sem apagar o histórico dos pedidos antigos. */
  ativo: boolean('ativo').notNull().default(true),
  ordem: integer('ordem').notNull().default(0),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const bairros = pgTable('bairros', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull().unique(),
  zona: integer('zona').notNull(),
  freteCentavos: integer('frete_centavos').notNull(),
  ativo: boolean('ativo').notNull().default(true),
});

export const clientes = pgTable('clientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  /** Só dígitos, com DDD, sem o 55. É a "chave" do cliente: sem CPF, sem senha. */
  whatsapp: text('whatsapp').notNull().unique(),
  aceitouPrivacidadeEm: timestamp('aceitou_privacidade_em', { withTimezone: true }).notNull(),
  criadoEm: criadoEm(),
  atualizadoEm: atualizadoEm(),
});

export const pedidos = pgTable(
  'pedidos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Número curto e amigável: "Pedido 27". */
    codigo: serial('codigo').notNull().unique(),
    tipo: tipoPedido('tipo').notNull(),
    status: statusPedido('status').notNull().default('RECEBIDO'),
    /** Status antes da última mudança: permite o "Desfazer" do painel (inclusive de um cancelamento). */
    statusAnterior: statusPedido('status_anterior'),
    statusAtualizadoEm: timestamp('status_atualizado_em', { withTimezone: true }).notNull().defaultNow(),

    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => clientes.id),
    nomeCliente: text('nome_cliente').notNull(),
    whatsappCliente: text('whatsapp_cliente').notNull(),

    formaEntrega: formaEntrega('forma_entrega').notNull(),
    bairroId: uuid('bairro_id').references(() => bairros.id),
    bairroNome: text('bairro_nome'),
    endereco: text('endereco'),

    dataEntrega: date('data_entrega', { mode: 'string' }).notNull(),
    mesmoDia: boolean('mesmo_dia').notNull().default(false),
    observacao: text('observacao'),

    subtotalCentavos: integer('subtotal_centavos').notNull(),
    freteCentavos: integer('frete_centavos').notNull(),
    totalCentavos: integer('total_centavos').notNull(),

    formaPagamento: formaPagamento('forma_pagamento').notNull().default('PIX'),
    statusPagamento: statusPagamento('status_pagamento').notNull().default('PENDENTE'),
    pixCopiaECola: text('pix_copia_e_cola'),

    criadoEm: criadoEm(),
    atualizadoEm: atualizadoEm(),
  },
  (t) => [index('pedidos_data_status_idx').on(t.dataEntrega, t.status), index('pedidos_cliente_idx').on(t.clienteId)],
);

export const itensPedido = pgTable(
  'itens_pedido',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pedidoId: uuid('pedido_id')
      .notNull()
      .references(() => pedidos.id, { onDelete: 'cascade' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produtos.id),
    nomeProduto: text('nome_produto').notNull(),
    quantidade: integer('quantidade').notNull(),
    /** Preço unitário no momento do pedido. Na Caixa de 50 é 0: o preço é o da caixa (fica no pedido). */
    precoUnitCentavos: integer('preco_unit_centavos').notNull(),
  },
  (t) => [index('itens_pedido_pedido_idx').on(t.pedidoId)],
);

export const orcamentosFesta = pgTable(
  'orcamentos_festa',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clienteId: uuid('cliente_id').references(() => clientes.id),
    nome: text('nome').notNull(),
    whatsapp: text('whatsapp').notNull(),
    dataEvento: date('data_evento', { mode: 'string' }).notNull(),
    tipoEvento: text('tipo_evento').notNull(),
    quantidadeDoces: integer('quantidade_doces'),
    observacao: text('observacao'),
    status: statusOrcamento('status').notNull().default('NOVO'),
    aceitouPrivacidadeEm: timestamp('aceitou_privacidade_em', { withTimezone: true }).notNull(),
    criadoEm: criadoEm(),
    atualizadoEm: atualizadoEm(),
  },
  (t) => [index('orcamentos_status_idx').on(t.status, t.criadoEm)],
);

/** Configuração da loja. Uma linha só (id = 1). */
export const config = pgTable('config', {
  id: integer('id').primaryKey().default(1),
  precoCaixa50Centavos: integer('preco_caixa_50_centavos').notNull(),
  /** "HH:mm" no fuso de São Paulo. Avulso feito antes disso pode sair no mesmo dia. */
  horarioCorteMesmoDia: text('horario_corte_mesmo_dia').notNull(),
  antecedenciaDiasCaixaFesta: integer('antecedencia_dias_caixa_festa').notNull(),
  limiteCaixasPorDia: integer('limite_caixas_por_dia').notNull(),
  freteCortesiaAcimaCentavos: integer('frete_cortesia_acima_centavos').notNull(),
  whatsappLoja: text('whatsapp_loja').notNull(),
  enderecoRetirada: text('endereco_retirada').notNull(),
  /** Dados do Pix (BR Code estático). Hoje de teste. */
  pixChave: text('pix_chave').notNull(),
  pixNomeRecebedor: text('pix_nome_recebedor').notNull(),
  pixCidade: text('pix_cidade').notNull(),
  atualizadoEm: atualizadoEm(),
});

/** Regras e exceções por dia do calendário editadas pela dona Lurdes no Modo Vovó. */
export const agendaDias = pgTable('agenda_dias', {
  data: date('data', { mode: 'string' }).primaryKey(),
  aberto: boolean('aberto').notNull().default(true),
  limiteCaixas: integer('limite_caixas'),
  observacao: text('observacao'),
  atualizadoEm: atualizadoEm(),
});
