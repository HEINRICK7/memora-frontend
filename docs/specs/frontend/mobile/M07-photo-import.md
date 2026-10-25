# M07 — Editor

**Status:** draft SDD. **ID visual:** M07.
**Referência:** public/telas/Memora mobile mural creation flow-3.png, terceiro telefone, rótulo 07 CRIE DO SEU JEITO.
**Rota:** /editor/[draftId].

## Objetivo

Editar uma composição local sem alterar os arquivos originais das fotos.

## Composição visual

- Header escuro com voltar, wordmark e estado/ação de salvar rascunho.
- Canvas fotográfico vertical quase ocupa a tela; colagem assimétrica com bordas tipo recorte e lettering/stickers editáveis.
- Barra de ferramentas inferior com Fotos, Layout, Texto e Sticker; ação principal lime “próximo”.
- Títulos e lettering de interface não usam fonte serifada; fontes de composição são identificadas separadamente no contrato de template, sem trocar fonte da UI.

## Comportamento e estados

- Tap em slot permite escolher/substituir imagem; drag/reposicionamento, crop e zoom seguem os comandos de Composition definidos em FRONTEND_SPEC.
- Mudanças são não destrutivas e podem ser desfeitas apenas quando houver histórico implementado; arquivos originais não são sobrescritos.
- Próximo segue M08 com composição e seleção preservadas. Salvar rascunho persiste somente quando o caso de uso correspondente confirma sucesso.
- Estado dirty, saving, saved, save_failed e exporting são comunicados sem descarte silencioso.

## Responsividade e acessibilidade

- Canvas usa área disponível, mantém proporção do template e não fica atrás da toolbar; toolbar respeita env(safe-area-inset-bottom).
- Controles têm alvos ≥44×44 px, labels acessíveis, foco visível e alternativa de botões/slider para gestos.
- Reduzir movimento não essencial quando prefers-reduced-motion está ativo.

## Aceite

- **FE-M07-AC01:** editar posição/trocar foto modifica somente CompositionDocument local; hash/bytes do original ficam intactos.
- **FE-M07-AC02:** voltar com alterações não salvas pede salvar ou descartar; falha de salvamento conserva a composição em estado recuperável.
- **FE-M07-AC03:** tela permanece usável em 375–414 px, toolbar e CTA não encobrem o canvas.

## Dúvidas / limites

Filtros e animações só aparecem operantes quando definidos por templates/casos de uso reais; mockup por si só não aprova efeitos novos.
