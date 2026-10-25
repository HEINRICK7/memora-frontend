# FE-M05/M06 — Origem e seleção de fotografias

**Status:** aprovado para implementação pelo juiz do fluxo, 25/10/2026; sem mudança de API.
**IDs visuais:** M05 `novo mural / escolha da origem`; M06 `escolhe os melhores cliques`.
**Rota:** `/criar`, com estado local entre M05 e M06.
**Referência:** `public/telas/Memora mobile mural creation flow-3.png`, primeiro e segundo telefones.
**Crosswalk:** o brief escrito chama importação de M07 e seleção de M08; o catálogo do frontend adota os números das boards para os IDs visuais.

## Problema e usuário

Quem começa um mural precisa escolher de onde virão as fotografias, selecionar imagens compatíveis e revisar a seleção sem que o navegador envie arquivos antes da confirmação explícita.

## Invariantes

- **FE-PS-R01:** o início reproduz o fluxo visual M05: cabeçalho com voltar/marca/cancelar, pergunta de origem, opções Galeria, Google Fotos e Câmera, CTA continuar e nota de que a seleção ocorre na próxima etapa.
- **FE-PS-R02:** Galeria usa o seletor nativo do dispositivo por `input[type=file]` após ação explícita; a aplicação não lê toda a fototeca.
- **FE-PS-R03:** Google Fotos é apresentado como indisponível nesta versão. Não inicia OAuth, não simula conexão nem coleta credenciais.
- **FE-PS-R04:** Câmera só chama `getUserMedia` após a pessoa selecionar a opção e ativar Continuar. Se contexto seguro, permissão ou hardware impedirem o uso, a interface explica a falha e permite voltar à Galeria.
- **FE-PS-R05:** stream da câmera é parado ao capturar, cancelar, trocar de fonte ou desmontar o fluxo.
- **FE-PS-R06:** M06 mostra somente arquivos que a pessoa escolheu ou capturou, com prévias locais, contagem, remoção, opção de acrescentar fotos e uma faixa resumida das fotografias selecionadas no tray inferior. Não apresenta imagens de marca como fotos escolhidas.
- **FE-PS-R07:** seleção e object URLs ficam em memória no fluxo; arquivos permanecem locais até a ação explícita “usar essas fotos”. Remoção e saída do fluxo revogam URLs locais.
- **FE-PS-R08:** ao confirmar, fotos JPEG/PNG válidas são persistidas pela porta/adaptador `PhotoGateway` existente. O upload usa intent, PUT assinado e complete; erro não exibe URL assinada e mantém os itens ainda não salvos para retry.
- **FE-PS-R09:** ao concluir o salvamento, navega para `/templates`. As fotos salvas passam a integrar a biblioteca privada existente; não são publicadas nem compartilhadas por esse fluxo.
- **FE-PS-R10:** validação de arquivos reutiliza `validatePhotoFile`: JPEG/PNG, não vazio e até 20 MiB por foto. Formatos não suportados recebem uma mensagem útil sem afirmar compatibilidade.
- **FE-PS-R11:** M05/M06 respeitam tokens v2, Space Grotesk e DM Sans, sem serifas, com foco visível, alvos de toque, safe area e sem overflow de 320 a 1440 CSS px.

## Estados observáveis

`SOURCE_PICKER` → `CAMERA_REQUESTING` → `CAMERA_READY` → `PHOTO_SELECTION` → `SAVING` → `SAVED`; falhas recuperáveis retornam à tela adequada sem descartar seleções válidas.

## Privacidade

O browser recebe os arquivos apenas pelo gesto explícito da pessoa. Object URLs e a seleção não persistem após sair da página. O servidor recebe os bytes somente após “usar essas fotos”; o fluxo salva na biblioteca privada existente e não concede grant nem publica mural.

## Dependências

- `validatePhotoFile` e `MAX_PHOTO_SIZE_BYTES` em `src/domain/photos/validate-photo.ts`.
- `savePhoto` em `src/application/save-photo.ts` e `PhotoGateway` em `src/application/photo-gateway.ts`.
- Adapter real `photoApiGateway`, com `/uploads`, PUT na URL assinada e `/uploads/{uploadId}/complete`.
- Assets ilustrativos sintéticos de `public/brand/v2/photos/**`; nunca usá-los como itens da seleção da pessoa.

## Fora de escopo

Integração Google Photos; seleção de todo o álbum pelo site; guardar rascunho de seleção após reload; novos endpoints de backend; login/OAuth; publicação, mural, template ou composição durante a seleção.

## Decisões abertas

Compatibilidade real de câmera e seletor precisa ser verificada em Safari iOS e Chrome Android antes de afirmar suporte em aparelhos. Limites de resolução e memória de câmeras físicas permanecem sem medição.

## Revisão visual M06

A faixa de miniaturas no tray inferior espelha a board oficial sem abrir a fototeca inteira. O seletor nativo entrega apenas os arquivos que a pessoa selecionou; a grade contém esses arquivos, e a faixa reapresenta somente essa mesma seleção para revisão antes de confirmar o envio.
