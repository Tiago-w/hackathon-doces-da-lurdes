CREATE TYPE "public"."forma_entrega" AS ENUM('RETIRADA', 'ENTREGA');--> statement-breakpoint
CREATE TYPE "public"."forma_pagamento" AS ENUM('PIX', 'CARTAO');--> statement-breakpoint
CREATE TYPE "public"."status_orcamento" AS ENUM('NOVO', 'RESPONDIDO', 'FECHADO', 'RECUSADO');--> statement-breakpoint
CREATE TYPE "public"."status_pagamento" AS ENUM('PENDENTE', 'PAGO');--> statement-breakpoint
CREATE TYPE "public"."status_pedido" AS ENUM('RECEBIDO', 'FAZENDO', 'PRONTO', 'SAIU', 'ENTREGUE', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."tipo_pedido" AS ENUM('AVULSO', 'CAIXA_50', 'FESTA');--> statement-breakpoint
CREATE TABLE "bairros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"zona" integer NOT NULL,
	"frete_centavos" integer NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "bairros_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"whatsapp" text NOT NULL,
	"aceitou_privacidade_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_whatsapp_unique" UNIQUE("whatsapp")
);
--> statement-breakpoint
CREATE TABLE "config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"preco_caixa_50_centavos" integer NOT NULL,
	"horario_corte_mesmo_dia" text NOT NULL,
	"antecedencia_dias_caixa_festa" integer NOT NULL,
	"limite_caixas_por_dia" integer NOT NULL,
	"frete_cortesia_acima_centavos" integer NOT NULL,
	"whatsapp_loja" text NOT NULL,
	"endereco_retirada" text NOT NULL,
	"pix_chave" text NOT NULL,
	"pix_nome_recebedor" text NOT NULL,
	"pix_cidade" text NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens_pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"nome_produto" text NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_unit_centavos" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orcamentos_festa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid,
	"nome" text NOT NULL,
	"whatsapp" text NOT NULL,
	"data_evento" date NOT NULL,
	"tipo_evento" text NOT NULL,
	"quantidade_doces" integer,
	"observacao" text,
	"status" "status_orcamento" DEFAULT 'NOVO' NOT NULL,
	"aceitou_privacidade_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" serial NOT NULL,
	"tipo" "tipo_pedido" NOT NULL,
	"status" "status_pedido" DEFAULT 'RECEBIDO' NOT NULL,
	"status_atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome_cliente" text NOT NULL,
	"whatsapp_cliente" text NOT NULL,
	"forma_entrega" "forma_entrega" NOT NULL,
	"bairro_id" uuid,
	"bairro_nome" text,
	"endereco" text,
	"data_entrega" date NOT NULL,
	"mesmo_dia" boolean DEFAULT false NOT NULL,
	"observacao" text,
	"subtotal_centavos" integer NOT NULL,
	"frete_centavos" integer NOT NULL,
	"total_centavos" integer NOT NULL,
	"forma_pagamento" "forma_pagamento" DEFAULT 'PIX' NOT NULL,
	"status_pagamento" "status_pagamento" DEFAULT 'PENDENTE' NOT NULL,
	"pix_copia_e_cola" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"descricao" text,
	"preco_centavos" integer NOT NULL,
	"foto_url" text,
	"disponivel" boolean DEFAULT true NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produtos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos_festa" ADD CONSTRAINT "orcamentos_festa_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_bairro_id_bairros_id_fk" FOREIGN KEY ("bairro_id") REFERENCES "public"."bairros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "itens_pedido_pedido_idx" ON "itens_pedido" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "orcamentos_status_idx" ON "orcamentos_festa" USING btree ("status","criado_em");--> statement-breakpoint
CREATE INDEX "pedidos_data_status_idx" ON "pedidos" USING btree ("data_entrega","status");--> statement-breakpoint
CREATE INDEX "pedidos_cliente_idx" ON "pedidos" USING btree ("cliente_id");