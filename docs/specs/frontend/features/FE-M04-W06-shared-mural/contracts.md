# FE-M04/W06 — Contratos e rastreabilidade

**Estado:** documento frontend; não aprova nem altera OpenAPI backend. Nenhuma rota adicional é introduzida aqui.

| IDs FE | Contrato de origem | Regra |
|---|---|---|
| FE-SM-R01–R02, FE-SM-AC01/04 | `MEM-008-FE-API-06` (`GET /api/v1/shared/{shareToken}`) | `title`, `description`, `coverPhotoId`, `photos[]` ordenadas e previews autorizadas; sem UUID do mural, owner ou `Composition`. |
| FE-SM-R06, FE-SM-AC02/03 | `MEM-008-FE-AC11` para VIEW; MEM-009-BE-API-04/05 para `canContribute` | VIEW é read-only. Fotos de contribuição ficam no álbum pessoal até o mesmo convidado escolher publicar; não há aprovação do anfitrião. |
| FE-SM-R07, FE-SM-AC06 | `MEM-008-FE-R17` / `MEM-008-FE-AC18` | Lightbox é presentation-only; navegação não adiciona endpoint. |
| FE-SM-R08, FE-SM-AC07 | `MEM-008-FE-API-06`, `MEM-008-FE-SEC-01`, `MEM-008-FE-AC09/12` | Renovar shared GET; URL assinada só em estado volátil; não usar original como fallback. |
| FE-SM-R09, FE-SM-AC08 | `MEM-008-FE-AC10` | Mapear códigos seguros; falha temporária não revela payload parcial. |
| FE-SM-R10, FE-SM-AC05/09 | `MEM-008-FE-R19`, `MEM-008-FE-AC21` e `FE-W06-AC08` | Regras de responsividade, acessibilidade e identidade são FE-only. |
| FE-SM-AC10 | `MEM-008-FE-SEC-01`, `MEM-008-FE-AC12` | Headers do documento HTML são separados dos headers do shared JSON e do GET MinIO. |

O payload esperado de leitura é o definido pelo contrato MEM-008. O DTO local `SharedMural` espelha esse payload. Os endpoints do álbum pessoal e de publicação seletiva pertencem a MEM-009; fotos não selecionadas permanecem privadas e fora do mural público.
