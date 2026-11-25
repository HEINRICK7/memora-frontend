# FE-M07/W03 — Critérios de aceite

| ID | Given / When / Then |
|---|---|
| FE-ED-AC01 | Dado draft válido, quando M07 abre em viewport mobile, então o canvas preserva proporção e fica entre o header e a toolbar sem ser encoberto. |
| FE-ED-AC02 | Dado viewport desktop 1024/1440, quando W03 abre, então biblioteca, canvas e painel de estado/propriedades seguem a hierarquia espacial da referência. |
| FE-ED-AC03 | Dado slot selecionado, quando a pessoa escolhe uma foto READY, então o slot e draft são atualizados via MEM-005 e não há alteração no original. |
| FE-ED-AC04 | Dado rascunho com slots preenchidos, quando exportar é confirmado, então MEM-007 baixa o formato suportado sem chamar publicar/compartilhar nem alterar o draft. |
| FE-ED-AC05 | Dado que o modelo não suporta texto/stickers/filtros/transforms/undo/redo, quando a barra mostra essas ferramentas, então elas estão desabilitadas e explicadas, sem feedback de ação bem-sucedida. |
| FE-ED-AC06 | Dado Layouts, quando ativado, então abre `/templates` e o draft atual permanece recuperável no navegador. |
| FE-ED-AC07 | Dadas larguras 320, 375, 390, 414, 768, 1024 e 1440, quando a tela é capturada, então não há overflow horizontal, fonte serifada ou CTA coberto pela safe area. |
| FE-ED-AC08 | Dado seletor aberto, quando a pessoa navega por teclado/fecha, então foco e rótulos respeitam o contrato MEM-005 existente. |

## Evidência

Capturar `/editor/[draftId]` com um draft real/local de teste e fotos reais de fixture selecionadas; comparar M07/W03 com as referências indicadas em `spec.md`. Documentar ferramentas ainda desabilitadas e os limites da composição v1. Não alegar teste em aparelho físico sem evidência.
