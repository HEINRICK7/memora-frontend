# FE-M09/W02 — Contratos e rastreabilidade

| IDs FE | Contrato de origem | Regra |
|---|---|---|
| FE-CQR-R01 / AC01 | `MEM-009-BE-API-01`; `MuralAccessGateway.createViewGrant` | `POST /api/v1/murals/{muralId}/grants` recebe `VIEW` ou `CONTRIBUTE`; nenhum endpoint novo. |
| FE-CQR-R02–R04 / AC02–04, AC10 | MEM-008 grant idempotency/security; resposta de `createViewGrant` | Segredo só na primeira resposta; QR usa exatamente `shareUrl`; download é ação explícita e estado volátil. |
| FE-CQR-R05 / AC05 | `MEM-009-BE-API-04`; `SharedMural.permissions.canContribute` | `VIEW` é somente leitura; a permissão do servidor controla a apresentação dos controles de envio. |
| FE-CQR-R06 / AC06–07 | HTML File Input; `MEM-001` JPEG/PNG | Galeria permite múltiplos arquivos; captura nativa seleciona no máximo uma imagem. |
| FE-CQR-R07 / AC08 | `MEM-009-BE-API-02` a `API-04`; `submitContribution` | Upload usa URL presigned e finalização; sucesso retorna `READY` no álbum privado do convidado, sem aparecer na leitura pública. |
| FE-CQR-R08 / AC09, AC28–29 | `MEM-009-BE-API-05`; `publishGuestPhotos` | Só a seleção do convidado publica fotos; o endpoint do anfitrião não lista nem presigna fotos privadas. |
| FE-CQR-R09 / AC11–12 | `MEM-009-BE-API-02`, `MEM-009-BE-R09`; `submitContribution` | `displayName` é nullable, limitado a 40 caracteres e não aparece na resposta shared. |
| FE-CQR-R10 / AC13 | `MEM-009-BE-API-04`; `SharedMural` | O Modo Niver não cria modelo/rota de mural alternativo; usa leitura autorizada já existente. |
| FE-CQR-R11 / AC14 | Estado local da página e respostas de `submitContribution` | O avanço por arquivo é volátil e os estados finais distinguem foto salva no álbum pessoal e falha. |
| FE-CQR-R17 / AC22 | `AdminGate`; MEM-010 | Toda entrada de criação leva ao fluxo autenticado de aniversário. A rota pública antiga não cria murais. |
| FE-CQR-R18 / AC23 | `/m/{shareToken}`; `MEM-009-BE-API-02` a `API-05` | QR resolve o mural pelo grant; a abertura apresenta **Começar**, o token pessoal isola o álbum e o endpoint de publicação vincula apenas a seleção do convidado. |
| FE-CQR-R19 / AC24 | Página pública `/` e `/m/{shareToken}` | A página inicial orienta a leitura do QR sem oferecer criação de aniversário ou seleção de fotos avulsa; a página do mural compartilhado não oferece criação de aniversário. Sem alteração de API. |
| FE-CQR-R20–R21 / AC25–27 | `qrcode` local; preferências em `localStorage`; MEM-009-BE-API-06 para o logo; exportação do navegador | O QR mantém o `shareUrl` como único conteúdo. Preferências visuais ficam no aparelho, e o logo salvo vai para MinIO para aparecer também no link dos convidados; nenhum deles armazena o bearer link. PNG, SVG e cartão A4 são gerados no aparelho. |

O QR Code é uma representação local da URL retornada. Ele não muda autorização nem escopo. Design e exportação são locais; o logo vai para o MinIO privado e a API compartilha uma URL assinada temporária somente com o mural autorizado.

## FE-CQR-R12–R14 — Entrada única e criação do convite

As rotas existentes `/criar` e `/templates` conduzem à criação de uma festa Memora. A festa continua sendo um `Mural`; a ação do anfitrião usa `POST /api/v1/murals/{muralId}/grants` com `scope: "CONTRIBUTE"`. O mural precisa estar publicado; aniversário pode ser publicado sem fotos para que o QR já fique disponível e os convidados iniciem a galeria.

## FE-CQR-R15–R16 — Publicação e QR em sequência

A seleção da primeira foto usa `PhotoGateway.createUploadIntent`, `uploadFile` e `completeUpload`, seguida de `MuralAccessGateway.attachPhoto`. Depois do consentimento explícito em “Publicar e gerar QR”, o frontend publica pela operação MEM-002 e navega para o compartilhamento com um sinal transitório para criar um grant `CONTRIBUTE`. O token/QR continua restrito à primeira resposta confirmada de MEM-008; nenhuma URL ou segredo é transportado pela navegação.
