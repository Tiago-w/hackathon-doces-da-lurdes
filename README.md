# Doces da Lurdes

Site e painel da **Doces da Lurdes**, confeitaria artesanal de Pelotas (RS) há 18 anos.

- **Site do cliente** (`/`): vitrine, Caixa de 50 com sabores à escolha, doces avulsos (com entrega no mesmo dia), orçamento de festa e pagamento por Pix.
- **Modo Vovó** (`/painel`): onde a dona Lurdes e o neto veem os pedidos, mudam o status e marcam quando um sabor acabou.

Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL · Drizzle ORM · Zod · Vitest**.

---

## Como rodar

Precisa de **Node 20.19+** (recomendado 22) e **Docker**.

```bash
git clone https://github.com/Tiago-w/doces-da-lurdes.git
cd doces-da-lurdes
npm install
cp .env.example .env        # ajuste se precisar
npm run db:up               # sobe o Postgres local (porta 5433)
npm run db:setup            # cria as tabelas e coloca os dados de exemplo
npm run dev                 # http://localhost:3000  e  http://localhost:3000/painel
```

Sem Docker? Use qualquer Postgres 16 e ajuste o `DATABASE_URL` no `.env`.

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o site em modo desenvolvimento |
| `npm run verificar` | Typecheck + lint + testes. **Rode antes de abrir PR.** |
| `npm test` | Testes das regras (rápidos, sem banco) |
| `npm run test:integracao` | Testa as funções do servidor contra um Postgres de verdade (cria e usa o banco `doces_lurdes_teste`, sem tocar nos seus dados) |
| `npm run build` | Build de produção |
| `npm run db:up` | Sobe o Postgres do `docker-compose.yml` |
| `npm run db:setup` | Aplica as migrations e roda o seed |
| `npm run db:seed` | Só o seed (pode rodar de novo; não duplica nada) |
| `npm run db:reset` | **Apaga o banco local** e recria com os dados de exemplo (recusa rodar fora de localhost) |
| `npm run db:generate` | Gera uma migration depois de mudar o schema (**só o Dev 1**) |
| `npm run db:studio` | Abre o Drizzle Studio para ver as tabelas no navegador |

---

## Quem cuida do quê

Cada um mexe **só nas suas pastas**. É isso que evita conflito de merge.

| Pasta | Dono |
|---|---|
| `src/lib/` (contrato, regras, banco, utilitários), `src/server/`, `drizzle/`, `drizzle.config.ts`, `docker-compose.yml` | **Dev 1**: fundação e regras de negócio |
| `src/app/(site)/`, `src/components/site/`, `public/site/` | **Dev 2**: site do cliente |
| `src/app/painel/`, `src/components/painel/` | **Dev 3**: Modo Vovó |
| `package.json`, `src/app/layout.tsx`, `src/app/globals.css`, `.env.example`, `README.md` | **Compartilhado**: avise no grupo antes de mexer |

Precisa de um campo no banco, uma função nova, uma biblioteca ou uma cor no tema? **Peça ao Dev 1** em vez de mexer fora da sua pasta.

## Git

- Branches: `feat/regras` (Dev 1), `feat/site-cliente` (Dev 2), `feat/modo-vovo` (Dev 3), sempre a partir da `main`.
- Commits pequenos, mensagem em português com o prefixo da área: `site: montador da Caixa de 50`, `painel: botão acabou`, `regras: frete por bairro`.
- **Traga a `main` para a sua branch a cada ~1h30** (`git fetch && git merge origin/main`) e resolva o conflito na hora, enquanto ele é pequeno.
- PR para a `main` nos pontos de integração combinados, com `npm run verificar` passando. Ordem de merge: Dev 1 → Dev 2 → Dev 3.
- Nunca suba o `.env` (já está no `.gitignore`). Só o `.env.example`.

---

## Arquitetura

```
src/
  lib/
    contrato.ts        ← tipos combinados entre os três (a "fonte da verdade" das telas)
    regras.ts          ← TODAS as regras de negócio (funções puras, testadas em regras.test.ts)
    datas.ts           ← datas/horas no fuso de Pelotas (use sempre; nunca new Date().getDate())
    dinheiro.ts        ← formatarReais(450) → "R$ 4,50"; lerReais("4,50") → 450
    whatsapp.ts        ← normalizar, validar, formatar e montar link wa.me
    mensagens.ts       ← textos prontos de WhatsApp (resumo do pedido, aviso de status ao cliente)
    pix.ts             ← Pix copia e cola no padrão BR Code do Banco Central
    erros.ts           ← ErroNegocio + mensagemParaUsuario (para o _dados do painel)
    db/
      schema.ts        ← tabelas (Drizzle)
      index.ts         ← conexão (server-only)
      seed.ts, reset.ts
  server/
    loja.ts            ← funções do site  (server-only, SEM 'use server')
    painel.ts          ← funções do painel (server-only, SEM 'use server')
    contexto.ts        ← carrega do banco o que as regras precisam
  app/
    layout.tsx, globals.css   ← compartilhados
    (site)/            ← Dev 2. Fronteira pública: (site)/_dados/index.ts ('use server')
    painel/            ← Dev 3. Fronteira pública: painel/_dados/index.ts ('use server' + exigirLogin)
drizzle/               ← migrations geradas
```

