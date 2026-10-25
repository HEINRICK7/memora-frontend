# FE-W04 — Catálogo desktop de templates

**Status:** SDD revisado; implementação rastreada em `FE-M03`.
**Requirement IDs:** FE-M03-R01–R07 · **Acceptance IDs:** FE-M03-AC01–AC06.
**Route/access:** /templates · público.

## Objetivo

Permitir escolher uma composição versionada, comparar quantidade de fotos e proporção, e iniciar um rascunho local.

## Visual reference

Arquivo public/telas/Memora templates and publish flow-4.png, painel superior completo. Header ink, título “qual é o mood?”, filtros em chips e grade de capas são interface. Moldura e botões do macOS na borda não fazem parte do produto.

## Layout and components

- Header da marca alinhado à navegação global.
- Cabeçalho de seção com eyebrow pequeno, título “qual é o mood?” em Space Grotesk e destaque cobalt para manter contraste AA sobre paper; texto de apoio em DM Sans.
- Filtros de quantidade de fotos e proporção alinhados ao cabeçalho, com seleção textual e visual.
- Grade de quatro colunas em 1440 px, três em 1024 px e duas em 768 px. Cards horizontais usam fotografias locais de `public/brand/v2/` encaixadas nos slots declarados, nome real e metadados do registry.
- Os previews são exemplos estáticos de marca, sem screenshots de UI ou conteúdo de usuário.
- Chips temáticos, nomes publicitários do mockup e selo “novo” não aparecem como dados reais: não existem tags ou metadados equivalentes no registry.
- Selecionar e usar template cria rascunho local vazio usando `templateId` e versão existentes.

## Interactions, states and navigation

- Seleção de filtros atualiza resultados localmente, sem chamada HTTP.
- O próprio card mostra prévia dos slots, quantidade e proporção. Não existe rota/modal de prévia.
- Usar template inicia o rascunho e navega ao editor somente depois de salvar localmente.
- Catálogo vazio, erro ao salvar e erro ao carregar rascunhos têm mensagem e ação acessível.
- Templates são dados declarativos versionados, sem regra de negócio embutida em componente visual.

## Responsive and accessibility

- 1440 px usa quatro colunas; 1024 px usa três; 768 px usa duas. Em mobile, duas colunas quando preservam leitura e uma em viewport muito estreito.
- Filtros mobile rolam horizontalmente sem prender o foco; os controles desktop podem quebrar em linhas sem overflow.
- Cada card tem nome e detalhes acessíveis; seleção não depende só da cor; foco visível, contraste WCAG AA e alvos >=44×44 CSS px.

## Acceptance

- **FE-M03-AC01:** cada card apresenta nome, ID, versão, quantidade e proporção do registry real.
- **FE-M03-AC02:** filtros combinados e busca local retornam resultados corretos, sem chamadas HTTP, e estado vazio oferece limpeza.
- **FE-M03-AC03:** cada prévia usa slots reais e fotografias demonstrativas de assets locais do brand; não usa screenshot de UI.
- **FE-M03-AC04:** usar template inicia rascunho vazio com ID/versão escolhidos e navega ao editor real; rascunhos existentes podem ser retomados.
- **FE-M03-AC05:** a hierarquia corresponde ao painel de referência sem reproduzir moldura externa; todos os viewports entre 320 e 1440 px preservam legibilidade, identidade e ausência de overflow.
- **FE-M03-AC06:** Space Grotesk e DM Sans são usadas sem fonte serifada; teclado, foco, seleção textual e estados de falha são acessíveis.
