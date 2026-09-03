# Segurança em produção — OSTON Cookware

Runbook curto para o site público e o CMS. Não contém segredos.

## Camadas (nesta ordem)

1. **Vercel Bot Protection**  
   Ative no projeto de produção para absorver bots e scanners antes da aplicação. É a primeira linha, não a única.

2. **Rate limit na edge / API**  
   Login (`/api/auth/*`), leads (`/v1/public/leads`) e upload já têm limite. Download de catálogo (`/v1/public/events`) também é limitado por IP. Não aumente os tetos sem motivo.

3. **Login do CMS**  
   Sessão via Better Auth, cookie httpOnly. Rotas `/admin` exigem sessão no `proxy.ts`. Endpoints `/v1/admin/*` exigem usuário autenticado e permissão (RBAC). Sem sessão = 401.

4. **Lead endpoint**  
   Público, mas com throttle por IP, validação Zod e sem eco de dados sensíveis. Não use o mesmo endpoint para analytics.

5. **Upload**  
   Só autenticado. Mime allowlist, tamanho máximo, path controlado. Nunca aceite SVG como imagem de mídia.

6. **WAF**  
   Use como camada extra (Vercel/firewall do provedor). **Nunca dependa só do WAF.** Regras de aplicação, auth e validação continuam obrigatórias se o WAF falhar ou for contornado.

## Preview (Draft Mode)

`/api/preview` só liga o modo rascunho depois de validar a sessão em `/v1/admin/me`. Caminhos são allowlist (`/`, `/colecoes`, `/colecoes/[slug]`, `/produtos/[slug]`, `/a-marca`, `/contato`). Paths protocol-relative, `//`, `\\` ou `http` são recusados. Rascunhos não entram no sitemap nem no JSON-LD público.

## Checklist de go-live

- `VERCEL_ENV=production` e `NODE_ENV=production` (o badge STAGING some no admin).
- Segredos só em variáveis de ambiente da Vercel (`DATABASE_URL`, `REVALIDATION_SECRET`, tokens de blob, `BETTER_AUTH_SECRET`).
- Origens CORS e `NEXT_PUBLIC_SITE_URL` apontando para o domínio canônico.
- Bot Protection + rate limit + WAF ligados juntos.
- Confirmar que `/admin` responde `noindex` e `Cache-Control: no-store`.
