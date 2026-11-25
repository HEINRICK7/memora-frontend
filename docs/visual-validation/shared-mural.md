# Mural compartilhado — evidência visual parcial

**Data:** 2026-10-25. **Escopo:** FE-M04/W06, cobrindo os layouts M04, M10 e W06 na rota `/m/[shareToken]`.

## Execução

- Galeria aberta em Compose isolado, com PostgreSQL, API, frontend e MinIO reais. As capturas usam 12 previews autorizados retornados pelo shared GET; os 12 GETs de imagem responderam HTTP 200.
- `npm test -- --run`: 185 testes em 28 arquivos passaram. `npm run typecheck` passou. `docker compose ... up -d --build frontend` concluiu o build de produção.
- Na captura M10, viewport 390×844: `scrollWidth` 390, rolagem 55 px, cabeçalho compacto ativo, CTA presente para grant `CONTRIBUTE`, 12 de 12 imagens carregadas e zero erros de página.
- O teste de aceite do cabeçalho teve ciclo RED/GREEN: falhou quando o limite era 140 px e passou após o limite funcional de 40 CSS px, que também permite validar a apresentação em viewports móveis altos.

## Capturas

- M04: `mobile/M04-320.png`, `M04-375.png`, `M04-390.png`, `M04-414.png`.
- M10: `mobile/M10-390-gallery.png`.
- Transição tablet: `tablet/M04-W06-768.png`.
- W06: `desktop/W06-1024.png`, `W06-1440.png`.

## Comparação e limites

- As capturas usam Space Grotesk em títulos, DM Sans em controles, shell escuro mobile, mosaico editorial, ação lime condicionada e mosaico desktop amplo.
- A API não retorna autor nem afirma visibilidade global. Esses elementos das boards não são inventados; título, descrição, contagem e imagens vêm do payload compartilhado autorizado. Para `VIEW`, a ação de contribuição permanece ausente. M10 foi capturada com um grant `CONTRIBUTE` temporário do ambiente de teste, sem enviar contribuição.
- A cobertura visual desta rota é parcial. Ela não conclui a comparação dos 23 layouts nem aprova MEM-008/MEM-009, e não comprova compatibilidade em aparelhos físicos. Verificações de autorização, cache e validade de URLs ficam limitadas ao cenário executado no Compose isolado.
