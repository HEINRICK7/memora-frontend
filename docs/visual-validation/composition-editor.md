# Validação visual — M07 Editor / W03 Editor de colagens

**Data:** 2026-10-25  
**Rota:** `/editor/[draftId]`  
**Ambiente:** Compose isolado `memora-screen-test`; frontend `127.0.0.1:3330`, API `127.0.0.1:18080`, MinIO `127.0.0.1:19000`.  
**Navegador:** Chromium headless via Playwright; viewport emulado, não representa teste em aparelho físico.

## Capturas

| Referência | Viewport | Captura |
|---|---:|---|
| M07 | 320 × 844 | [`mobile/M07-320.png`](mobile/M07-320.png) |
| M07 | 375 × 844 | [`mobile/M07-375.png`](mobile/M07-375.png) |
| M07 | 390 × 844 | [`mobile/M07-390.png`](mobile/M07-390.png) |
| M07 | 414 × 896 | [`mobile/M07-414.png`](mobile/M07-414.png) |
| M07/W03 tablet | 768 × 1024 | [`tablet/M07-W03-768.png`](tablet/M07-W03-768.png) |
| W03 | 1024 × 900 | [`desktop/W03-1024.png`](desktop/W03-1024.png) |
| W03 | 1440 × 1000 | [`desktop/W03-1440.png`](desktop/W03-1440.png) |

A comparação usa o terceiro telefone de `public/telas/Memora mobile mural creation flow-3.png` e `public/telas/image.png` para W03. Os arquivos de referência permanecem fora da interface.

## Procedimento e resultado

- As capturas M07 usam `Story trio` (2:3) com três fotografias distintas em estado `READY`; W03 usa `Grid 6` com seis fotografias distintas. As imagens vêm da biblioteca real servida pelo backend/MinIO no ambiente local, não de fotos escolhidas da pasta de marca.
- Em 320, 375, 390, 414, 768, 1024 e 1440 px, `documentElement.scrollWidth` correspondeu ao viewport. Não houve overflow horizontal nem imagens quebradas.
- Headings usam Space Grotesk e interface DM Sans. Não há fonte serifada.
- No mobile, a barra única, canvas vertical escuro, dock inferior e CTA ocupam a hierarquia principal. Ações de slot só aparecem no slot focado/tocado.
- No desktop, a barra compacta precede rail, biblioteca real de fotos, canvas central e painel claro de estado/ajustes. Em 768 px a biblioteca recolhe para manter o canvas utilizável; em 1024 e 1440 px os três painéis permanecem visíveis.
- A suíte Vitest completa passou: 29 arquivos e 201 testes. `npm run typecheck`, `git diff --check` e build Docker passaram.
- O E2E `MEM-007-AC16` passou com API, PostgreSQL, MinIO e Chromium reais: envia a fixture pelo fluxo de upload, seleciona a foto no editor, baixa PNG e JPEG e valida assinatura binária, dimensões e pixels. O probe de CORS usa a URL temporária real e o `Origin` do frontend.

## Comparação com as boards e diferenças pendentes

A estrutura e a direção de cor agora se aproximam das referências: o mobile tem canvas dominante e dock inferior; W03 tem navegação lateral, biblioteca, canvas e painel de ajustes. A barra do editor é full-width e compacta. Tokens oficiais e fontes Space Grotesk/DM Sans são usados.

M07/W03 **continuam parciais**. O `CompositionDocument` v1 permite slots de fotos sem transforms ou camadas de texto; por isso Texto, Sticker, Filtro, Posição e histórico continuam desabilitados e identificados. As boards mostram uma collage expressiva com texto, stickers, filtros, seleção e ajustes ativos; o canvas implementado ainda renderiza somente os slots do template. O template selecionado também define o título (`Story trio`/`Grid 6`), enquanto as boards mostram o exemplo “summer 26”.

O CTA mobile mantém o rótulo verdadeiro “Exportar composição” porque sua ação atual gera download local. A board diz “próximo”, que exige a transição real para configuração/publicação de um Mural; esse fluxo depende dos contratos e gates MEM-008 documentados separadamente. Não se trata a exportação como publicação.

Essas diferenças funcionais e visuais impedem marcar M07/W03 como concluídas no goal. Texto/stickers, transforms, ajustes, filtros, histórico e transição real para M08/W05 precisam de SDD, testes RED e implementação próprios antes da próxima comparação.

Não foram feitos testes em Safari iOS ou Chrome Android físicos.
