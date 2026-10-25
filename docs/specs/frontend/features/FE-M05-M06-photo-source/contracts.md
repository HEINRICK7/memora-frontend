# FE-M05/M06 — Contratos

## IDs rastreáveis

| ID | Fronteira | Contrato |
|---|---|---|
| FE-PS-C01 | DOM → apresentação | seleção de Galeria abre `input[type=file][multiple]` somente após ação explícita; aceita tipos compatíveis com `validatePhotoFile`. |
| FE-PS-C02 | apresentação → domínio | cada `File` é validado por `validatePhotoFile`; resultados inválidos não apagam válidos do mesmo lote. |
| FE-PS-C03 | apresentação → navegador | câmera é solicitada por `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })` após gesto; a tela encerra todos os tracks ao sair. |
| FE-PS-C04 | apresentação → application | nenhum método do `PhotoGateway` é chamado durante a escolha/prévia/remover. |
| FE-PS-C05 | application → infrastructure | a ação “usar essas fotos” chama `savePhoto(file, photoGateway)` para cada arquivo válido; falha fica encapsulada sem URL assinada. |
| FE-PS-C06 | infrastructure → backend/storage | reutiliza o contrato existente `POST /api/v1/uploads`, `PUT` ao `uploadUrl` retornado com `requiredHeaders`, e `POST /api/v1/uploads/{uploadId}/complete`; nenhuma rota ou payload novo. |
| FE-PS-C07 | browser history → apresentação | navegação bem-sucedida segue para `/templates`; saída antes de salvar libera estado local e previews. |
| FE-PS-C08 | apresentação → tray de seleção | miniaturas do tray são derivadas da mesma lista local usada pela grade; o tray não consulta a fototeca nem cria cópias persistentes. |

## Tipos de arquivo atuais

`image/jpeg` e `image/png`, com tamanho maior que zero e no máximo `20 * 1024 * 1024` bytes por arquivo, de acordo com `validatePhotoFile`. Não ampliar contrato por causa de `accept="image/*"` no mockup.

## Dados sensíveis

Nome de arquivo é mostrado somente no contexto local da seleção. A interface nunca renderiza `uploadUrl`, `previewUrl` de retorno como copy, corpo do erro de fetch, token OAuth ou credencial.

## Sincronização de limite

O backend permite configurar `MEMORA_UPLOAD_MAX_BYTES`; o Compose atual usa `20971520` bytes. Esse valor deve permanecer alinhado ao limite fixo validado pelo frontend. Uma mudança de limite exige atualizar o contrato e a validação antes de ativá-la em ambiente.
