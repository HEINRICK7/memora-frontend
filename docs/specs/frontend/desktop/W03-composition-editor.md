# FE-W03 — Editor de composições desktop

**Status:** draft SDD; requer revisão comportamental antes do aceite final.
**Requirement IDs:** FE-W03-R01–R07 · **Acceptance IDs:** FE-W03-AC01–AC08.
**Route/access:** /editor/[draftId] · rascunho local ou pessoa autorizada, conforme FRONTEND_SPEC.

## Objective

Editar uma Composition de forma não destrutiva, mantendo templates declarativos, seleção de fotos e alterações separadas do mural persistente.

## Visual reference

Arquivo public/telas/image.png, captura completa do editor desktop. A faixa superior escura, biblioteca à esquerda, canvas central e painel de ajustes à direita são interface; ícones, controles e bordas do mockup são alvo visual, não moldura de aplicação externa.

## Layout and components

- Barra superior ink com marca compacta, breadcrumb do rascunho, estado salvo, desfazer/refazer, prévia e ação “Concluir edição”. Essa ação encerra apenas a edição local; publicar um mural é um fluxo separado.
- Coluna esquerda escura com ferramentas e biblioteca de fotos; a lista mostra miniaturas disponíveis para o rascunho e ação explícita para adicionar fotos.
- Canvas central é a maior área e preserva proporção do template. Slots mostram fotos selecionadas com transformação/crop sem alterar originais. Stickers e texto são camadas da composição.
- Painel direito claro contém propriedades do item selecionado: imagem/camada, posição, recorte, borda e ajustes existentes no modelo.
- Controles de zoom e ajuste do canvas ficam junto à região central. Adaptação de mobile corresponde a M07 e usa toolbar inferior.
- Componentes: EditorTopbar, AssetLibrary, EditorToolRail, CompositionCanvas, PropertiesPanel, SelectionToolbar, ZoomControl e SaveStatus.
- Paleta ink/paper/lime/cobalt/coral; títulos Space Grotesk, controles DM Sans. Nenhuma tipografia serifada.

## Interactions, states and navigation

- Selecionar slot permite trocar foto; mover/redimensionar/crop altera apenas o documento de composição e seus transforms normalizados.
- Ações de undo/redo, salvar, prévia e exportação existem somente quando já previstas no editor e no modelo MEM-005/MEM-007. Não simular efeitos, filtros ou publicação do mural como edição da composição.
- Mudança não salva fica indicada; saída com estado dirty segue a confirmação descrita em FRONTEND_SPEC. Falha de persistência local não descarta trabalho silenciosamente.
- Estados: carregando rascunho, pronto, dirty, salvando, salvo, erro recuperável, exportando e template incompatível. Cada estado preserva canvas e ferramentas sem deslocamento abrupto.
- “Concluir edição” encerra ou exporta a Composition conforme MEM-005/MEM-007. Não cria nem publica um mural; publicação exige mural persistido e ação própria conforme MEM-008.

## Responsive and accessibility

- 1440 px: biblioteca, canvas e propriedades simultâneos; 1024 px reduz painéis sem diminuir a legibilidade do canvas.
- Tablet pode mover propriedades para drawer; em 768 px ou menos a tela usa a especificação M07, com toolbar inferior e safe-area inset.
- Toda operação de arraste tem alternativa por botões/campos acessíveis; canvas tem descrição/controles equivalentes quando possível. Teclado, foco visível, nomes acessíveis, 44×44 CSS px para alvos, contraste AA e prefers-reduced-motion.

## Acceptance

- **FE-W03-AC01:** screenshot desktop tem biblioteca à esquerda, canvas dominante ao centro e propriedades à direita, na proporção da referência.
- **FE-W03-AC02:** fotos do canvas são as selecionadas para o rascunho e nenhuma fotografia original é alterada.
- **FE-W03-AC03:** transformação e posição seguem o CompositionDocument normalizado e o template/version reais.
- **FE-W03-AC04:** nenhuma ferramenta anuncia ação fora do escopo suportado; a publicação do mural não é inferida de “concluir edição”.
- **FE-W03-AC05:** estados clean/dirty/saving/saved/error são percebidos sem depender apenas de cor e não perdem alterações por falha de rede.
- **FE-W03-AC06:** Space Grotesk/DM Sans e tokens v2 são usados sem fonte serifada.
- **FE-W03-AC07:** layout adapta-se em 1440, 1024, 768, 414, 390, 375 e 320 px; canvas não causa overflow horizontal.
- **FE-W03-AC08:** seleção, ferramentas e mudanças essenciais são acessíveis por teclado, com alternativa a gestos.
