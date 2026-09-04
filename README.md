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

- Node.js 20+
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
- `@fastify/rate-limit` em memória é **camada adicional**, não a proteção principal.

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

Logs Pino com redaction de cookie, authorization, password, tokens, `DATABASE_URL` e Blob token. Respostas de erro de production levam `correlationId`, sem stack.
