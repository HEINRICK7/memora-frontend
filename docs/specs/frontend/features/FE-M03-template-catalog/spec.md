# FE-M03 — Catálogo de templates

**Estado:** aprovado para implementação.

**IDs visuais:** M03 mobile · W04 desktop.

**Rota:** `/templates` · pública.

**Referências:** quadro 03 de `public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png`; quadro superior de `public/telas/Memora templates and publish flow-4.png`.

## Objetivo

Permitir que a pessoa explore composições disponíveis, compare quantidade de fotos e proporção, e inicie um rascunho local usando uma versão real do catálogo.

## Requisitos

- **FE-M03-R01 — Identidade e estrutura:** preservar o contraste ink/paper/lime da referência; títulos usam Space Grotesk e interface usa DM Sans. Nenhuma fonte serifada é permitida. Mobile tem cabeçalho compacto, título em duas linhas e grade de duas colunas; desktop tem navegação existente, título editorial e grade de quatro colunas em 1440 px.
- **FE-M03-R02 — Registry real:** cada opção representa exatamente uma definição de `TEMPLATE_CATALOG_V1`, exibindo o nome, quantidade de fotos, orientação/proporção e `templateId`/versão correspondentes. Nomes visuais da board não alteram os IDs do domínio.
- **FE-M03-R03 — Imagens demonstrativas:** os previews usam fotografias locais de `public/brand/v2/` distribuídas nos slots definidos pelo template. São exemplos de marca, nunca fotos do usuário, conteúdo persistido ou resultados vindos do backend. Não usar screenshots de interface como fotografias.
- **FE-M03-R04 — Filtros reais:** controles filtram por quantidade e proporção, aceitando combinação. No mobile, as duas faixas rolam independentemente sem alargar a página. A busca, disponível no cabeçalho mobile, filtra localmente nome, descrição e ID. Nenhum controle faz requisição HTTP.
- **FE-M03-R05 — Seleção e rascunho:** selecionar um card deixa a seleção textual e acessível. “Usar template” cria um rascunho vazio com o ID e a versão escolhidos, persiste no armazenamento local existente e navega para `/editor/{draftId}`. Retomar um rascunho continua funcionando.
- **FE-M03-R06 — Responsividade:** comparação em 320, 375, 390, 414, 768, 1024 e 1440 CSS px; sem overflow horizontal. Mobile mostra duas colunas quando os alvos preservam legibilidade e uma coluna em larguras muito estreitas. Desktop usa quatro colunas em 1440, três em 1024 e duas em 768.
- **FE-M03-R07 — Estados e acessibilidade:** filtros sem resultados oferecem limpeza; falha ao salvar e falha ao carregar rascunhos têm mensagens e recuperação. Chips, busca, cards e ações são operáveis por teclado, indicam foco e estado sem depender só de cor, e mantêm alvos de toque adequados.

## Componentes e dados

- `TemplateCatalog` apresenta estado e encaminha eventos.
- `TEMPLATE_CATALOG_V1`, `filterTemplateCatalog` e `getTemplateOrientation` são a fonte de nomes, IDs, quantidades, proporções e slots.
- Os previews são imagens locais decorativas encaixadas na geometria declarada de cada slot; o texto acessível do card fornece o conteúdo significativo.
- `createCompositionDraft`, `listCompositionDrafts` e `localCompositionDraftStore` continuam responsáveis por criar, carregar e retomar rascunhos.

## Limites

- A referência inclui filtros temáticos como “viagem”, “amigos” e “praia”, badge “novo” e nomes como “Photo Dump”, “Poster” e “Vibes”. O registry não possui tags, novidade nem esses IDs; esses rótulos não serão apresentados como metadados reais ou filtros funcionais.
- Não existe rota/modal dedicada de prévia. O card mostra a distribuição estática e ilustrativa dos slots reais; o CTA inicia o rascunho existente.
- As definições são estáticas e locais; a tela não sugere sincronização do rascunho com backend ou MinIO.

## Critérios de aceite

- **FE-M03-AC01:** há exatamente um card por definição de `TEMPLATE_CATALOG_V1`, com nome, `templateId`, versão, quantidade e proporção corretos.
- **FE-M03-AC02:** todas as imagens dos previews usam arquivos locais existentes em `public/brand/v2/`; nenhuma imagem de `public/telas/` aparece dentro da interface.
- **FE-M03-AC03:** filtros de quantidade e proporção combinam corretamente; busca filtra o registry local; estado vazio permite limpar todos os filtros.
- **FE-M03-AC04:** selecionar e usar um template cria rascunho vazio com o ID/versão selecionados e navega à rota real do editor; retomar rascunhos continua disponível.
- **FE-M03-AC05:** os screenshots nos viewports definidos mantêm a hierarquia de referência, cores e fotos demonstrativas, sem fonte serifada, scroll horizontal ou texto/controles cortados.
- **FE-M03-AC06:** testes cobrem busca, filtros, seleção, criação, recuperação de erro e navegação; typecheck e build passam.
