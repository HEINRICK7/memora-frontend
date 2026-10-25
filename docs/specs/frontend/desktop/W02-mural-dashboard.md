# FE-W02 — Meus murais desktop

**Status:** draft SDD; requer revisão.
**Requirement IDs:** FE-W02-R01–R06 · **Acceptance IDs:** FE-W02-AC01–AC07.
**Route/access:** /meus-murais · proprietário conforme mecanismo de identidade disponível.

## Objective

Permitir retomar, pesquisar e filtrar os murais reais do proprietário, deixando claros título, estado e acesso às ações de cada mural.

## Visual reference

Arquivo public/telas/Memora Gen Z Desktop Mural Showcase-2.png, painel inferior: header ink, título editorial, filtros, pesquisa, ação para novo mural e quatro cards fotográficos. A moldura do browser é apenas parte da captura.

## Layout and components

- Header compartilhado com wordmark, navegação, botão “criar mural” e perfil.
- Área paper com título amplo “seus momentos, todos aqui.”; novo mural e pesquisa alinhados à direita quando houver largura.
- Faixa horizontal de chips de filtro. A visualização usa estados existentes do mural (Todos, Rascunhos, Publicados, Arquivados); categorias como viagens, shows ou favoritos só aparecem quando os dados de domínio/API oferecem esses campos.
- Grade de capas fotográficas com largura visual equilibrada, recortes independentes, título e estado sobrepostos em área legível, além de contagem real quando disponível.
- Componentes: MuralFilter, SearchField, MuralCard, MuralGrid, EmptyState, LoadingState e ErrorState.
- Space Grotesk em títulos; DM Sans em navegação, metadata, chips e formulário. Nenhuma fonte serifada. Tokens v2 somente.

## Interactions, states and navigation

- Filtros e pesquisa operam sobre a coleção autorizada retornada por MEM-002; contagens são calculadas dos dados recebidos, nunca fixadas no mockup.
- A pesquisa local só filtra o conjunto carregado; não se apresenta como busca global se o backend não fornecer esse contrato.
- Abrir um card segue para configuração/detalhe permitido do próprio mural; o CTA de novo mural abre o fluxo definido pelo FRONTEND_SPEC.
- Loading preserva a grade sem salto; erro oferece tentar novamente; vazio explica que ainda não há murais e apresenta ação de criar.
- Fotografias de public/brand/v2 são sintéticas. Não aparecem como murais salvos. Dados de demonstração só podem ser usados em preview/teste com identificação explícita.

## Responsive and accessibility

- Desktop a 1440 px: grade fotográfica de quatro colunas, chips e pesquisa sem colisão. Em 1024 px: três colunas; em 768 px: duas; mobile usa M02/M14.
- Em 320–414 px os chips podem quebrar em linhas; não devem exigir rolagem horizontal nem esconder o estado ativo.
- Cards são links com nome acessível que inclui título e estado; controles internos têm nome próprio e não aninham botões dentro do link. Foco visível, contraste AA e alvos de toque >=44×44 CSS px.

## Acceptance

- **FE-W02-AC01:** a hierarquia, o header, a área de busca/filtros e a grade fotográfica se aproximam do painel inferior da referência nas larguras desktop.
- **FE-W02-AC02:** cada card representa um mural retornado para a pessoa autenticada; contagem e estado vêm do dado real ou são omitidos.
- **FE-W02-AC03:** filtros disponíveis correspondem aos campos suportados; não há categorias/favoritos fictícios.
- **FE-W02-AC04:** busca, filtros, abertura do card e criação funcionam com teclado e ponteiro, com destino existente.
- **FE-W02-AC05:** vazio, carregamento e erro têm estados próprios e não fingem conteúdo remoto.
- **FE-W02-AC06:** ativos sintéticos não são apresentados como murais de usuários.
- **FE-W02-AC07:** colunas e texto se adaptam a 1440, 1024, 768, 414, 390, 375 e 320 px sem overflow.
