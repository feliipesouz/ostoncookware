# OSTON Cookware

Plataforma digital da OSTON: site institucional premium, catálogo, geração de leads e CMS.

Não é um e-commerce. É **marca + catálogo + leads + CMS**, preparado para crescer.

## Arquitetura

```text
apps/web          Next.js 16 (site público + /admin)
apps/api          Fastify 5 (API versionada /v1)
packages/database Prisma 7 + PostgreSQL (Neon)
packages/contracts Zod compartilhado
packages/design-system tokens visuais
```

```text
Browser
  → Next.js (mesmo origin)
    → /api/auth/* e /v1/*
      → Fastify no mesmo processo
```

Na Vercel isso é **um projeto só**. Localmente o Fastify ainda pode subir em `:4000` para e2e e scripts. Toda rota privada autentica e autoriza na API.

- Cookies first-party, HttpOnly, SameSite=Lax, Secure em production.
- Better Auth. Sem cadastro público. RBAC `OWNER | ADMIN | EDITOR` no backend.
- Mídia: Vercel Blob. `BLOB_READ_WRITE_TOKEN` nunca vai ao browser.
- Cache público: tags ISR. CMS invalida `POST /api/revalidate` com secret e allowlist de tags.

## Requisitos

- Node.js 20.19+, 22.12+ ou 24+ (faixas suportadas pelo Prisma 7)
- pnpm 10
- PostgreSQL 16+ (Docker local ou Neon)

## Instalação

```bash
pnpm install
cp .env.example .env
```

Ajuste o `.env`. Para banco local, o Postgres do Compose escuta em **5433** (evita colidir com outro Postgres em 5432). Coloque só a URL no `.env.local` (gitignored); o restante continua no `.env`:

```bash
docker compose up -d
```

```bash
# .env.local
DATABASE_URL="postgresql://oston:oston@localhost:5433/oston?sslmode=disable"
DIRECT_URL="postgresql://oston:oston@localhost:5433/oston?sslmode=disable"
```

No `.env`, mantenha os demais valores locais (`BETTER_AUTH_*`, `WEB_ORIGIN`, `ADMIN_*`, etc.). `ADMIN_PASSWORD` precisa de no mínimo 12 caracteres, com letras e números. O comando nunca imprime a senha.

Não use `NEXT_PUBLIC_API_URL`. O browser consome `/v1` e `/api/auth` no mesmo origin. `API_URL` só serve para e2e apontar a API isolada em `:4000`.

## Banco, seed e primeiro admin

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm admin:create
```

O seed cria conteúdo **DEMO**. Não é catálogo oficial. Em production o seed recusa, a menos que `ALLOW_DEMO_SEED=true`.

Para os seis conjuntos oficiais recebidos, use `pnpm db:catalog` (rascunhos) ou `pnpm db:catalog --publish` (novos registros publicados). O importador preserva conteúdo existente. Veja [experiência premium e operação do catálogo](docs/premium-experience.md) para origem das imagens, comportamento da importação e campanhas sazonais.

`pnpm admin:create` é idempotente de forma segura: se já existir um OWNER, falha. Não promove usuário existente.

## Desenvolvimento

```bash
pnpm dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin
- Saúde da API no site: http://localhost:3000/health
- API isolada (e2e): http://localhost:4000/health

## Qualidade

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## Rate limiting

- Login: Better Auth com `storage: "database"` (tabela `rateLimit`). Não depende de instância serverless.
- Leads e autorização de upload: tabela `throttle` no PostgreSQL.
- Contadores usam um `INSERT ... ON CONFLICT` atômico e o relógio do banco; pedidos concorrentes compartilham a mesma janela. Respostas `429` incluem `Retry-After`.
- `@fastify/rate-limit` em memória é **camada adicional**, não a proteção principal.
- Apenas o runtime Vercel confia em `X-Forwarded-For`, sobrescrito pela plataforma. A API isolada usa o endereço da conexão.

## Deploy na Vercel

Um projeto no mesmo monorepo. Site e API sobem juntos.

- Root Directory: `apps/web`
- Framework: Next.js
- Install / build já estão em `apps/web/vercel.json`

Env (Production e Preview separados):

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** (`-pooler`, `sslmode=require`) |
| `DIRECT_URL` | Neon **direta** (migrations) |
| `BETTER_AUTH_SECRET` | ≥ 32 caracteres aleatórios |
| `BETTER_AUTH_URL` | URL pública do site |
| `WEB_ORIGIN` | a mesma origin; várias separadas por vírgula |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site |
| `REVALIDATION_SECRET` | string longa aleatória |
| `BLOB_READ_WRITE_TOKEN` | token do Vercel Blob |

Não defina `API_URL` na Vercel. Não coloque `ADMIN_EMAIL` / `ADMIN_PASSWORD` no runtime.

Depois do primeiro deploy, rode `pnpm db:migrate:deploy` contra o Neon de production e `pnpm admin:create` na sua máquina. Não rode migrate destrutiva automaticamente em cada Preview.

## Neon — production vs preview

| Ambiente | Banco |
| --- | --- |
| Production | Neon production (pooled em `DATABASE_URL`) |
| Preview / staging | Neon staging, projeto separado |

Não aponte Preview da Vercel para o banco de production. Configure env vars por ambiente no dashboard.

## Vercel Blob

Fluxo: sessão → `POST /v1/admin/media/upload` (`handleUpload`) → upload no cliente → `POST /v1/admin/media/complete` (head no Blob + persistência). SVG de usuário é bloqueado. Limite de imagem: 10 MB.

## Rotas públicas

- `/`
- `/colecoes`
- `/colecoes/[slug]`
- `/produtos/[slug]`
- `/a-marca`
- `/contato`

`/admin` é `noindex` e fica fora do sitemap.

## CMS

`/admin` — campanhas, coleções, produtos, mídia, leads, settings, usuários, auditoria.

## Observabilidade

Localmente, Pino remove dados sensíveis e usa o padrão da rota, sem parâmetros de query. Na Vercel, eventos JSON de conclusão e falha funcionam sem transport workers. Logs de erro registram tipo/código e correlação; não incluem mensagens, stack, corpos ou cookies que possam conter dados pessoais e segredos.

Falhas inesperadas retornam uma mensagem genérica e `correlationId`; erros de validação preservam campos e códigos úteis. Autenticação, saúde e falhas usam `no-store`. `/health` verifica o processo; `/ready` verifica o banco. Diagnóstico detalhado fica em `/v1/admin/system`, com autenticação e permissão `system:read`; não existe `/api/diag` público.

Invalidação de cache tem timeout de 5 segundos por origin e registra HTTP não-2xx. Uma falha de invalidação não desfaz a edição já persistida; o ISR público continua com renovação de 60 segundos. Verifique os eventos `cache.revalidation.*` quando a publicação demorar a aparecer.

A CI usa pnpm 10.5.2, PostgreSQL 16 e testes reais de concorrência com `RUN_API_INTEGRATION=true`. Execute esses testes somente contra um banco descartável. O install da Vercel exige o lockfile versionado.
