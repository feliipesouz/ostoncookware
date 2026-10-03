# Validação da entrega OSTON

Data: 3 de outubro de 2026. Base: `20066422222c2b6544a749316956f3fcf2abc4f4`.
Branch de trabalho: `feat/premium-editorial-experience`.

## Resultados

| Verificação | Resultado |
| --- | --- |
| Typecheck do monorepo | Aprovado |
| ESLint da API e web | Aprovado |
| Testes de unidade da API | 98 aprovados; 8 testes de integração PostgreSQL não executados |
| Testes de navegador em produção | 28 aprovados, zero falhas e zero skips; inclui restaurar v1 sobre v2 e verificar v3 persistida |
| Build de produção (`pnpm build`) | Aprovado: API, banco e aplicação Next |
| Importação do catálogo | Seis conjuntos publicados no banco de QA; segunda execução criou zero duplicatas |
| Inspeção desktop | Home, catálogo, produto e contato responderam 200, sem imagens quebradas ou rolagem horizontal |
| Inspeção mobile | Seis páginas de produto responderam 200 sem rolagem horizontal; menu abriu e fechou por Escape |
| Imagem do hero mobile | Decodificação concluída e fotografia confirmada na captura final |

As capturas foram feitas com a aplicação de produção, em 1440 × 1000 e 390 × 844. A revisão visual considerou presença das fotos reais, hierarquia, legibilidade e acesso aos CTAs. A compilação usa fontes WOFF2 locais licenciadas e não consulta o Google Fonts.

## Revisão colaborativa

Quatro frentes participaram da implementação e das revisões cruzadas: arquitetura e CMS; infraestrutura e segurança; direção visual e acessibilidade; conversão e SEO. As revisões cobriram a separação de marca e campanha, publicação de variantes, fontes e mídia responsiva, contratos do formulário e preservação da origem da consulta.

## Ambiente e alcance

Node 24.19 e pnpm 10.5.2. A navegação foi testada com Chromium e um banco PostgreSQL embarcado em PGlite, usando as migrações reais. Uma adaptação exclusiva do runner limitou o pool local a uma conexão por causa do protocolo de multiplexação do PGlite; essa adaptação não integra o código ou as dependências da entrega.

Os testes de navegador foram executados em três grupos com processos independentes, preservando os limites reais de requisição. A mesma divisão foi aplicada à CI para que a rajada de toda a suíte não seja confundida com abuso.

Esse ambiente valida páginas, consultas, contratos e operações editoriais, mas não comprova concorrência de conexões do PostgreSQL nativo ou desempenho em produção. Os oito testes de integração permanecem como gate na CI com PostgreSQL 16 (`RUN_API_INTEGRATION=true`). Não houve teste de carga nem medição de aumento de conversão.

Upload real no Vercel Blob, variáveis do ambiente Vercel e deployment ainda precisam ser verificados no ambiente conectado do projeto. As configurações e os testes de CSP estão incluídos; nenhum token de produção foi utilizado.

## Publicação

A permissão inicial de escrita retornava `403 Resource not accessible by integration`. Após a atualização de autorização pelo responsável, a criação de `feat/premium-editorial-experience` foi confirmada em 3 de outubro. Essa é a branch de entrega e revisão das mudanças. O ambiente de produção e seu banco permanecem separados da validação local; não houve implantação manual pela Vercel.

O catálogo oficial foi populado somente no banco descartável de validação. Para carregar os dados no ambiente real, use o importador documentado em `premium-experience.md`. Ele preserva conteúdo e estados editoriais existentes.
