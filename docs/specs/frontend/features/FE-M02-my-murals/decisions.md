# FE-M02 — Decisões

## FE-M02-D01 — Sem favoritos simulados

A referência contém um chip “favoritos”, mas não existe campo nem endpoint de favoritos. A barra usa status reais DRAFT/PUBLISHED/ARCHIVED; a diferença textual é intencional até existir contrato rastreável.

## FE-M02-D02 — Capa e contagem vêm do endpoint de fotos

O resumo de mural não contém URL de preview ou total de fotos. M02 consulta `listMuralPhotos` para obter itens READY, calcula a contagem e escolhe como capa o preview cujo `photoId` coincide com `coverPhotoId`. Não usa fotos demo como se fossem conteúdo persistido.

## FE-M02-D03 — Rota sem perfil funcional

O item Perfil permanece visualmente presente e desabilitado até existir rota e comportamento de perfil. Os demais itens navegam apenas para rotas implementadas.

## FE-M02-D04 — Sem busca ou avatar fabricado

Busca, identidade e avatar do mockup dependem de contratos de usuário não disponíveis neste fluxo e não são apresentados como funcionais.
