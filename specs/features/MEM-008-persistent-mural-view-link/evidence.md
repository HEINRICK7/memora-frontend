# MEM-008 — Evidência de dispositivos físicos (rascunho)

**Estado:** pendente. Atualizado em 2026-10-24; nenhuma execução física foi registrada.

## Estado de compatibilidade

| Plataforma | Estado | Browser/versão | Dispositivo/modelo | OS/versão | Data do teste |
|---|---|---|---|---|---|
| Safari iOS | NÃO VERIFICADO | — | — | — | — |
| Chrome Android | NÃO VERIFICADO | — | — | — | — |

Não declarar suporte ou compatibilidade física para uma plataforma até executar MEM-008-FE-AC19 e preencher a respectiva linha com evidência. E2E em Chrome desktop e viewport/touch emulado continuam independentes deste gate.

## Registro por execução

Criar um registro separado para cada browser/dispositivo e preencher após teste físico real:

- Browser e versão:
- Dispositivo/modelo físico:
- Sistema operacional e versão:
- Data e fuso horário da execução:
- Build/commit testado:
- Web Share disponível e exercitado? Se não, fallback acessível exercitado?
- Igualdade da URL copiada com a shareUrl real do backend confirmada? Registrar apenas sim/não, nunca a URL/token.
- Viewport e rotação exercitados:
- Teclado: abrir/fechar/navegar lightbox:
- Toque: abrir/fechar/navegar lightbox:
- Resultado por cenário e falhas observadas:
- Referências a capturas/logs sanitizados (sem token, shareUrl, assinatura ou URL MinIO):
- Estado final: aprovado / falhou / inconclusivo:

## Checklist MEM-008-FE-AC19

- [ ] Executado em aparelho físico, sem simulação/emulação do dispositivo.
- [ ] “Compartilhar” usou Web Share quando disponível ou fallback acessível; URL validada sem registrar seu valor.
- [ ] Layout responsivo verificado no viewport físico.
- [ ] Teclado real/entrada de teclado validou abrir, fechar, anterior e próxima.
- [ ] Toque validou abrir, fechar, anterior e próxima.
- [ ] Lightbox manteve controles acessíveis e foco conforme especificado.
- [ ] Browser, versão, modelo do dispositivo, versão do OS e data foram registrados acima.
- [ ] Estado de compatibilidade atualizado apenas para a plataforma testada; evidências não incluem segredo.

## E2E real em Compose

**Estado:** NÃO EXECUTADO. O E2E MEM-008 permanece pendente de aprovação do contrato backend, OpenAPI e implementação. Esta seção registra o formato/comandos previstos; não é resultado de teste.

### Comandos previstos

Executar do repositório memora-frontend após o gate de backend:

```sh
docker compose -f ../memora-backend/compose.yaml up --build --wait postgres minio backend frontend
npm run e2e -- --project=chrome-desktop tests/e2e/MEM-008-persistent-mural-view-link.spec.ts
docker compose -f ../memora-backend/compose.yaml ps
```

O teste Playwright deve usar API, PostgreSQL e MinIO reais, fixture criada pela API e cleanup apenas do asset criado por essa execução. Não usar down -v nem apagar volumes compartilhados.

### Registro obrigatório após execução

- Data/hora e timezone:
- Branch e commit/build do frontend:
- Versão do Playwright:
- Browser executado (nome/canal e versão efetiva do Chrome):
- Comando Compose e resultado:
- Comando E2E e exit code:
- Relatório Playwright (caminho e resumo sem segredos):
- Health final dos containers postgres, minio, backend e frontend (saúde/readiness):
- Headers observados separadamente em HTML, API shared, objeto MinIO privado e objeto MinIO compartilhado:
- Referrer-Policy observado na resposta HTML /m/[shareToken] e redação do token conferida em logs/traces/proxy:
- Fixture criada pela API com EXIF/GPS e orientação conhecida; resultado da inspeção dos bytes compartilhados (sem EXIF/GPS), orientação dos pixels e confirmação de que o original não é servido/referenciado pelo fluxo shared:
- Nome de campo/variante e contrato de transformação reconciliados com a versão aprovada do backend/OpenAPI (não preencher com suposição enquanto pendente):
- Cleanup do asset de fixture desta execução:
- Falhas/desvios da spec e resultado final:

Registrar somente o resultado da comparação da clipboard com a shareUrl real (sim/não); não gravar token, shareUrl, URL assinada ou assinaturas em logs, relatórios ou capturas. Até uma execução real, E2E continua NÃO EXECUTADO e nenhuma evidência de sucesso deve ser alegada.

Para MEM-008-FE-AC14/MEM-008-FE-AC22, a execução futura deve confirmar que os bytes efetivamente baixados pela URL shared/MinIO pertencem à variante privada sanitizada, removem EXIF/GPS, decodificam com a orientação visual esperada e não são o original. A ausência ou falha da variante deve ser exercitada como falha fechada, sem fallback. Os nomes concretos do DTO/variante só serão registrados após reconciliação e aprovação do contrato backend.
