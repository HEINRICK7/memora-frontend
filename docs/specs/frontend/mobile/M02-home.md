# M02 — Seus Murais

**Status:** draft SDD. **ID visual:** M02.
**Referência:** public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png, segundo telefone, rótulo 02 SEUS MURAIS.
**Rota:** /meus-murais.

## Objetivo

Retomar murais persistidos do proprietário, navegar por seus status e iniciar outro mural. Não é um feed público de terceiros.

## Composição visual

- Superfície paper clara, wordmark ink, busca/avatar compactos no cabeçalho.
- Heading editorial de grande peso “seus momentos, todos aqui.” com destaque cobalt em “todos aqui”.
- Chips horizontais de status/filtro. Grade com duas colunas de capas fotográficas altas, cantos arredondados, título e contagem real retornada pela API.
- Navegação inferior com início, murais, criar, modelos e perfil; botão central coral apenas quando a ação correspondente estiver ativa.
- Usar fotos diferentes de public/brand/v2/photos/murals/ na mesma grade; nunca inventar contagens.

## Componentes e comportamento

- AppHeaderMobile, MuralFilter, MuralGrid, MuralCard e MobileBottomNavigation.
- GET /api/v1/murals fornece somente dados próprios e paginação; filtros refletem status existentes. Ação de criar segue M05.
- Itens persistidos exibem DRAFT, PUBLISHED ou ARCHIVED conforme o servidor. A capa e contagem vêm dos dados do mural, não de Composition.
- Loading, lista vazia (M14), erro recuperável e lista carregada são estados distintos. A busca só aparece como operante quando a consulta está implementada.

## Responsividade e acessibilidade

- Grade 2 colunas em celular estreito; reduzir para 1 coluna se o alvo ficar abaixo de 44 px. Fotos usam object-fit cover e proporção consistente.
- Chips têm nome, estado selecionado programático e rolagem sem prender o foco. Cards são links/botões com nome que inclui título/status.
- Layout não apresenta números sociais fictícios nem cards genéricos de métricas.

## Aceite

- **FE-M02-AC01:** a lista renderiza apenas murais retornados para o proprietário e distingue status sem depender somente da cor.
- **FE-M02-AC02:** loading, erro e vazio não se confundem; vazio encaminha à criação M05/M14.
- **FE-M02-AC03:** filtro selecionado é anunciado, cards não cortam título/status e a grade não causa overflow nos breakpoints mobile.

## Dúvidas / limites

O mockup apresenta contagens de exemplo e avatar; a UI real só mostra valores vindos de contrato.
