# FE-M07/W03 — Apresentação do editor de composição

**Status:** implementação visual parcial; shell validado por captura em sete larguras, ferramentas avançadas ainda não fazem parte do modelo v1. Ajuste de apresentação aprovado pelo juiz em 25/10/2026; sem novo contrato HTTP. Evidências: `../../../../visual-validation/composition-editor.md`.
**ID visual:** M07 mobile e W03 desktop.
**Rota:** `/editor/[draftId]`.
**Referências:** terceiro telefone de `public/telas/Memora mobile mural creation flow-3.png`; `public/telas/image.png`.
**Comportamento de domínio:** `MEM-005` (edição local) e `MEM-007` (exportação local).

## Problema e usuário

A pessoa precisa continuar uma composição iniciada por um template, preencher seus espaços com fotografias guardadas, revisar o arranjo e exportá-lo sem alterar as fotografias originais nem confundir composição com mural publicado.

## Invariantes

- **FE-ED-R01:** em mobile, o canvas é a área central da tela; header e toolbar inferior seguem a identidade v2 e a toolbar respeita a safe area.
- **FE-ED-R02:** em desktop, a interface adapta o mockup W03 com biblioteca de fotos à esquerda, canvas dominante ao centro e estado/propriedades à direita.
- **FE-ED-R03:** o canvas usa exclusivamente slots, geometria, decoradores e IDs do `CompositionDocument`/template versionado. Fotos vêm do draft local e de `PhotoGateway.listPhotos()`; URLs temporárias ficam em memória.
- **FE-ED-R04:** escolher, substituir ou remover uma foto usa as operações já suportadas por MEM-005. A operação muda somente o documento local; nunca altera bytes de uma fotografia.
- **FE-ED-R05:** Exportar chama o fluxo MEM-007 e gera download local. Não cria, atualiza, publica ou compartilha um `Mural`.
- **FE-ED-R06:** Fotos abre o seletor real de fotografias `READY`. Layouts leva ao catálogo existente, preservando o rascunho local.
- **FE-ED-R07:** texto, stickers, filtros, transforms, undo/redo e ajustes só aparecem operantes quando estiverem definidos pelo domínio. Na versão atual, `textLayers` é vazio e transforms permanecem no padrão; ações ainda não suportadas são desabilitadas e identificadas.
- **FE-ED-R08:** o canvas não apresenta fotografia sintética de marca como foto escolhida. Assets de marca podem decorar apenas cartões ilustrativos fora do documento de composição.
- **FE-ED-R09:** títulos usam Space Grotesk, controles DM Sans e tokens v2. Nenhuma fonte serifada é permitida.
- **FE-ED-R10:** seleção por teclado, foco visível, alvos de toque >=44×44 CSS px, reduced motion e larguras 320, 375, 390, 414, 768, 1024 e 1440 sem overflow horizontal.

## Estados

Preservar os estados já definidos por MEM-005/MEM-007: loading, ready, local save, dirty/retry, unavailable photo, error, exporting, cancelled, export error, complete e incompatible draft.

## Privacidade e dependências

- Drafts e relações de slots continuam em IndexedDB, sem bytes de foto ou URLs assinadas.
- Fotos elegíveis vêm do adapter real e do estado `READY`.
- Exportação usa renderer Canvas 2D e executa apenas no browser; resultado não é enviado ao backend.
- Não chamar as APIs de mural por causa da ação de exportar.

## Fora de escopo desta revisão

Adicionar transformações, crop interativo, histórico undo/redo, camadas de texto/stickers, filtros, animações ou publicação. Esses comportamentos exigem spec, evolução compatível do modelo e testes próprios antes de serem apresentados como funcionais.
