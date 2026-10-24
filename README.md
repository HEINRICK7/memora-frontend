# Memora frontend

Frontend Next.js do Memora. Hoje inclui a biblioteca privada de fotografias (MEM-001), catálogo de templates (MEM-003) e editor de composição com rascunho IndexedDB local (MEM-005). As features e contratos estão em `specs/features/`.

## Desenvolvimento

Use Node.js 22.23.4. Configure `NEXT_PUBLIC_MEMORA_API_URL` com a base da API,
por exemplo `http://localhost:8080/api/v1`.

```sh
npm ci
npm run dev
```

## Verificação

```sh
npm test -- --reporter=dot
npm run typecheck
npm run build
```

## Docker Compose

O Compose que sobe frontend, API, PostgreSQL e MinIO está no repositório irmão `memora-backend/compose.yaml`. Clone a branch `feature/mem-004-update-mural-metadata` do backend e a branch `feature/mem-005-local-composition-editor` deste repositório na mesma pasta, depois execute os comandos descritos no README do backend. O endereço da API é incorporado durante o build.

Para executar somente a imagem do frontend:

```sh
docker build \
  --build-arg NEXT_PUBLIC_MEMORA_API_URL=http://localhost:8080/api/v1 \
  -t memora-frontend:local .
docker run --rm -p 127.0.0.1:3000:3000 memora-frontend:local
```

O servidor escuta em `0.0.0.0:3000` e roda como usuário sem privilégios.