### ⚠️ Regra de segurança: onde fica o `'use server'`

Uma função marcada com `'use server'` **vira um endpoint público**: qualquer pessoa pode chamá-la pela internet.

- As funções de `src/server/` **não** têm `'use server'`. Elas importam `'server-only'` e confiam em quem as chama.
- A **única** porta de entrada é o `_dados/index.ts` de cada área:
  - `src/app/(site)/_dados/index.ts`: `'use server'` e chama `src/server/loja.ts`.
  - `src/app/painel/_dados/index.ts`: `'use server'`, **chama `exigirLogin()` em toda função** e só depois chama `src/server/painel.ts`.
- Componentes nunca importam `src/server/` direto.

### Erros: como mostrar na tela

- **Site:** `calcularPedido`, `criarPedido` e `criarOrcamentoFesta` **não lançam erro** por dado errado. Devolvem `{ ok: false, erros: [...] }`, cada erro com `campo` (ou `produtoId`) e a `mensagem` pronta. Mostre a mensagem junto do campo.
- **Painel:** as funções lançam `ErroNegocio` com a mensagem pronta (ex.: "Esse pedido já foi entregue e não pode ser cancelado."). **Em produção o Next esconde a mensagem de erros lançados por server actions**, então o `_dados` do painel precisa capturar e devolver um resultado:

```ts
import { mensagemParaUsuario } from '@/lib/erros';

export async function mudarStatusAcao(id: string, status: StatusPedido) {
  await exigirLogin();
  try {
    await mudarStatus(id, status);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, mensagem: mensagemParaUsuario(e) };
  }
}
```

### Regra de ouro dos valores

O navegador manda só a **intenção** do cliente (quais sabores, quantos, bairro, data). **Preço, frete, datas permitidas e disponibilidade são sempre recalculados no servidor** (`calcularPedido` / `criarPedido`). Validação no navegador é só conforto para o usuário.

### Convenções

- **Dinheiro em centavos** (inteiro). Formate só na hora de mostrar.
- **Datas** de entrega/evento como texto `YYYY-MM-DD`, no fuso `America/Sao_Paulo`. Use `src/lib/datas.ts`.
- **WhatsApp** só dígitos, com DDD, sem o 55: `53999998888`.
- **Pedidos guardam cópia** de nome, preço e bairro da época: mudar o preço hoje não altera pedidos antigos.
- **Mensagens de erro** do servidor já vêm em português simples, prontas para mostrar.

### Mocks

Enquanto uma função de `src/server/` ainda lança "não implementado", cada área usa o seu `_dados/mock.ts`, ligado por `SITE_USAR_MOCK` / `PAINEL_USAR_MOCK` no `.env`. Trocar para o real deve ser uma linha.

---

## Regras de negócio (resumo)

| Tipo | Quantidade | Prazo | Preço |
|---|---|---|---|
| Avulso | 1 a 49 doces | No mesmo dia se pedido antes do corte (14h), senão a partir de amanhã | Soma dos preços unitários |
| Caixa de 50 | Exatamente 50, sabores à escolha | A partir de 5 dias; limite de caixas por dia | Preço fixo da caixa (a confirmar com o cliente) |
| Festa | Orçamento | Evento a partir de 5 dias | Combinado pelo WhatsApp |

- **Entrega:** retirada grátis no Centro ou taxa fixa por bairro (3 zonas). Frete cortesia a partir de R$ 250.
- **Agenda:** até 30 dias à frente. Dia com o limite de Caixas de 50 atingido some da lista (caixa cancelada libera a vaga). Dois clientes pegando a última vaga ao mesmo tempo: só um consegue.
- **Status do pedido:** Recebido → Fazendo → Pronto → Saiu → Entregue (retirada pula o "Saiu"). Dá para voltar um passo (o "Desfazer", inclusive depois de cancelar) e cancelar qualquer pedido ainda não entregue.
- **Pagamento:** Pix (BR Code). Cartão via gateway na fase 2. Nunca guardamos dados de cartão.
- **Cadastro:** só nome e WhatsApp, com aceite do aviso de privacidade. Sem CPF.
- **Sabor esgotado:** marcado no painel, some do pedido no site na hora.

**Todos os valores atuais (preços, bairros, taxas, limites, Pix) são fictícios** até o cliente passar os reais. Ficam na tabela `config` e no seed.

---

## Fora do escopo do MVP (fase 2)

Cartão de crédito (Mercado Pago), histórico de pedidos e recompra, impressora térmica de comandas, envio automático pelo WhatsApp, banco online (Supabase ou similar), Google Meu Negócio, edição de bairros e configurações pelo painel.
