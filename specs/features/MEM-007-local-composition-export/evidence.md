# MEM-007 — Evidência

## MEM-007-E2E-01 / MEM-007-AC16 — Compose, MinIO privado e exportação no browser

- **Data:** 2026-10-24
- **Compose:** `docker compose up --build --wait postgres minio backend frontend` concluiu com sucesso.
- **Saúde após execução:** `backend`, `frontend`, `minio` e `postgres` reportados como `running healthy` por `docker compose ps`.
- **Browser:** Google Chrome desktop `155.0.8059.84`, projeto Playwright `chrome-desktop`.
- **Execução:** `npm run e2e -- --project=chrome-desktop tests/e2e/MEM-007-local-composition-export.spec.ts` — 1 teste passou (6,3 s).
- **Upload real:** a API criou o upload, o PUT assinado gravou a fixture no MinIO e a API concluiu o asset como `READY`; o teste passou por cada status esperado.
- **CORS real:** durante as exportações, o browser observou GET bem-sucedido à origem MinIO e `Access-Control-Allow-Origin` igual à origem da aplicação (`http://localhost:3300`). O teste não registrou query string assinada.
- **Downloads:** PNG e JPEG passaram nas assinaturas binárias esperadas, decodificaram no Chrome e mediram `1200 × 1500` px. O pixel da fotografia correspondeu à cor de origem (PNG exato; JPEG dentro da tolerância definida) e o pixel do papel permaneceu branco.
- **Limpeza:** `finally` do cenário chamou o DELETE da API para o asset criado pela fixture; o teste confirmou o status de limpeza permitido pelo contrato.
- **Dispositivos ainda não verificados:** Safari iOS físico e Chrome Android físico.
