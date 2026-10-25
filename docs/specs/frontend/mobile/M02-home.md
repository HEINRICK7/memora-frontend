# M02 — Seus Murais

**Status:** visual mobile validado com fixture; interação de abrir card aguarda rota do proprietário. **ID visual:** M02.
**Referência:** public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png, segundo telefone, rótulo 02 SEUS MURAIS.
**Rota:** /meus-murais.

## Objetivo

Retomar murais persistidos do proprietário, navegar por seus status e iniciar outro mural. Não é um feed público de terceiros.

## Composição visual

- Superfície paper clara, wordmark ink e cabeçalho compacto.
- Heading editorial de grande peso “seus momentos, todos aqui.” com destaque cobalt em “todos aqui”.
- Chips horizontais para Todos, Rascunhos, Publicados e Arquivados. A board mostra “favoritos”, mas não há contrato de favoritos; não apresentar esse filtro até existir comportamento persistido.
- Grade com duas colunas de capas fotográficas altas, cantos arredondados, título, status textual e contagem calculada das fotos retornadas pela API.
- Navegação inferior com início, murais, criar, modelos e perfil; a rota de perfil permanece desabilitada até sua tela/contrato existir. O botão central coral navega para o fluxo existente de modelos/criação.
- Capas do usuário vêm do preview privado retornado pelo endpoint de fotos e correspondem a `coverPhotoId`. Fotos de demonstração em `public/brand/v2/photos/murals/` não podem parecer capas persistidas de usuários.

## Componentes e comportamento

- AppHeaderMobile, MuralFilter, MuralGrid, MuralCard e MobileBottomNavigation.
- GET /api/v1/murals fornece somente dados próprios, paginação e filtro por status; filtros refletem status existentes. Ação de criar segue M05 quando implementada.
- Itens persistidos exibem DRAFT, PUBLISHED ou ARCHIVED conforme o servidor. GET /api/v1/murals/{id}/photos fornece fotos READY; a contagem vem do número de fotos retornadas e a capa seleciona `coverPhotoId`.
- URL assinada de preview é usada apenas para carregar a imagem em memória/DOM; não registrar em logs, analytics, estado persistido ou links externos. Em falha/ausência de capa, exibir placeholder neutro sem atribuir imagem demonstrativa ao usuário.
- Loading, lista vazia (M14), erro recuperável e lista carregada são estados distintos. A busca só aparece como operante quando a consulta está implementada.

## Responsividade e acessibilidade

- Grade 2 colunas em celular estreito; reduzir para 1 coluna se o alvo ficar abaixo de 44 px. Fotos usam object-fit cover e proporção consistente.
- Chips têm nome, estado selecionado programático e rolagem sem prender o foco. Cards serão links/botões com nome que inclui título/status quando a rota de detalhe do proprietário existir; até lá permanecem artigos sem `href`.
- Layout não apresenta números sociais fictícios nem cards genéricos de métricas.

## Aceite

- **FE-M02-AC01:** a lista renderiza apenas murais retornados para o proprietário e distingue status sem depender somente da cor.
- **FE-M02-AC02:** loading, erro, acesso 401 e vazio não se confundem; vazio encaminha ao fluxo de criação disponível.
- **FE-M02-AC03:** filtro selecionado é anunciado, cards não cortam título/status e a grade não causa overflow nos breakpoints mobile.
- **FE-M02-AC04:** cada contagem deriva de `GET /murals/{id}/photos`; a capa, quando configurada, corresponde ao `coverPhotoId`. Ausência/falha não inventa foto ou contagem.
- **FE-M02-AC05:** navegação inferior respeita safe-area e só oferece links funcionais; perfil indisponível não é clicável.
- **FE-M02-AC06:** cards passam a abrir a rota do proprietário quando implementada. Requisito de navegação pendente; não criar link morto.

## Dúvidas / limites

O mockup apresenta contagens, busca, avatar e favoritos de exemplo; M02 não inventa esses dados nem simula busca, avatar ou favoritos sem contrato. Ver `../features/FE-M02-my-murals/` para spec, aceite, contrato e decisões rastreáveis.
