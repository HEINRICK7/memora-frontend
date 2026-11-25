# FE-M04/W06 — Decisões

## FE-SM-ADR01 — Uma rota compartilhada, três apresentações visuais

M04, M10 e W06 representam o mesmo mural e a mesma autorização em layouts responsivos da rota `/m/[shareToken]`. A coleção não é duplicada e não recebe mock de fotos. Mobile inicia com mosaico editorial; após 40 CSS px de rolagem, um cabeçalho compacto mantém marca/título e a galeria ocupa a tela. Desktop usa mosaico denso. Mural continua diferente de Composition.

## FE-SM-ADR02 — Usar somente os dados autorizados

O payload de shared GET não fornece autor nem rótulo de visibilidade global. O frontend mostra apenas título, descrição, número de fotos autorizadas e previews retornadas. Decoração de layout pode ser local; conteúdo fotográfico de demonstração da marca não entra em mural real.

## FE-SM-ADR03 — Contribuição condicionada à capacidade real

O CTA de referência só aparece quando `canContribute` é true. Com `VIEW`, ele fica ausente. O comportamento e aceite de upload dependem de MEM-009, que tem contratos próprios e não pode ser inferido apenas pelo mockup.

## FE-SM-ADR04 — Não declarar privacidade HTML pela metadata

`robots` e `referrer` em Next Metadata não provam os headers HTTP do documento. O aceite exige resposta real do HTML com cache, robots e referrer verificados separadamente da API e do MinIO.
