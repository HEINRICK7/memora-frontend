# FE-M02 — Evidência visual

**Referência:** `public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png`, segundo telefone (M02 — Seus murais).
**Implementação:** `/meus-murais`, breakpoint mobile até 760 CSS px.
**SDD:** `docs/specs/frontend/features/FE-M02-my-murals/`.

## Resultado

A composição mobile segue a referência: wordmark compacto, título em duas linhas com destaque cobalt, chips horizontais, grade de duas capas por linha e navegação inferior com ação coral central. As fotos, contagens e status dos cards são ligados ao mural retornado pelo contrato; a capa precisa corresponder a `coverPhotoId` e a contagem vem de `listMuralPhotos`.

O ambiente local respondeu `200` a `GET /api/v1/murals` com lista vazia. Os arquivos `M02-{320,375,390,414}.png` mostram esse estado real, incluindo CTA de criação. `M02-768.png` registra a transição de layout tablet.

Para comparar o estado povoado com a referência, `M02-loaded-{320,375,390,414}.png` foi capturado com uma fixture temporária do Playwright que intercepta as duas respostas HTTP e respeita seus schemas. Ela usa fotos sintéticas locais de `public/brand/v2/photos/murals/` só durante a captura visual; não grava resposta no banco, não envia imagens ao MinIO e não altera o código de runtime. Os títulos, status e contagens dessa fixture não representam dados de produção. `M02-loaded-768.png` registra a mesma fixture na transição tablet.

## Verificações

- 320, 375, 390 e 414 px: quatro cards e quatro previews renderizados na fixture, sem overflow horizontal; fonte do título Space Grotesk; navegação mobile visível.
- 768 px: sem overflow; navegação inferior oculta e cards de lista em layout tablet. A tela desktop W02 ainda será implementada como trabalho separado.
- A lista real vazia e os erros continuam distintos; a falha de fotos não vira contagem zero. Cobertura está em `src/presentation/components/my-murals-m02.test.tsx` e `my-murals.test.tsx`.
- M02 ainda não está funcionalmente concluída: os cards permanecem artigos sem link até a rota do proprietário ser implementada e incluída em uma branch versionada; esse requisito está rastreado como FE-M02-AC09.
- Screenshot em navegador desktop automatizado; sem alegação de teste em aparelho físico.

## Diferenças intencionais

- Busca, avatar e “Favoritos” da board não aparecem como funções porque não existe contrato implementado para identidade/busca/favoritos. Os filtros apresentados correspondem a DRAFT, PUBLISHED e ARCHIVED reais.
- O item Perfil existe como controle desabilitado até a rota de perfil ser implementada; os outros itens apontam para destinos existentes.
- A tela não usa a fotografia demo como capa persistida do usuário: a fixture é explicitamente restrita à inspeção visual e ao assets locais, fora dos dados reais.
