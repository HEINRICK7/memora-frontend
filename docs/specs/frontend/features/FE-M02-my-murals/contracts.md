# FE-M02 — Contratos rastreáveis

| ID | Interface | Uso em M02 | Garantia |
|---|---|---|---|
| FE-M02-C01 | `MuralGateway.listMurals({ limit, status?, cursor? })` → `MuralPage` | Carrega a coleção do proprietário e paginação | O backend filtra por owner; cada item inclui id, status, título e `coverPhotoId` nullable. Sem dados locais inventados. |
| FE-M02-C02 | `MuralPhotoGateway.listMuralPhotos(muralId)` → `MuralPhotoPage` | Obtém fotos READY, preview temporário e cardinalidade | `items` contém `photoId`, `position`, `previewUrl` e expiração; capa selecionada por correspondência com `coverPhotoId`. URL privada só é consumida como imagem. |
| FE-M02-C03 | `MuralListQuery.status` | Filtro de status | Valores permitidos DRAFT, PUBLISHED, ARCHIVED; “Todos” omite status. Favoritos e busca não fazem parte do contrato. |
| FE-M02-C04 | Navegação Next.js existente | Navega para início, coleção e `/templates` | Não cria rotas fictícias. `/perfil` permanece indisponível; cards aguardam a rota do proprietário antes de se tornarem links. |

## HTTP de origem

- `GET /api/v1/murals?limit=...&status=...&cursor=...` → `200 { items, nextCursor }`; `401` sem principal, erro de rede/servidor recuperável.
- `GET /api/v1/murals/{id}/photos` → `200 { muralVersion, items }`; `401`, `404` ou erro recuperável não devem virar zero fotos silenciosamente.
- Previews têm URLs MinIO temporárias e respostas `private, no-store`; tokens/URLs assinadas não entram em logs ou analytics.

## Compatibilidade

`MuralSummary.coverPhotoId` é nullable no OpenAPI. O frontend atualmente o declara opcional; o consumidor aceita `undefined` e `null`. O card não pressupõe que uma Composition represente o Mural.
