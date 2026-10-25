# FE-W06 — Mural compartilhado desktop

**Status:** draft SDD; contrato shared MEM-008 deve ser a fonte do payload e da permissão.
**Requirement IDs:** FE-W06-R01–R07 · **Acceptance IDs:** FE-W06-AC01–AC08.
**Route/access:** /m/[shareToken] · visitante pelo grant válido.

## Objective

Exibir a coleção publicada autorizada pelo link, com fotos reais daquele Mural e capacidade de leitura definida pelo backend.

## Visual reference

Arquivo public/telas/image4.png, painel superior: título/capa na faixa inicial, botão de ação e mosaico fotográfico largo. A linha/moldura entre as duas telas é organização da prancha, não UI.

## Layout and components

- Header mínimo ink com wordmark e navegação estritamente necessária; sem acesso a controles privados do proprietário.
- Título grande, descrição e metadata permitida sobre paper; ação “mandar minhas fotos” é condicional à permissão canContribute retornada por API real.
- Galeria assimétrica de fotos ocupa a maior área do viewport; imagens seguem ordem do backend, object-fit apropriado, proporção preservada e nenhuma mídia de outro mural.
- Foto de capa usa coverPhotoId quando presente; se nula, primeira foto autorizada serve apenas como fallback visual e não grava mudança.
- Lightbox acessível mostra uma foto por vez, navega anterior/próxima, fecha e restaura foco.
- Shared GET e mídias seguem os contratos de segurança: HTML e JSON no-store/noindex/no-referrer; previews apontam somente a SHARE_VIEW; nenhum original ou storage key é exposto. URLs assinadas ficam em memória volátil.
- Erro público usa estados seguros de link indisponível/expirado/revogado/mural removido, sem título, owner, UUID ou fotos.

## Interactions, states and navigation

- A página solicita somente GET compartilhado sem autenticação; nenhuma chamada de mutação ocorre por conhecer o token VIEW.
- Botão de contribuição não aparece para canContribute false. Se um futuro grant real retornar true, a rota de upload segue o contrato de contribuição e as imagens aguardam aprovação; o frontend não publica contribuição diretamente.
- Novo GET renova previews perto/depois de previewExpiresAt; a URL anterior não é persistida nem registrada.
- Estados: loading, view ready, atualização de preview, falha temporária e estados de link/mural indisponível. Nenhum erro revela metadata privada.

## Responsive and accessibility

- 1440 px: mosaic pode usar seis colunas e gaps finos; 1024 px reduz colunas; 768 px e abaixo adota grade/arranjo da tela M04/M10, sem esticar colunas.
- Imagens preservam legibilidade e carregam sob demanda; reservar proporções previne layout shift.
- Dialog lightbox anuncia nome/posição, fecha por botão/Escape, navega por botões e setas, restaura foco e aceita toque. Controles >=44×44 CSS px; contraste AA e reduced motion.

## Acceptance

- **FE-W06-AC01:** layout fotográfico amplo, hierarquia título/descrição/galeria e densidade visual seguem a referência em desktop.
- **FE-W06-AC02:** conteúdo exibido vem exclusivamente do shared GET e corresponde às fotos autorizadas retornadas.
- **FE-W06-AC03:** capability de leitura VIEW não revela controles de edição, publicação ou upload.
- **FE-W06-AC04:** CTA de contribuição é condicionado a canContribute real e não existe para VIEW-only.
- **FE-W06-AC05:** HTML, JSON e GET MinIO validam seus próprios headers de privacidade conforme MEM-008.
- **FE-W06-AC06:** a página nunca usa original como preview/fallback e não expõe chave de storage.
- **FE-W06-AC07:** os estados inválido, expirado, revogado e mural indisponível são seguros, distintos e não contêm metadata.
- **FE-W06-AC08:** layout e lightbox são responsivos/acessíveis em 1440, 1024, 768, 414, 390, 375 e 320 px.
