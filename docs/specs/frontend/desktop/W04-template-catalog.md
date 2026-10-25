# FE-W04 — Catálogo desktop de templates

**Status:** draft SDD; requer revisão.
**Requirement IDs:** FE-W04-R01–R05 · **Acceptance IDs:** FE-W04-AC01–AC06.
**Route/access:** /templates · público.

## Objective

Ajudar a escolher uma composição a partir de templates versionados, exibindo claramente quantidade de fotos e proporção antes de iniciar o editor.

## Visual reference

Arquivo public/telas/Memora templates and publish flow-4.png, painel superior completo. Header ink, título “qual é o mood?”, filtros em chips e grade de capas são interface. Moldura e botões do macOS na borda não fazem parte do produto.

## Layout and components

- Header da marca alinhado à navegação global.
- Cabeçalho de seção com eyebrow pequeno, título grande em Space Grotesk e texto de apoio em DM Sans.
- Filtros discretos alinhados à direita no desktop; chips apresentam seleção visível e nomes legíveis.
- Grade de quatro colunas em 1440 px com cards horizontais ricos em fotografia, nome do template em alto contraste, ação de abrir e metadata curta.
- Os cards são derivados do registry real e das versões de template; thumbnails vêm de previews/render do template ou de ativos locais adequados. Não usar screenshots de telas contendo UI como fotografia.
- Filtros comportamentais MVP: quantidade de fotos e proporção, conforme FRONTEND_SPEC. Labels temáticas da referência podem ser exibidas somente quando houver metadado correspondente no registry; não inventar filtro que retorna resultado falso.
- Botão utiliza template inicia rascunho/editor usando ID e versão reais.

## Interactions, states and navigation

- Seleção de chips atualiza resultados sem enviar requisição inexistente.
- Abrir prévia mostra slots/contagem/proporção e permite voltar ao catálogo ou usar o template.
- Catálogo vazio, erro ao abrir prévia e seleção indisponível têm mensagens e saída acessível. Não afirmar que um template pode ser usado sem atender quantidade/formato exigidos.
- Templates são dados declarativos versionados, sem regra de negócio embutida em componente visual.

## Responsive and accessibility

- 1440 px usa quatro colunas; 1024 px usa três; 768 px usa duas; 414 px ou menos usa uma coluna ou duas miniaturas somente se preservarem leitura, seguindo M03.
- Chips quebram em linhas sem overflow e sem rolagem involuntária.
- Cada card tem nome e detalhes acessíveis; seleção não depende só da cor; foco visível, contraste WCAG AA e alvos >=44×44 CSS px.

## Acceptance

- **FE-W04-AC01:** a página corresponde à hierarquia do painel superior, sem reproduzir moldura externa da captura.
- **FE-W04-AC02:** cada card e sua ação usam templateId/templateVersion reais; nomes e contagens coincidem com o registry.
- **FE-W04-AC03:** filtros por quantidade/proporção modificam resultados de forma correta e acessível.
- **FE-W04-AC04:** prévia e “usar template” preservam seleção/versão e navegam ao editor definido.
- **FE-W04-AC05:** as imagens usadas são assets de brand ou previews reais dos templates; screenshots de UI não são usados como cards finais.
- **FE-W04-AC06:** layout responsivo e tipografia Space Grotesk/DM Sans são verificados de 320 a 1440 px sem serifadas.
