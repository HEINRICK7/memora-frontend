# Memora frontend — estado de implementação

**Atualizado:** 2026-10-25.
**Estado geral:** em andamento. M01/W01 e M03/W04 foram implementadas, testadas e comparadas em Docker; M05/M06 também estão implementadas e comparadas em sete larguras. A suíte frontend atual tem 194 testes passando. A implementação visual mobile de M02 foi testada e comparada em fixture; falta habilitar navegação dos cards após a rota do proprietário ser versionada. As outras telas seguem pendentes.

| Tela | Spec | Implementada | Testada | Validada visualmente |
|---|---|---|---|---|
| M01 Welcome | Revisada | Implementada | Passou | Sim — 320, 375, 390, 414, 768 |
| M02 Seus murais | SDD FE-M02 | Visual mobile implementado; abrir card pendente da rota do proprietário | Passou | Sim — fixture visual 320, 375, 390, 414; estado vazio real 320, 375, 390, 414, 768 |
| M03 Templates | SDD FE-M03 | Implementada | Passou — 177 testes do frontend | Sim — 320, 375, 390, 414 px |
| M04 Mural público | FE-M04/W06 | Galeria compartilhada responsiva; aprovação do contrato MEM-008/009 pendente | Passou — 185 testes frontend; typecheck e build Docker | Parcial — 320, 375, 390, 414 px |
| M05 Novo mural/origem | FE-M05/M06 | Implementada em `/criar` | Passou — origem, validação e câmera | Sim — 320, 375, 390, 414, 768, 1024 e 1440 px |
| M06 Seleção de fotos | FE-M05/M06 | Implementada em `/criar` | Passou — seleção local, tray, retry e upload confirmado | Sim — 320, 375, 390, 414, 768, 1024 e 1440 px |
| M07 Editor | FE-M07/W03 SDD | Shell responsivo parcial; ferramentas de edição avançada pendentes | Passou — 201 testes unitários e E2E MEM-007 | Parcial — 320, 375, 390, 414, 768, 1024 e 1440 px; gaps registrados |
| M08 Publicação | M08 / W05 | Nome, intenção de acesso e confirmação em `/murais/[muralId]/configurar`; publicar não cria link | Passou — `mural-studio.test.tsx` | Não |
| M09 Share success | M09 | Sucesso em `/murais/[muralId]/compartilhar`; URL só da resposta inicial; sem criar CONTRIBUTE | Passou — `share-grants-panel.test.tsx` | Não |
| M10 Guest public mural | FE-M04/W06 | Galeria M04/M10 compartilhada; estado de contribuição condicionado à permissão real | Passou — 185 testes frontend; typecheck e build Docker | Parcial — 390 px com 12 previews do MinIO |
| M11 Guest contribution | Revisada | Parcial / revisar | Pendente | Não |
| M12 Contribution moderation | Revisada | Parcial / revisar | Pendente | Não |
| M13 Login | Revisada | Pendente / revisar | Pendente | Não |
| M14 Estado vazio de murais | Revisada | Parcial / revisar | Pendente | Não |
| M15 Configurar mural | M15 | Metadados, capa e leitura de mural publicado na mesma rota de M08 | Passou — conflito 409 conserva o nome digitado | Não |
| M16 Perfil | Revisada | Pendente / revisar | Pendente | Não |
| W01 Landing | Revisada | Implementada | Passou | Sim — 1024, 1440; recolhe para M01 em 768 |
| W02 Dashboard de murais | Revisada | Parcial / revisar | Pendente | Não |
| W03 Editor | FE-M07/W03 SDD | Shell desktop/tablet parcial; ferramentas de edição avançada pendentes | Passou — 201 testes unitários e E2E MEM-007 | Parcial — 768, 1024 e 1440 px; gaps registrados |
| W04 Templates | SDD FE-M03 | Implementada | Passou — 177 testes do frontend | Sim — 768, 1024, 1440 px |
| W05 Publicação | W05 | Mesma tela de M08; grade desktop no CSS, sem captura desta fatia | Passou — os mesmos testes de publicação | Não |
| W06 Mural compartilhado | FE-M04/W06 | Mosaico compartilhado responsivo; aprovação do contrato MEM-008/009 pendente | Passou — 185 testes frontend; typecheck e build Docker | Parcial — 768, 1024, 1440 px |
| W07 Contribuições | Revisada | Parcial / revisar | Pendente | Não |

Capturas, métricas, referência comparada e diferenças intencionais desta fatia estão em `docs/visual-validation/landing-entry.md`. As imagens ficam em `docs/visual-validation/mobile/`, `tablet/` e `desktop/`. Não alegar compatibilidade física sem teste em aparelho.

As evidências específicas de M03/W04 e as diferenças em relação a nomes e filtros temáticos da board estão em `docs/visual-validation/template-catalog.md`.

As evidências parciais de M04/M10/W06, limites dos contratos MEM-008/009 e diferenças justificadas em relação às boards estão em `docs/visual-validation/shared-mural.md`.

As evidências de M05/M06, capturas responsivas, fluxo de upload confirmado pelo Compose com MinIO e diferenças em relação à seleção nativa da fototeca estão em `docs/visual-validation/photo-source-selection.md`.

As evidências parciais de M07/W03, capturas em sete viewports, teste real MEM-007 e diferenças de fidelidade pendentes estão em `docs/visual-validation/composition-editor.md`.
