# FE-M07/W03 — Contratos

| ID | Fronteira | Contrato |
|---|---|---|
| FE-ED-C01 | rota → apresentação | `draftId` busca draft local; ausência ou documento incompatível usa recuperação MEM-005 sem apagar o conteúdo persistido. |
| FE-ED-C02 | apresentação → domínio | posições e IDs de slots vêm do template; `setPhotoForSlot`/`removePhotoFromSlot` são as únicas edições nesta versão. |
| FE-ED-C03 | apresentação → PhotoGateway | somente `READY` de `listPhotos()` pode preencher slot; preview URL permanece volátil e nunca entra no draft. |
| FE-ED-C04 | apresentação → aplicação | exportar usa `exportComposition`; a saída é download local e não chama MuralGateway. |
| FE-ED-C05 | toolbar → capacidade | ação suportada tem efeito real documentado; ação fora do modelo é desabilitada com explicação, sem mock ou estado de sucesso. |
| FE-ED-C06 | apresentação → navegação | Layouts aponta para `/templates`; draft persiste pelo adapter MEM-005 antes de qualquer navegação. |
| FE-ED-C07 | adaptador → infra | reuse de `LocalCompositionDraftStore`, `PhotoGateway` e `CompositionExportRenderer`; sem endpoint HTTP novo. |

## Segredos e imagens

Não persistir URL assinada, dados de imagem, token ou resposta de storage no documento local. Fotos do canvas devem corresponder a `assetId` referenciado pelo draft. Nenhum screenshot de board pode ser usado como asset de composição.
