# Doces da Lurdes — Plataforma de Encomendas & KDS Artesanal

Aplicação web full-stack desenvolvida para a **Doces da Lurdes**, confeitaria tradicional de Pelotas (RS) com 18 anos de história na produção artesanal de doces finos certificados pela tradição doceira pelotense (quindim de gema pura, camafeu de nozes, pastel de Santa Clara, bem-casado, ninho e trouxinha de ovos).

O sistema resolve o gargalo operacional de encomendas via WhatsApp sem descaracterizar o atendimento familiar, unindo uma **vitrine digital de alta conversão** para os clientes e um **painel de cozinha ergonômico (Modo Vovó)** projetado especificamente para operação em tablet/celular por usuários idosos durante a rotina de produção.

---

## Sumário Arquitetural

A solução é dividida em três camadas desacopladas com validação estrita no servidor:

1. **Experiência do Cliente (`src/app/(site)` & `src/components/site`)**
   - **Vitrine Editorial & Ilustrações Vetoriais Autorais:** Identidade visual inspirada na doçaria clássica de Pelotas (`Fraunces` + `Plus Jakarta Sans`), com ilustrações vetoriais dedicadas para cada doce tradicional e adição rápida com 1 toque.
   - **Montador Interativo da Caixa de 50 Doces (`/pedido/caixa`):** Barra de progresso fixa em tempo real, atalhos de preenchimento inteligente (*Sugestão Clássica Sortida* e *Top 5 Tradicionais*), trava automática na 50ª unidade e revalidação de estoque antes do checkout.
   - **Pedidos Avulsos de Pronta Entrega (`/pedido/avulso`):** Suporte a pedidos de 1 a 49 unidades com liberação automática de entrega no mesmo dia quando realizados antes do horário de corte (14h no fuso de Pelotas).
   - **Orçamentos para Eventos e Casamentos (`/pedido/festa`):** Captação estruturada de demandas para grandes celebrações com integração direta ao WhatsApp.
   - **Checkout Transparente com Pix BR Code (`/pedido/finalizar`):** Cálculo automático de frete por zona/bairro de Pelotas (com isenção automática acima da faixa de cortesia), geração instantânea de payload Pix Copia e Cola no padrão EMV® QRCPS-MPM do Banco Central (CRC16-CCITT) e página permanente de acompanhamento do pedido (`/pedido/confirmado/[id]`).

2. **Painel de Cozinha — "Modo Vovó" (`src/app/painel` & `src/components/painel`)**
   - **Ergonomia Cognitiva & Acessibilidade Sênior:** Fontes ampliadas (20px a 34px), áreas de toque mínimas de 64px–72px, alto contraste sobre fundo creme quente (sem brilho excessivo na cozinha) e ausência de menus ocultos.
   - **Fluxo de 1 Único Próximo Passo:** Cada cartão de pedido exibe apenas a ação correspondente à próxima etapa lógica da produção (`Começar a fazer` → `Marcar como pronto` → `Saiu para entrega` → `Marcar como entregue`, pulando a etapa de motoboy quando o pedido é para retirada).
   - **Rede de Segurança ("Desfazer" em 10 segundos):** Qualquer alteração de status de pedido, orçamento ou disponibilidade de sabor oferece um botão imediato de reversão por 10 segundos para corrigir toques acidentais sem estresse.
   - **Alerta Sonoro Web Audio API & Sincronização Contínua:** Tela inicial *"Abrir o dia"* que desbloqueia o contexto de áudio do navegador e emite um aviso sonoro suave (*plim-plim* sintetizado via `AudioContext`, sem dependência de arquivos externos) a cada novo pedido recebido, com polling automático a cada 10 segundos e tratamento resiliente de queda de conexão.
   - **Controle de Estoque em Tempo Real:** Na aba *Sabores*, alternar um doce entre **Tem hoje** e **Acabou** bloqueia ou libera imediatamente o item na vitrine pública e no montador da Caixa de 50.

3. **Motor de Regras de Negócio & Persistência (`src/lib` & `src/server`)**
   - **Regras Puras e Determinísticas (`src/lib/regras.ts`):** Cálculo de subtotais, fretes por zona, elegibilidade de entrega no mesmo dia, calendário de 30 dias no fuso `America/Sao_Paulo` e controle de capacidade diária de Caixas de 50.
   - **Proteção contra Condições de Corrida:** Transações PostgreSQL com `pg_advisory_xact_lock` garantem que dois clientes finalizando a última Caixa de 50 disponível para uma data não ultrapassem o limite diário da cozinha.
   - **Imutabilidade Histórica de Pedidos:** Os itens do pedido gravam um snapshot do nome e preço unitário vigentes no momento da compra, preservando o histórico financeiro mesmo após reajustes no catálogo.
   - **Fronteira de Segurança Server Actions:** Os módulos em `src/server/` utilizam `server-only` e nunca expõem `'use server'` diretamente; toda comunicação passa pelas fronteiras públicas auditadas em `src/app/(site)/_dados/index.ts` e `src/app/painel/_dados/index.ts` (esta última protegida por cookie `httpOnly` assinado via HMAC-SHA256 com comparação em tempo constante `timingSafeEqual`).

