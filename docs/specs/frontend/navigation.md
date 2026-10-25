# Navegação frontend

Esta tabela descreve rotas atuais e destinos necessários para as referências. Uma rota nova não autoriza um endpoint novo; chamadas de API continuam limitadas aos contratos versionados. Estados de login, compartilhamento e contribuição devem respeitar os ADRs e as features correspondentes.

| Destino | Telas | Situação observada | Regra |
|---|---|---|---|
| `/` | M01, W01 | Existe | Landing responsiva; criação vai ao catálogo local `/templates`; não deve substituir nem descartar biblioteca de fotos |
| `/biblioteca` | Fluxo atual de fotos | Nova rota de apresentação do recurso existente | Preserva seleção, salvamento e gerenciamento via PhotoGateway; não muda o contrato de upload |
| `/meus-murais` | M02, M14, W02 | Existe | Dados reais do gateway; M14 é empty state, não rota/API diferente |
| `/templates` | M03, W04 | Existe | Catálogo local aprovado; preview não promete integração ausente |
| `/templates/[templateId]` | Preview de template do brief | A confirmar no inventário | Reusar dados/contratos de templates; sem publicar por mock |
| `/criar` | M05–M06 | Planejada; a rota ainda não existe | Etapas de origem e seleção seguem MEM-001; Google Fotos/câmera só aparecem funcionais quando houver integração real |
| `/editor/[draftId]` | M07, controles de texto/sticker, W03 | Existe | Documento de composição local; regras em domain/application existentes |
| `/murais/[muralId]/configurar` | M08, M15, W05 | Existe | Persistência/capa/publicação sob MEM-002/004/008 e contratos aprovados |
| `/murais/[muralId]/compartilhar` | M09 | Existe | Criar/listar/revogar VIEW sob MEM-008; link só aparece após resposta real |
| `/m/[shareToken]` | M04, M10, W06 | Existe | Leitura pública somente por contrato shared; nunca expor dados privados ou original |
| `/m/[shareToken]/contribuir` | M11 | A confirmar no inventário | Só habilitar conforme MEM-009 backend aprovado; contribuição nunca é publicada sem aprovação |
| `/murais/[muralId]/contribuicoes` | M12, W07 | Existe | Só mostrar fila/ações conectadas à API real e política de moderação |
| `/entrar` | M13 | A confirmar no inventário | Não simular OAuth nem login de produção; perfil local deve ser identificado como local |
| `/perfil` | M16 | A confirmar no inventário | Não inventar estatísticas ou preferências persistidas |

M08 é a revisão/configuração antes da publicação, com confirmação explícita; M15 é a edição de metadados/capa do mural conforme seu estado. Ambas usam `/murais/[muralId]/configurar`, mas seus CTAs e campos variam pelo estado real retornado pelo backend; não misturar publicação, grant VIEW e edição após publicação.

Os nomes e estados da rota podem ser refinados na implementação após o inventário, preservando URLs já existentes. Se uma função representada no mockup não tiver contrato ou backend, a spec de tela deve registrar estado indisponível ou fora de escopo e a UI não deve alegar sucesso.
