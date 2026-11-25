# MEM-009 — Frontend da contribuição

Espelha o contrato backend MEM-009. Ao abrir o QR `CONTRIBUTE`, o convidado vê a abertura da festa com o botão **Começar**. Depois disso, cada navegador tem seu próprio álbum privado no MinIO; o convidado pode enviar por câmera ou galeria e escolhe quais fotos compartilhar no álbum universal. Upload completo não publica sozinho. O anfitrião não aprova fotos nem vê o conteúdo privado dos álbuns. Falha de um arquivo não apaga os que já foram enviados com sucesso. O link de colaboração é criado à parte do link de visualização e o segredo continua aparecendo uma única vez.

| ID | Regra |
|---|---|
| MEM-009-FE-R01 | CTA de envio ausente no grant `VIEW`. |
| MEM-009-FE-R02 | O QR mostra uma tela de boas-vindas da festa com CTA Começar antes de mostrar o fluxo de envio. |
| MEM-009-FE-R03 | Foto enviada com sucesso aparece apenas no álbum privado daquele navegador até seleção e compartilhamento pelo convidado. |
| MEM-009-FE-R04 | Botão de link `CONTRIBUTE` distinto do link `VIEW`. |
| MEM-009-FE-R05 | QR Code do Modo Niver usa localmente a `shareUrl` da primeira resposta e não recupera segredo de replay/listagem. |
| MEM-009-FE-R06 | Convidado com `canContribute` pode informar nome opcional e escolher múltiplos arquivos na galeria ou uma foto pela câmera nativa; ele seleciona quais fotos publicar no álbum universal. |
| MEM-009-FE-R07 | QR de aniversário abre diretamente a festa associada ao grant; depois de Começar, câmera e galeria ficam disponíveis sem conta. |
| MEM-009-FE-R08 | Criação de aniversário e geração do QR são exclusivas do administrador autenticado; rota `/criar-mural` não oferece criação pública. |

O detalhe funcional frontend do QR e da câmera está em `docs/specs/frontend/features/FE-M09-W02-contribution-qr/`. Essa extensão não muda o contrato backend nem introduz endpoints.
