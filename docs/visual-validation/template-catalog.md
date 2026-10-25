# Validação visual — M03 Templates / W04 Catálogo desktop

**Build:** imagem Docker `memora-frontend` em `http://localhost:3300`.

**Rota:** `/templates`.

**Data:** 2026-10-25.

**Navegador:** Chromium via Playwright, desktop emulado; não representa teste em aparelho físico.

## Evidências

| Referência | Viewport | Captura |
|---|---:|---|
| M03 | 320 × 844 | [`mobile/M03-320.png`](mobile/M03-320.png) |
| M03 | 375 × 844 | [`mobile/M03-375.png`](mobile/M03-375.png) |
| M03 | 390 × 844 | [`mobile/M03-390.png`](mobile/M03-390.png) |
| M03 | 414 × 896 | [`mobile/M03-414.png`](mobile/M03-414.png) |
| W04 tablet | 768 × 1024 | [`tablet/W04-768.png`](tablet/W04-768.png) |
| W04 desktop | 1024 × 900 | [`desktop/W04-1024.png`](desktop/W04-1024.png) |
| W04 desktop | 1440 × 1000 | [`desktop/W04-1440.png`](desktop/W04-1440.png) |

## Resultado observado

- M03 mobile usa fundo ink, wordmark, retorno, busca, título Space Grotesk em duas linhas, destaque lime, chips e grade fotográfica em duas colunas. Em 320 px, o catálogo passa a uma coluna para manter cartões legíveis.
- W04 usa o cabeçalho desktop existente, título “qual é o mood?”, destaque cobalt sobre paper para manter contraste AA, filtros reais e grade com quatro colunas em 1440 px, três em 1024 px e duas em 768 px.
- Os cards informam a proporção exata do registry, e os alvos de todos os chips medem pelo menos 44 × 44 CSS px.
- DM Sans é usada na interface. Não há fontes serifadas.
- Os oito cards aparecem em ordem do registry. As 24 imagens dos slots carregaram de `public/brand/v2/photos/**`; não são imagens de usuário nem screenshots de UI.
- `document.documentElement.scrollWidth` correspondeu à largura de cada viewport (320, 375, 390, 414, 768, 1024 e 1440 px). Não houve overflow horizontal da página.
- Smoke E2E no Docker: a busca por `duo-side-by-side` retornou o card do registry; selecionar e usar esse card criou o rascunho local e abriu `/editor/{draftId}`.
- Busca, seleção e filtros operam localmente. Criar e retomar composição continuam usando o armazenamento local e o editor existente, sem chamada HTTP.

## Diferenças intencionais em relação às boards

- A board sugere “Photo Dump”, “Poster”, “4 Frames”, “Vibes”, filtros de tema e selo “novo”. Como não há esses IDs, tags ou metadados no registry, a interface usa nomes e layouts existentes, filtra por quantidade/proporção e não mostra selo de novidade.
- Os chips reais são organizados em duas faixas roláveis no mobile para separar quantidade de proporção e evitar alargar a página.
- O card mostra uma prévia estática com fotos da marca encaixadas nos slots declarados. A tela não afirma que existe animação ou rota de preview independente.
- A seção de rascunhos locais continua abaixo do catálogo para preservar a funcionalidade real já existente; ela aparece na captura de página completa, abaixo da área principal da referência.
