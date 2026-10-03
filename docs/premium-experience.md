# Experiência OSTON — outubro de 2026

## Direção e resultado

A experiência prioriza a escolha de um conjunto de panelas de maior valor: fotografia real, exploração das cores, composição legível e atendimento com contexto. A referência à Lusion orientou a direção de movimento e apresentação; Lusion é um estúdio, e nenhuma dependência com esse nome foi instalada.

O projeto continua sendo marca, catálogo, captação de consultas e CMS. Pagamento, cálculo de frete, estoque integrado e checkout não fazem parte desta entrega. A conversão construída é o envio de uma consulta identificando o conjunto escolhido.

### Experiência pública

- Hero editorial com CTAs imediatos, imagem responsiva e movimento leve por ponteiro.
- Seletor das seis cores na home, busca por coleção sem distinção de acentos e comparação visual de até três coleções.
- Página de produto com galeria ampliável, composição, capacidades, especificações e consulta contextual.
- Formulário preserva dados em falhas, evita envio duplicado e aceita consulta sem e-mail ou parâmetros UTM.
- A origem da campanha acompanha a navegação por até 30 minutos na aba, usando apenas os parâmetros UTM permitidos e o caminho público.
- Menu mobile e galeria usam dialog nativo; navegação por teclado e preferência por movimento reduzido são respeitadas.
- Tokens de cor, tipografia, superfícies e movimento centralizados no design system. Os componentes públicos compartilham esse vocabulário.

Não foram acrescentados carrosséis automáticos, um motor 3D ou dependências de animação ao carregamento inicial. A fotografia oficial é a principal evidência visual do produto.

## Catálogo oficial

As onze imagens fornecidas pelo responsável foram convertidas para WebP, preservando enquadramento e conteúdo. Arquivos em `apps/web/public/catalogo/`.

| Código | Coleção | URL do produto |
| --- | --- | --- |
| OS-18 | Rosé | `/produtos/conjunto-rose-20-pecas` |
| OS-19 | Creme | `/produtos/conjunto-creme-20-pecas` |
| OS-20 | Cappuccino | `/produtos/conjunto-cappuccino-20-pecas` |
| OS-21 | Black Piano | `/produtos/conjunto-black-piano-20-pecas` |
| OS-22 | Terracota | `/produtos/conjunto-terracota-20-pecas` |
| OS-23 | Eucalipto | `/produtos/conjunto-eucalipto-20-pecas` |

O texto “20 peças com acessórios”, os diâmetros e as capacidades foram transcritos do catálogo. Não há confirmação de preço final, materiais, revestimento, compatibilidade com indução, garantia ou estoque nas fontes recebidas; esses campos não foram inventados. A disponibilidade cadastral `AVAILABLE` permite consulta e não é apresentada como prova de estoque.

`catalog-data.ts` é a fonte da importação inicial. Depois da importação, o CMS e o banco são a fonte de verdade. Despublicar um produto não faz uma cópia estática reaparecer no site.

### Importação

Configure `DATABASE_URL`, `DIRECT_URL` e `NEXT_PUBLIC_SITE_URL` para o ambiente pretendido. A URL pública precisa corresponder ao endereço definitivo das imagens incluídas no projeto.

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:catalog
```

O comando acima cria os novos registros em rascunho. Para uma importação inicial já publicada:

```bash
pnpm db:catalog --publish
```

Os dois modos preservam registros já existentes, inclusive estado editorial e alterações de conteúdo. Rodar `--publish` depois de importar rascunhos não os publica: use o CMS. Slugs ocupados por outros produtos ou coleções interrompem a importação com uma mensagem explícita. Cada conjunto é criado em uma transação; conjuntos anteriores permanecem se um posterior falhar, permitindo retomar.

As mídias e configurações existentes não são substituídas. O importador não remove conteúdo DEMO, não modifica a homepage existente e não força invalidação do cache. Revise/despublique itens DEMO pelo CMS e aguarde a renovação pública de até 60 segundos, ou invalide as tags pelos mecanismos existentes.

## Operação de marca e campanhas

O bloco `BRAND_HERO` contém a apresentação institucional. O espaço `SEASONAL_CAMPAIGN` é independente, adequado a Dia das Mães, lançamentos e outras ações. Configurações anteriores de hero continuam legíveis.

1. Configure o hero institucional em **Admin → Homepage**.
2. Cadastre a campanha com imagem desktop/mobile, CTA, status e período.
3. Ative um espaço sazonal e escolha seleção automática ou uma campanha fixa.
4. Use o preview autenticado para conferir antes de publicar.

Campanhas excluídas, arquivadas ou fora do período não aparecem publicamente. Uma campanha fixa vencida não é trocada silenciosamente por outra oferta. O início é inclusivo, o fim exclusivo, e o desempate é determinístico. A troca automática acompanha o cache público de até 60 segundos.

Salvar a homepage publica suas alterações. Salvar uma campanha publicada como rascunho a retira do público; o editor comunica esse efeito. Não há um segundo rascunho paralelo à versão publicada.

A imagem do Fogaça não estava entre os materiais fornecidos. A área de embaixador começa desativada e o hero permanece editável para receber a fotografia e o texto aprovados, sem simular um endosso no conteúdo padrão.

## Arquitetura e infraestrutura

- Contratos Zod compartilhados validam os novos blocos editoriais e o período das campanhas.
- Regras de seleção de campanhas ficam no domínio/aplicação; componentes apenas apresentam o resultado.
- Homepage usa concorrência otimista atômica, incluindo a primeira gravação. A leitura não cria registros.
- Histórico recebe propriedades serializáveis no Next; restaurar uma revisão anterior compara a versão atual do registro e cria uma nova revisão, preservando o controle de concorrência.
- A análise de referências de mídia inclui a homepage, impedindo exclusão de imagens ainda utilizadas.
- Limites de requisição persistidos usam `INSERT ... ON CONFLICT` e o relógio do banco.
- Diagnóstico público detalhado foi removido; falhas inesperadas usam resposta genérica e ID de correlação.
- Cabeçalhos, CSP do Vercel Blob, invalidação com timeout e logs serverless foram ajustados.
- Instalação Vercel respeita lockfile e a faixa Node acompanha os requisitos do Prisma.

São evoluções dos módulos existentes. Não foi introduzida uma camada de abstração para cada tabela, um segundo servidor obrigatório na Vercel ou outro framework de domínio.

## SEO

Metadados, canonical, Open Graph, breadcrumbs e sitemap usam conteúdo real. Datas de atualização são as persistidas, e previews, conteúdo DEMO e ambientes locais não são indexáveis. JSON-LD de oferta exige produto real disponível com preço válido; o catálogo sob consulta não publica preços ou avaliações fictícios. Não há promessa de posição no Google.

## Mídia editorial

`apps/web/public/editorial/culinary-atmosphere.webp` é uma imagem gerada para ambientação: ingredientes, linho e luz suave em uma cozinha escura. Não representa uma fotografia de produto OSTON nem mostra uma pessoa. As fotos dos conjuntos e as páginas do catálogo são as imagens oficiais recebidas.

## Verificação e implantação

Consulte `validation-report.md` para os resultados desta entrega e os limites do ambiente de testes. O fluxo de CI inclui PostgreSQL 16, integração e testes de navegador. Antes de apontar tráfego para a nova versão, o ambiente Vercel deve ter suas próprias variáveis, banco e Blob configurados conforme o README.
