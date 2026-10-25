# Validação visual — entrada M01/W01

**Data:** 25/10/2026 · **Rota:** `/` · **Branch:** `feature/frontend-m01-w01-landing` · **Base:** `287078b`.
**Captura:** Docker Compose, Chrome 155.0.8059.84 headless. As capturas com largura até 768 px usam M01; acima disso usam W01.

Viewports: M01 em 320×844, 375×844, 390×844 e 414×844; M01 em 768×900; W01 em 1024×700 e 1440×650 (o conteúdo mantém altura mínima de 674 px).

## Evidência

| Tela/viewport | Captura |
|---|---|
| M01 — 320 px | [`mobile/M01-320.png`](mobile/M01-320.png) |
| M01 — 375 px | [`mobile/M01-375.png`](mobile/M01-375.png) |
| M01 — 390 px | [`mobile/M01-390.png`](mobile/M01-390.png) |
| M01 — 414 px | [`mobile/M01-414.png`](mobile/M01-414.png) |
| M01 — 768 px | [`tablet/M01-768.png`](tablet/M01-768.png) |
| W01 — 1024 px | [`desktop/W01-1024.png`](desktop/W01-1024.png) |
| W01 — 1440 px | [`desktop/W01-1440.png`](desktop/W01-1440.png) |

## Resultado comparado às boards

- M01 usa a foto local de festival em tela cheia, wordmark branco, título Space Grotesk em branco/lima, apoio em DM Sans e CTA lime no rodapé, como no primeiro telefone de `public/telas/Memora_ Next-gen Brazilian photo mural UI-1.png`.
- W01 usa header ink, título editorial em três linhas, CTAs e colagem assimétrica de fotografias locais; a faixa editorial inferior segue o painel superior de `public/telas/Memora Gen Z Desktop Mural Showcase-2.png`.
- Os layouts não apresentam overflow horizontal nos sete viewports. A rota `/` respondeu HTTP 200 em todas as larguras, as fontes calculadas foram Space Grotesk e DM Sans e todas as imagens carregaram. A inspeção não encontrou screenshots de `public/telas/` no DOM de runtime nem erros de página.
- Em 768 px a página foi corrigida para usar M01, conforme `W01-AC06`; em 769–1023 px o layout desktop reduz as colunas e o tamanho do título.

## Diferenças intencionais exigidas pelos contratos

- Não há avatar/perfil porque `/perfil` e identidade de produção não existem.
- Não há “explorar murais” nem prova social porque não há rota pública ou dados verificados para isso. A navegação usa os destinos existentes.
- “Escolher fotos” abre `/biblioteca`, rota que preserva o fluxo de fotos que antes ocupava `/`; a biblioteca continua usando PhotoGateway e seus testes existentes.

## Verificações

- `npm test -- --run src/presentation/components/landing-page.test.tsx src/presentation/components/photo-library.test.tsx src/presentation/design-system.test.ts` — 26 testes passaram.
- `npm run typecheck` — passou.
- `docker compose build frontend` — passou; a rota `/biblioteca` foi incluída na imagem.
- `git diff --check` — passou.
- Compatibilidade física com Safari iOS e Chrome Android não foi alegada; os registros são de emulação headless em Chrome.
