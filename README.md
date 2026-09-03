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
  → Next.js (same-origin)
    → /api/auth/* e /v1/*  (rewrite)
      → Fastify
```

O rewrite **não** é barreira de segurança. Toda rota privada autentica e autoriza na API.

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

Não use `NEXT_PUBLIC_API_URL`. O browser consome `/v1` e `/api/auth` no mesmo origin.

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
- API: http://localhost:4000/health

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

Dois projetos no mesmo monorepo.

### oston-web

- Root Directory: `apps/web`
- Framework: Next.js
- Build: `cd ../.. && pnpm install && pnpm --filter @oston/web build`
- Env: `API_URL` (URL do projeto API), `NEXT_PUBLIC_SITE_URL`, `REVALIDATION_SECRET`
- Não coloque `BLOB_READ_WRITE_TOKEN`, `DATABASE_URL` ou `BETTER_AUTH_SECRET` no web

### oston-api

- Root Directory: `apps/api`
- Framework: Other
- Build: `cd ../.. && pnpm install && pnpm --filter @oston/database generate && pnpm --filter @oston/api build`
- Output: serverless `api/index.ts`
- Env: `DATABASE_URL` (Neon **pooled**), `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (URL do **web**), `WEB_ORIGIN` (allowlist exata, vírgula), `REVALIDATION_SECRET`, `BLOB_READ_WRITE_TOKEN`

Rode `pnpm db:migrate:deploy` no release da API. Não rode migrate destrutiva automaticamente em cada Preview.

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
