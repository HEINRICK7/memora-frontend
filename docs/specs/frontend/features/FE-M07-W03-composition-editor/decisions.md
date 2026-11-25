# FE-M07/W03 — Decisões

## FE-ED-ADR01 — Canvas responde ao CompositionDocument v1

O domínio atual permite preencher, substituir e remover slots e exportar. Não permite transformações interativas, texto, stickers, filtros ou histórico de comandos; a UI apresenta esses recursos como indisponíveis em vez de simular interação.

## FE-ED-ADR02 — Apresentação muda por viewport

M07 mobile prioriza canvas e toolbar inferior. W03 desktop usa biblioteca, canvas amplo e painel à direita. Ambos chamam os mesmos casos de uso MEM-005/MEM-007.

## FE-ED-ADR03 — Concluir é exportar a composição

O CTA primário executa exportação local. Um fluxo posterior de publicação deve operar sobre Mural persistente por MEM-008, sem converter nem publicar automaticamente o CompositionDocument.

## FE-ED-ADR04 — Ferramentas sem suporte ficam desabilitadas

Botões de texto, stickers, filtro, transforms e undo/redo seguem visíveis apenas para indicar o limite do editor v1 e têm explicação acessível; não criam estado nem anunciam sucesso.
