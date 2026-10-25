# FE-W07 — Gerenciamento de contribuições desktop

**Status:** draft SDD; implementação funcional depende do contrato MEM-009 e da API de moderação aprovados.
**Requirement IDs:** FE-W07-R01–R06 · **Acceptance IDs:** FE-W07-AC01–AC07.
**Route/access:** /murais/[muralId]/contribuicoes · proprietário autorizado.

## Objective

Permitir revisar contribuições PENDING do mural e aprovar ou rejeitar cada envio, mantendo o conteúdo pendente fora da galeria publicada até uma decisão autorizada.

## Visual reference

Arquivo public/telas/image4.png, painel inferior: mosaico/capa e acesso ao gerenciamento de links à esquerda; painel de “fotos pra aprovar” à direita, com itens, autor/data quando disponíveis e botões inequívocos. O CTA “criar mural”, browser chrome e avatar da moldura são elementos ilustrativos da captura.

## Layout and components

- Header Memora em ink e navegação do proprietário.
- Desktop divide a página em duas regiões: composição/capa e navegação ao gerenciamento de links em `/murais/[muralId]/compartilhar` à esquerda; fila de revisão em painel paper à direita. A tela não mostra nem reconstrói uma URL de compartilhamento persistente.
- Cada item mostra somente imagem e metadata retornadas pelo endpoint real, estado PENDING e ações Aprovar/Recusar. Badge de pendências é calculado da resposta paginada real.
- Controles de aprovação/rejeição usam confirmação/feedback e refletem transição validada pelo backend. O frontend não publica foto diretamente nem altera o feed por estado local otimista sem resposta confirmada.
- Se a API MEM-009 não estiver aprovada/disponível, a tela apresenta indisponibilidade/coming-soon sem itens ou contagens fictícias e não envia mutações.
- Componentes: ContributionQueue, ContributionItem, ReviewStatus, ApproveRejectActions, ConfirmDialog, EmptyState, LoadingState e ErrorState.
- Space Grotesk em headings e DM Sans em UI. Paleta v2. Nenhuma serifada.

## Interactions, states and navigation

- Carregar apenas contribuições do mural próprio e com status PENDING; APPROVED/REJECTED não podem aparecer como pendentes.
- Aprovar/rejeitar envia a mutação prevista no contrato MEM-009 e aguarda confirmação. Falha mantém o item e explica que a decisão não foi confirmada.
- “Gerenciar links” abre o fluxo de compartilhamento; esta tela não armazena `shareUrl`, não a recupera em replay/listagem e não apresenta QR Code.
- Atualização concorrente faz reload da fila e informa a pessoa; retry não cria decisão duplicada.
- Fila vazia informa que não existem fotos aguardando revisão. Carregamento, erro e contrato não disponível têm apresentação distinta.
- Voltar ao mural/configuração usa rota autorizada; navegar ao mural público só após status permitido.

## Responsive and accessibility

- 1440 px mostra fila e região do mural lado a lado; 1024 px reduz painel de prévia; 768 px empilha regiões.
- Mobile usa M12: fila em cards com ações agrupadas, alvos grandes e sem colunas comprimidas.
- Ações são botões nomeados, distinguem aprovar de recusar por texto/ícone e não só cor, foco visível, confirmação acessível, status anunciado e contraste WCAG AA.

## Acceptance

- **FE-W07-AC01:** composição em duas regiões, fila e controles correspondem ao painel inferior da referência nas larguras desktop.
- **FE-W07-AC02:** lista e contador derivam somente de resposta real MEM-009; nenhum dado fictício aparece em produção.
- **FE-W07-AC03:** contribuições PENDING não aparecem na galeria publicada antes da confirmação de aprovação pelo backend.
- **FE-W07-AC04:** aprovar/rejeitar usa contrato/autorização real, apresenta loading/sucesso/erro e não assume sucesso antes da resposta.
- **FE-W07-AC05:** se MEM-009 estiver pendente, nenhuma ação falsa é habilitada e a tela explica a disponibilidade sem simular fila.
- **FE-W07-AC06:** layout responsivo preserva itens e botões em 1440, 1024, 768, 414, 390, 375 e 320 px.
- **FE-W07-AC07:** teclado, leitor de tela, contraste, foco e alvos de toque são validados e ações não dependem só de cor.
