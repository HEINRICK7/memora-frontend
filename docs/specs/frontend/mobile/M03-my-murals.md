# M03 — Templates

**Status:** draft SDD. **ID visual:** M03.
**Referência:** public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png, terceiro telefone, rótulo 03 TEMPLATES.
**Rota:** /templates.

## Objetivo

Permitir explorar modelos declarativos e iniciar uma composição compatível com o conjunto de fotos selecionado.

## Composição visual

- Fundo ink, wordmark branco, título “escolhe o mood” em Space Grotesk com “mood” lime.
- Chips de categoria em linha, selecionado claro sobre fundo escuro.
- Grade em duas colunas de capas com fotografia/arte: Photo Dump, Poster, 4 Frames e Vibes ficam visíveis primeiro; demais modelos podem rolar verticalmente.
- Usar arte de template local e fotos de public/brand/v2; nenhum screenshot de UI como thumbnail.

## Componentes e comportamento

- AppHeaderMobile, TemplateCategoryChips, TemplateGrid e TemplateCard.
- A seleção de chip filtra o registry real sem alterar a foto do usuário.
- Cada cartão informa nome e resumo compatível com Template: quantidade e proporção. Os rótulos da imagem são visuais; cada cartão precisa apontar a templateId/version válidos definidos em FRONTEND_SPEC.
- Abrir um modelo navega ao preview/fluxo de seleção correspondente. Não afirmar animação se houver só capa estática.

## Responsividade e acessibilidade

- Manter texto sobre área de contraste sólido/overlay; respeitar crops e evitar stickers que escondam o assunto da foto.
- Duas colunas em celular amplo, uma coluna quando necessário, sem texto clicável truncado. Chips acessíveis por teclado e leitor de tela.
- Seleção é indicada por forma/borda e texto, além da cor.

## Aceite

- **FE-M03-AC01:** catálogo usa somente templates existentes e exibe metadados reais do registry.
- **FE-M03-AC02:** categoria altera a lista e estado vazio explica como limpar filtro.
- **FE-M03-AC03:** todas as capas carregam de assets locais do brand e a tela mantém legibilidade em modo ink.

## Dúvidas / limites

O conjunto de nomes do mockup precisa ser reconciliado com IDs declarativos existentes; não criar layouts novos nem inventar recursos por nome.