---

## Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Framework & UI** | Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript 5 |
| **Estilização & Tipografia** | Tailwind CSS 4, `Fraunces` (serifa editorial) + `Plus Jakarta Sans` (interface) |
| **Banco de Dados & ORM** | PostgreSQL 16, Drizzle ORM (`drizzle-orm/node-postgres`), Drizzle Kit |
| **Validação & Pagamentos** | Zod 3, Gerador próprio de Pix BR Code EMV (CRC16-CCITT), Normalizador WhatsApp |
| **Qualidade & Testes** | Vitest (testes unitários de regras de negócio, painel e integração PostgreSQL), ESLint 9 |

---

## Como Executar Localmente

### Pré-requisitos

- **Node.js** `20.19+` ou `22.x`
- **PostgreSQL 16** (via Docker / Podman Compose ou instância local)

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/Tiago-w/hackathon-doces-da-lurdes.git
cd hackathon-doces-da-lurdes

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Inicie o banco PostgreSQL (porta 5433) e aplique as migrations + seed inicial
npm run db:up
npm run db:setup

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse no navegador:

- **Loja do Cliente:** [http://localhost:3000](http://localhost:3000)
- **Painel da Cozinha (Modo Vovó):** [http://localhost:3000/painel](http://localhost:3000/painel) (senha padrão configurada no `.env`: `lurdes123`)

---

## Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js na porta `3000` |
| `npm run build` | Executa o build otimizado de produção |
| `npm run start` | Inicia o servidor de produção após o build |
| `npm run verificar` | Executa checagem estática de tipos (`tsc --noEmit`), linter (`eslint`) e suíte completa de testes (`vitest`) |
| `npm test` | Executa os testes unitários de regras de negócio, utilitários e painel |
| `npm run test:integracao` | Executa os testes de integração contra um banco PostgreSQL real (`doces_lurdes_teste`) |
| `npm run db:up` | Sobe o container PostgreSQL 16 definido no `docker-compose.yml` |
| `npm run db:setup` | Aplica as migrations do Drizzle e popula o banco com o catálogo tradicional de Pelotas |
| `npm run db:seed` | Reexecuta o seed de forma idempotente |
| `npm run db:reset` | Recria o banco local do zero (possui trava de segurança que impede execução fora de `localhost`) |

---

## Estrutura de Diretórios

```text
src/
├── app/
│   ├── (site)/                  # Rotas públicas da confeitaria (Vitrine, Montador de Caixa, Avulso, Festa, Checkout)
│   │   └── _dados/              # Server Actions públicas que delegam para src/server/loja.ts
│   ├── painel/                  # Rotas protegidas do Modo Vovó (/painel e /painel/entrar)
│   │   ├── _auth.ts             # Autenticação stateless via cookie httpOnly assinado com HMAC-SHA256
│   │   └── _dados/              # Server Actions autenticadas que exigem sessão antes de chamar src/server/painel.ts
│   ├── globals.css              # Design tokens, paleta cromática e variáveis tipográficas
│   └── layout.tsx               # Root layout com carregamento otimizado de fontes
├── components/
│   ├── site/                    # Componentes da loja (Cabecalho, CartaoVitrine, FotoSabor, MontadorCaixa, etc.)
│   └── painel/                  # Componentes do KDS (PainelModoVovo, AbaHoje, AbaProximosDias, AbaFestas, AbaSabores)
├── lib/
│   ├── contrato.ts              # Contratos tipados compartilhados entre cliente, painel e servidor
│   ├── regras.ts                # Regras de negócio puras (preços, frete, datas, capacidade da cozinha, transições)
│   ├── datas.ts                 # Manipulação de datas e horários fixada no fuso America/Sao_Paulo
│   ├── dinheiro.ts              # Conversão e formatação monetária em centavos inteiros
│   ├── pix.ts                   # Geração de payload Pix Copia e Cola (BR Code EMV + CRC16)
│   ├── whatsapp.ts              # Validação, máscara e geração de deep links wa.me
│   ├── mensagens.ts             # Templates de confirmação e atualização de status para WhatsApp
│   └── db/                      # Schema Drizzle ORM, cliente PostgreSQL, seed e reset
└── server/
    ├── contexto.ts              # Carregamento transacional de configurações e contagens do banco
    ├── loja.ts                  # Casos de uso da loja (cálculo, criação de pedido com lock e orçamento)
    └── painel.ts                # Casos de uso administrativos (transições de status, disponibilidade e preços)
```
