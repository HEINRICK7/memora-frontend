# M03 — Templates

**Estado:** SDD revisado; implementação rastreada em `FE-M03`.

**ID visual:** M03.

**Referência:** `public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png`, terceiro telefone.

**Rota:** `/templates`.

## Objetivo

Explorar as composições reais do catálogo e iniciar um rascunho local com o template escolhido.

## Composição visual

- Fundo ink e wordmark claro; cabeçalho compacto com retorno a Meus murais e busca local.
- Título “escolhe o mood” em duas linhas, Space Grotesk pesada; “mood” em lime.
- Faixas de chips horizontais com “Todos”, quantidades de fotos e proporções reais do registry. As faixas rolam de forma independente sem alargar a página. Chips temáticos da board não são apresentados como ativos porque o domínio não possui tags.
- Grade com duas colunas de cards fotográficos. As imagens locais de `public/brand/v2/` preenchem os slots declarados do template e são exemplos da marca, nunca fotografias do usuário.
- Cada card exibe o nome real do registry, quantidade, proporção/orientação e estado de seleção. O CTA para usar o template cria o rascunho local real.

## Componentes e comportamento

- `TemplateCatalog` apresenta os estados e coordena filtros e seleção.
- `TemplateCategoryChips` corresponde a filtros reais de quantidade e proporção; a busca filtra localmente o registry por nome, descrição ou ID.
- `TemplateGrid`/`TemplateCard` renderizam exatamente as definições de `TEMPLATE_CATALOG_V1` e suas imagens de exemplo.
- O botão “Usar template” cria rascunho vazio com ID e versão reais e navega a `/editor/{draftId}`. Rascunhos locais existentes podem ser retomados.
- O card contém uma prévia estática dos slots. Não existe rota dedicada de preview nem promessa de animação.

## Responsividade e acessibilidade

- Duas colunas mobile quando os alvos preservarem legibilidade; uma coluna em viewport estreito.
- Filtros rolam horizontalmente sem prender o foco; combinações e busca são anunciadas sem depender apenas da cor.
- Cards, busca e ações são alcançáveis por teclado, têm foco visível e nome acessível.
- Comparação nos viewports 320, 375, 390, 414, 768, 1024 e 1440 px.
- Interface e controles usam DM Sans; título usa Space Grotesk. Não usar fonte serifada.

## Aceite

- **FE-M03-AC01:** catálogo usa somente templates versionados existentes e exibe metadados reais.
- **FE-M03-AC02:** filtros de quantidade e proporção podem ser combinados; busca local filtra o registry e o estado vazio oferece limpeza.
- **FE-M03-AC03:** cada preview usa imagens de assets locais do brand e não usa screenshots de UI nem imagens do usuário.
- **FE-M03-AC04:** seleção, criação e retomada de rascunho seguem o contrato local e navegam apenas para rotas existentes.
- **FE-M03-AC05:** os screenshots responsivos mantêm a hierarquia M03/W04, tipografia aprovada, legibilidade e ausência de overflow horizontal.

## Limites

Os nomes “Photo Dump”, “Poster”, “4 Frames” e “Vibes”, as categorias temáticas e o selo “novo” são conteúdo visual da referência sem equivalência no registry atual. Não serão anunciados como metadados ou comportamento até haver spec e dados reais correspondentes.
