# FE-M03 — Decisões

## FE-M03-D01 — IDs e nomes pertencem ao registry

Cards usam literalmente os oito nomes e IDs de `TEMPLATE_CATALOG_V1`. Rótulos editoriais da board (“Photo Dump”, “Poster”, “4 Frames”, “Vibes”) não substituem os templates existentes nem sugerem layouts não declarados.

## FE-M03-D02 — Fotografias de marca são exemplos visuais

Os previews usam somente fotos locais aprovadas em `public/brand/v2/`, posicionadas conforme os slots do template. Elas não são atribuídas ao usuário e não são persistidas nem enviadas ao MinIO.

## FE-M03-D03 — Chips refletem filtros implementados

Como o registry não tem tags temáticas, os chips móveis expõem “Todos” e quantidades de fotos; proporção aparece em uma segunda faixa rolável. As faixas rolam de forma independente para evitar overflow da página. Busca por nome, descrição ou ID é local, pois os dados são locais.

## FE-M03-D04 — Preview estático, sem animação ou rota inventada

O preview apresenta fotografias de amostra dentro da geometria declarada. Não cria rota/modal adicional, não afirma que há animação e não seleciona fotografias para o usuário.

## FE-M03-D05 — Tipografia e contraste

Space Grotesk é usada nos títulos e no wordmark; DM Sans na interface. M03 mobile segue fundo ink e destaque lime da referência. Em W04 desktop, “mood” usa cobalt sobre paper para preservar contraste WCAG AA. A tela não declara fonte serifada.
