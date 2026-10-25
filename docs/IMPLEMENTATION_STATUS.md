# Memora frontend — estado de implementação

**Atualizado:** 2026-10-25.
**Estado geral:** em andamento. M01/W01 foram implementadas, testadas e comparadas em Docker nos viewports 320, 375, 390, 414, 768, 1024 e 1440 px. A implementação visual mobile de M02 foi testada e comparada em fixture; falta habilitar navegação dos cards após a rota do proprietário ser versionada. W02 e as outras telas seguem pendentes.

| Tela | Spec | Implementada | Testada | Validada visualmente |
|---|---|---|---|---|
| M01 Welcome | Revisada | Implementada | Passou | Sim — 320, 375, 390, 414, 768 |
| M02 Seus murais | SDD FE-M02 | Visual mobile implementado; abrir card pendente da rota do proprietário | Passou | Sim — fixture visual 320, 375, 390, 414; estado vazio real 320, 375, 390, 414, 768 |
| M03 Templates | Revisada | Parcial / revisar | Pendente | Não |
| M04 Mural público | Revisada | Parcial / revisar | Pendente | Não |
| M05 Novo mural/origem | Revisada | Pendente / revisar | Pendente | Não |
| M06 Seleção de fotos | Revisada | Parcial / revisar | Pendente | Não |
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
| W04 Templates | Revisada | Parcial / revisar | Pendente | Não |
| W05 Publicação | Revisada | Parcial / revisar | Pendente | Não |
| W06 Mural compartilhado | Revisada | Parcial / revisar | Pendente | Não |
| W07 Contribuições | Revisada | Parcial / revisar | Pendente | Não |

Capturas, métricas, referência comparada e diferenças intencionais desta fatia estão em `docs/visual-validation/landing-entry.md`. As imagens ficam em `docs/visual-validation/mobile/`, `tablet/` e `desktop/`. Não alegar compatibilidade física sem teste em aparelho.
