# FE-M05/M06 — Decisões

## FE-PS-ADR01 — Numeração pelas boards visuais

A tela M05 da board é “novo mural / escolha da origem” e M06 é “selecione as fotos”. O brief textual usa outros IDs para importação/seleção. Os IDs e evidências visuais deste fluxo seguem as legendas das boards, conforme crosswalk de `docs/specs/frontend/README.md`.

## FE-PS-ADR02 — Seleção local até confirmação

Escolher fotos cria apenas prévias temporárias. O upload existente começa somente quando a pessoa escolhe “usar essas fotos”; depois de persistidas na biblioteca privada, o fluxo abre o catálogo. Isso evita usar uma seleção casual como autorização de armazenamento.

## FE-PS-ADR03 — Provider não implementado não aparece funcional

Google Fotos permanece desabilitado e explicado. Câmera usa `getUserMedia` sob gesto explícito e tem alternativa de Galeria; não há mocks que finjam permissão ou captura.

## FE-PS-ADR04 — Estado em memória

Fotos e object URLs vivem somente enquanto `/criar` está aberto. Reload ou saída do fluxo recomeça em M05; nenhuma persistência adicional entra nessa fatia.

## FE-PS-ADR05 — Tray resume a seleção local

O tray M06 mostra miniaturas dos mesmos `File`s da grade para se aproximar da board oficial. O navegador só fornece os arquivos escolhidos pelo seletor; não haverá varredura de fototeca nem fotos sintéticas no estado de seleção.
