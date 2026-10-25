# FE-W05 — Configurar e publicar mural desktop

**Status:** draft SDD; depende dos contratos MEM-004/MEM-006/MEM-008 aprovados.
**Requirement IDs:** FE-W05-R01–R07 · **Acceptance IDs:** FE-W05-AC01–AC08.
**Route/access:** /murais/[muralId]/configurar · proprietário do mural.

## Objective

Permitir revisar capa, título, descrição e audiência do Mural antes da transição explícita de DRAFT para PUBLISHED, sem confundir Mural com Composition.

## Visual reference

Arquivo public/telas/Memora templates and publish flow-4.png, painel inferior. A colagem ocupa a coluna esquerda; formulário/decisões e CTA ficam à direita. Moldura do macOS é externa.

## Layout and components

- Header global em ink com navegação, CTA e perfil.
- Grid de duas colunas: prévia/capa fotográfica ampla à esquerda; painel claro à direita com h1, campo de nome, privacidade, capacidade de colaboração quando aprovada e botão lime de publicar.
- A prévia mostra fotos associadas ao mural e sua capa. Imagem original não é alterada; Composition continua um documento separado, local e exportável.
- Campos exibem estado de edição, limite de texto definido pelo contrato, capa atual e seleção/limpeza explícita. A confirmação visual resume título, descrição, capa, quantidade de fotos e alcance real do acesso.
- Components: PublishPreview, MuralMetadataForm, CoverPhotoSelector, VisibilitySummary, PublishConfirmationDialog e StatusNotice.
- Space Grotesk em headings; DM Sans em labels e estados. Tokens v2; sem fonte serifada.

## Interactions, states and navigation

- PATCH de metadata/capa usa contrato MEM-004 e If-Match. A publicação usa ação explícita MEM-008 e só é habilitada com dados válidos e fotos associadas READY.
- Publicar não cria grant nem compartilha automaticamente; sucesso apresenta PUBLISHED e próximo passo de criar um link VIEW em rota própria.
- O mockup inclui toggle para permitir fotos de amigos. Ele permanece oculto ou desabilitado com explicação até existir contrato/backend aprovado para grant CONTRIBUTE e moderação. A UI jamais concede contribuição pelo estado visual de um switch.
- Estados: carregamento, edição, conflito de versão, validação, publicação em curso, publicação concluída e falha recuperável. Cancelar confirmação não envia a mutação.
- Um mural já publicado respeita a regra de imutabilidade de MEM-008; não apresentar controles de edição indisponíveis.

## Responsive and accessibility

- 1440 px: colagem larga e painel de formulário numa grade 60/40 aproximada. A 1024 px reduz margens e mantém CTA visível.
- Em tablet/mobile, conteúdo empilha e mantém a capa antes da confirmação, conforme M08/M15. CTA respeita safe-area e não sobrepõe campos.
- Labels explícitos, erros anunciados, foco preso/restaurado corretamente no diálogo, botões com >=44×44 CSS px, contraste AA e status sem dependência exclusiva de cor.

## Acceptance

- **FE-W05-AC01:** proporção e hierarquia da referência (colagem à esquerda, painel à direita) são reproduzidas em desktop sem a moldura de captura.
- **FE-W05-AC02:** título, descrição e capa persistem apenas por contrato real, com versão/ETag retornada pelo backend.
- **FE-W05-AC03:** confirmação mostra o conteúdo e audiência efetivos; cancelar não envia publish.
- **FE-W05-AC04:** publish exige coleção READY e ação explícita; sucesso não gera grant/link automaticamente.
- **FE-W05-AC05:** opção de contribuição não é habilitada sem autorização e contrato MEM-009 aprovados.
- **FE-W05-AC06:** estados de loading, conflito, falha e sucesso preservam conteúdo e seleção.
- **FE-W05-AC07:** versão publicada não expõe controles de edição que o backend rejeitará.
- **FE-W05-AC08:** tela é utilizável em 1440, 1024, 768, 414, 390, 375 e 320 px e não inclui fonte serifada.
