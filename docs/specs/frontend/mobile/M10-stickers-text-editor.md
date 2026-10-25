# M10 — Guest Public Mural

**Status:** draft SDD. **ID visual:** M10.
**Referência:** public/telas/image2.png, segundo telefone, rótulo 10 GUEST PUBLIC MURAL.
**Rota:** /m/[shareToken], variante de galeria da mesma leitura descrita em M04.

## Objetivo

Permitir que uma pessoa sem sessão navegue pelas fotos autorizadas de um link VIEW.

## Composição visual

- Fundo ink em tela inteira; wordmark branco; título e dados curtos acima da grade.
- Galeria em mosaico de fotos com ritmos variados, sem molduras genéricas. CTA inferior lime no rodapé somente se a capacidade real permitir contribuir.
- Conteúdo fotográfico vem de previewUrl temporária autorizada; cabeçalho usa campos mínimos do contrato shared.
- M04 documenta o primeiro recorte editorial e M10 a grade/rolagem; ambas são apresentações da rota compartilhada, não dois modelos de autorização.

## Comportamento e estados

- GET compartilhado não exige login e não oferece edição/moderação.
- canContribute=false oculta envio. VIEW é leitura; não tentar mutação usando token de visualização.
- URL de preview renova por novo GET com base no prazo informado. Não gravar URLs assinadas.
- Error states LINK_INVALID/EXPIRED/REVOKED/MURAL_REMOVED são genéricos e não desenham conteúdo parcial.
- Tap abre lightbox acessível, descrito no aceite abaixo; fechar restaura o foco à foto original.

## Responsividade e acessibilidade

- Grid varia número de colunas conforme largura e não corta rostos/legendas importantes; manter alvo de toque.
- Lightbox tem nome e semântica de diálogo, fecha com botão/Escape e permite anterior/próxima por botões/setas/gesto quando disponível.
- Pular para conteúdo, alt por foto e foco visível. Noindex/no-referrer e no-store são requisitos da página/API e devem ser testados separadamente.

## Aceite

- **FE-M10-AC01:** visitante anônimo vê apenas mural/fotos autorizados; nenhuma ação de escrita existe para canContribute=false.
- **FE-M10-AC02:** expirando preview, a UI solicita novo payload sem armazenar URL durável.
- **FE-M10-AC03:** lightbox abre/fecha e restaura foco; erro público não mostra título, owner ou imagem.

## Dúvidas / limites

A UI de contribuição só aparece se uma API futura aprovada retornar essa capacidade e a ação estiver habilitada em produção.
