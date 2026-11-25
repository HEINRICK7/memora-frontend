# FE-M04/W06 — Mural compartilhado responsivo

**Status:** draft de implementação visual, 25/10/2026.  
**IDs visuais:** M04, M10 e W06.  
**Rota:** `/m/[shareToken]`.  
**Referências:** `public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png` (quadro 04), `public/telas/image2.png` (quadro 10) e `public/telas/image4.png` (quadro superior).

## Objetivo

Apresentar um mural publicado autorizado pelo link como uma galeria fotográfica. M04 mostra a composição editorial no celular; M10 mantém a galeria navegável em rolagem no mesmo fluxo; W06 organiza a mesma coleção em mosaico desktop. Não há uma segunda API ou modelo de mural para cada viewport.

## Requisitos rastreáveis

- **FE-SM-R01:** título, descrição, contagem, capa e fotos vêm somente do `GET /api/v1/shared/{shareToken}`. A contagem é `photos.length`; não exibir autor, status “público”, legenda ou volume inventado.
- **FE-SM-R02:** previews usam exclusivamente `previewUrl` devolvida após autorização. A capa nula usa a primeira foto apenas como fallback de apresentação, sem mutação. Nunca usar fotos de `public/brand` ou originais como conteúdo deste mural.
- **FE-SM-R03:** M04 usa cabeçalho compacto escuro, título Space Grotesk, metadado DM Sans e mosaico editorial assimétrico com filetes claros. O mosaico conserva todas as fotos e continua em rolagem até o fim.
- **FE-SM-R04:** M10 oferece a galeria completa no mesmo fluxo, com alvos de toque e conteúdo que não fica sob a ação fixa.
- **FE-SM-R04a:** após 40 CSS px de rolagem mobile, o cabeçalho compacto mantém wordmark, título e saída acessível enquanto a galeria continua rolável.
- **FE-SM-R05:** W06 usa cabeçalho ink, wordmark Memora lime, faixa paper com título/descrição e CTA condicionado, seguido por mosaico amplo de tiles variados. Desktop não revela controles privados do dono.
- **FE-SM-R06:** para `canContribute`, QR abre boas-vindas com **Começar**; o convidado envia ao próprio álbum e escolhe quais fotos publicar na galeria universal. Para `VIEW`, não há controle de escrita.
- **FE-SM-R07:** lightbox abre a partir da galeria, fecha por botão/Escape, navega por botões/setas e gesto horizontal, mantém foco acessível e o devolve ao tile de origem.
- **FE-SM-R08:** URLs temporárias ficam apenas em memória e são renovadas por novo shared GET antes de expirarem. Falha de imagem mostra estado neutro sem buscar recurso alternativo.
- **FE-SM-R09:** estados inválido, expirado, revogado, mural indisponível e falha temporária não exibem título, fotos, UUID, proprietário ou token.
- **FE-SM-R10:** suportar 1440, 1024, 768, 414, 390, 375 e 320 CSS px, sem overflow horizontal; usar safe area, contraste, foco visível e alvos de ao menos 44×44 px.

## Fora do escopo

Busca, ações de menu sem contrato, edição/publicação do mural, contagem ilustrativa, perfil/autor, uso de fotos de marca como fotos compartilhadas e qualquer mutation além da contribuição explicitamente autorizada pelo grant. Esta feature não afirma validação em aparelhos físicos nem conclui o E2E de privacidade do MEM-008.
