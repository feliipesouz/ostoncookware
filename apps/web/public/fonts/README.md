# Fontes locais

WOFF2 Latin oficiais distribuídos pelo Google Fonts e recuperados, sem alteração de bytes, dos assets emitidos por uma execução anterior de `next/font/google`. O CSS gerado dessa execução identifica as famílias e seus arquivos. O subconjunto inclui os caracteres usados em português brasileiro.

`src/app/layout.tsx` usa `next/font/local`: o build não precisa consultar Google Fonts. As famílias, variáveis CSS, pesos e `font-display: swap` foram preservados. Os arquivos são servidos pela própria aplicação, com preload e fallback ajustado pelo Next.

Cada família permanece sob sua licença SIL Open Font License 1.1, incluída integralmente neste diretório. Não há modificação do desenho, conversão ou subsetting adicional. Fontes e licenças podem ser distribuídas junto com a aplicação.

## Cormorant Garamond

- Arquivo: `cormorant-garamond-latin.woff2`
- Versão interna: Version 4.001
- Eixo `wght`: 300–700
- Tamanho: 37776 bytes
- SHA-256: `5d618c462b7a5b74f442e1548880086af71764d9cc7d35c16ab45353da934621`
- Licença: [OFL-cormorant-garamond.txt](./OFL-cormorant-garamond.txt)
- Projeto e licença oficial: https://github.com/google/fonts/tree/main/ofl/cormorantgaramond

## Manrope

- Arquivo: `manrope-latin.woff2`
- Versão interna: Version 4.504
- Eixo `wght`: 200–800
- Tamanho: 24576 bytes
- SHA-256: `e310b55a7fd9677f5e3555e6c6c4d064fa1f1d24393f0ddbe217cea12a8c432f`
- Licença: [OFL-manrope.txt](./OFL-manrope.txt)
- Projeto e licença oficial: https://github.com/google/fonts/tree/main/ofl/manrope

Ao atualizar as fontes, preserve as licenças, verifique os glifos em português e atualize os hashes. Não recoloque downloads de fontes no processo de build.
