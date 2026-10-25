# FE-M02 — Meus murais

**Estado:** visual mobile validado; navegação para detalhe pendente da rota do proprietário.
**ID visual:** M02 — Seus murais.
**Referência:** `public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png`, segundo telefone.
**Rota:** `/meus-murais`.

## Problema e objetivo

O proprietário precisa retomar seus murais e distinguir rascunhos, publicados e arquivados. A tela deve manter o foco nas fotografias e não expor dados de outras pessoas.

## Composição

- Base em paper, wordmark Memora em Space Grotesk e cabeçalho compacto.
- Título em duas linhas (“seus momentos,” / “todos aqui.”), com a segunda linha em cobalt.
- Filtros para Todos, Rascunhos, Publicados e Arquivados. “Favoritos” aparece na board, mas não existe contrato ou persistência para favoritos, então não será ativo.
- Grade de duas colunas de cards verticais com raio arredondado, preview da capa, título e contagem de fotos real.
- Barra inferior com Início, Murais, Criar, Modelos e Perfil. Perfil fica visivelmente desabilitado enquanto a tela/contrato correspondente não existir. Criar e Modelos levam à rota existente `/templates`.
- Os assets fotográficos de `/public/brand/v2/photos/murals/` são demonstrativos de marca, não conteúdo dos murais de usuários. Capas reais usam previews autorizados do backend.

## Dados e comportamento

1. Carregar murais próprios por `MuralGateway.listMurals`, preservando paginação e filtro remoto.
2. Para cada mural exibido, carregar `MuralPhotoGateway.listMuralPhotos`. A contagem deriva de `items.length`; a imagem de capa corresponde ao `coverPhotoId`.
3. Exibir DRAFT, PUBLISHED e ARCHIVED com rótulo textual. Não depender apenas de cor.
4. Estados de loading, erro de rede, não autenticado (401), vazio e lista carregada são distintos. O estado vazio leva a `/templates`.
5. Preview temporário não é guardado em analytics, logs, local storage ou URLs de navegação.
6. Filtros no mockup sem suporte de contrato (busca, favoritos) não são apresentados como operantes.
7. O card permanece artigo sem link até a rota de detalhe/configuração do proprietário estar implementada e versionada; não apontar para rota inexistente.

## Breakpoints e acessibilidade

- Comparação mobile em 320, 375, 390 e 414 CSS px; tablet 768 px verifica transição sem overflow.
- Duas colunas quando os cards mantêm alvos e conteúdo legíveis; uma coluna em viewport muito estreito se necessário.
- Filtros rolam horizontalmente sem prender o foco, com `aria-pressed` e alvo mínimo 44×44 CSS px.
- Navegação inferior respeita `env(safe-area-inset-bottom)` e o foco/seleção usa forma e texto além da cor.
- Título, status e contagem permanecem legíveis sem corte. Imagens têm `alt` contextual ou são decorativas quando o título já descreve o card.

## Fora de escopo

Busca de murais, favoritos, avatar com identidade, criação de perfil e contagens sociais, pois não são fornecidos pelos contratos atuais.
