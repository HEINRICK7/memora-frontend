# Memora frontend — estado de implementação

**Atualizado:** 2026-10-25.
**Estado geral:** em andamento. M01/W01 e M03/W04 foram implementadas, testadas e comparadas em Docker. M05/M06 foram implementadas em `/criar`, passaram por testes e validação visual em sete viewports; as demais telas seguem pendentes.

| Tela | Spec | Implementada | Testada | Validada visualmente |
|---|---|---|---|---|
| M01 Welcome | Revisada | Implementada | Passou | Sim — 320, 375, 390, 414, 768 |
| M02 Seus murais | SDD FE-M02 | Visual mobile implementado; abrir card pendente da rota do proprietário | Passou | Sim — fixture visual 320, 375, 390, 414; estado vazio real 320, 375, 390, 414, 768 |
| M03 Templates | SDD FE-M03 | Implementada | Passou — 177 testes do frontend | Sim — 320, 375, 390, 414 px |
| M04 Mural público | Revisada | Parcial / revisar | Pendente | Não |
| M05 Novo mural/origem | FE-M05/M06 | Implementada em `/criar` | Passou — seleção de origem, validação e câmera | Sim — 320, 375, 390, 414, 768, 1024 e 1440 px |
| M06 Seleção de fotos | FE-M05/M06 | Implementada em `/criar` | Passou — seleção local, tray, retry e upload confirmado | Sim — 320, 375, 390, 414, 768, 1024 e 1440 px |
| M07 Editor | Revisada | Parcial / revisar | Pendente | Não |
| M08 Publicação | Revisada | Parcial / revisar | Pendente | Não |
| M09 Share success | Revisada | Parcial / revisar | Pendente | Não |
| M10 Guest public mural | Revisada | Parcial / revisar | Pendente | Não |
| M11 Guest contribution | Revisada | Parcial / revisar | Pendente | Não |
| M12 Contribution moderation | Revisada | Parcial / revisar | Pendente | Não |
| M13 Login | Revisada | Pendente / revisar | Pendente | Não |
| M14 Estado vazio de murais | Revisada | Parcial / revisar | Pendente | Não |
| M15 Configurar mural | Revisada | Parcial / revisar | Pendente | Não |
| M16 Perfil | Revisada | Pendente / revisar | Pendente | Não |
| W01 Landing | Revisada | Implementada | Passou | Sim — 1024, 1440; recolhe para M01 em 768 |
| W02 Dashboard de murais | Revisada | Parcial / revisar | Pendente | Não |
| W03 Editor | Revisada | Parcial / revisar | Pendente | Não |
| W04 Templates | SDD FE-M03 | Implementada | Passou — 177 testes do frontend | Sim — 768, 1024, 1440 px |
| W05 Publicação | Revisada | Parcial / revisar | Pendente | Não |
| W06 Mural compartilhado | Revisada | Parcial / revisar | Pendente | Não |
| W07 Contribuições | Revisada | Parcial / revisar | Pendente | Não |

Capturas, métricas, referência comparada e diferenças intencionais desta fatia estão em `docs/visual-validation/landing-entry.md`. As imagens ficam em `docs/visual-validation/mobile/`, `tablet/` e `desktop/`. Não alegar compatibilidade física sem teste em aparelho.

As evidências específicas de M03/W04 e as diferenças em relação a nomes e filtros temáticos da board estão em `docs/visual-validation/template-catalog.md`.

As evidências de M05/M06, capturas responsivas e fluxo de upload com MinIO estão em `docs/visual-validation/photo-source-selection.md`.
