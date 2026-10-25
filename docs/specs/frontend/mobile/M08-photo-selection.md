# M08 — Publicar: nome e privacidade

**Status:** draft SDD. **ID visual:** M08.
**Referência:** public/telas/Memora mobile mural creation flow-3.png, quarto telefone, rótulo 08 QUASE LÁ.
**Rota/estado:** configurar/publicar em /murais/[muralId]/configurar.

## Objetivo

Nomear/configurar a coleção persistente e revisar o conteúdo antes de publicação explícita.

## Composição visual

- Header com voltar, wordmark e cancelar.
- Heading “bora dar um nome?”; preview/capa fotográfica ampla; campo de título com contador; seletor de intenção de acesso; CTA lime no rodapé.
- Superfície paper, texto ink, seleção cobalt; form em DM Sans e heading em Space Grotesk.
- A capa é foto vinculada ao mural, não Composition exportada.

## Comportamento e estados

- Atualizar título/descrição/capa usa PATCH de MEM-004/MEM-008 com If-Match; campos omitidos preservam dados e null limpa capa manual.
- A tela exibe DRAFT/PUBLISHED do servidor. Publicar requer fotos READY; a ação exige confirmação e resultado do endpoint de publicação.
- Intenção “quem tem link” não cria grant: após publicar, criar VIEW é ação separada em M09. A opção “só eu” não deve prometer acesso público.
- Cancelar confirmação não envia publish; erro de validação/conflito mantém os dados editáveis.
- Toggles de colaboração/contribuição só aparecem com contrato e grant compatíveis aprovados; não simular permissões.

## Responsividade e acessibilidade

- Preview preserva proporção; campos e opções empilham em celular. Rodapé considera safe area e conteúdo pode rolar.
- Labels persistentes, descrição do limite, erros ligados por aria-describedby, radio group navegável por teclado.
- Contraste WCAG AA, foco visível e seleção indicada além da cor.

## Aceite

- **FE-M08-AC01:** PATCH atualiza apenas campos alterados com versão atual; conflito não sobrescreve dados do servidor.
- **FE-M08-AC02:** antes da publicação a confirmação explica público-alvo e que publicar não cria link.
- **FE-M08-AC03:** sucesso só é mostrado após resposta PUBLISHED; grant VIEW é um passo explícito posterior.

## Dúvidas / limites

O toggle visual da referência não altera a semântica de MEM-008: publicação e concessão de link são operações distintas.
