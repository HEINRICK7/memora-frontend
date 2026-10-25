# Validação visual — M05 origem e M06 seleção

**Data:** 25/10/2026 · **Rota:** `/criar` · **Referência:** primeiros dois telefones de `public/telas/Memora mobile mural creation flow-3.png`.

## Capturas

| Tela | 320 | 375 | 390 | 414 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|---|---|
| M05 | [`mobile/M05-320.png`](mobile/M05-320.png) | [`mobile/M05-375.png`](mobile/M05-375.png) | [`mobile/M05-390.png`](mobile/M05-390.png) | [`mobile/M05-414.png`](mobile/M05-414.png) | [`tablet/M05-768.png`](tablet/M05-768.png) | [`desktop/M05-1024.png`](desktop/M05-1024.png) | [`desktop/M05-1440.png`](desktop/M05-1440.png) |
| M06 | [`mobile/M06-320.png`](mobile/M06-320.png) | [`mobile/M06-375.png`](mobile/M06-375.png) | [`mobile/M06-390.png`](mobile/M06-390.png) | [`mobile/M06-414.png`](mobile/M06-414.png) | [`tablet/M06-768.png`](tablet/M06-768.png) | [`desktop/M06-1024.png`](desktop/M06-1024.png) | [`desktop/M06-1440.png`](desktop/M06-1440.png) |

## Resultado

- As 14 capturas foram feitas pelo navegador Chromium contra o frontend de produção executado no Compose isolado. Não houve overflow horizontal: `scrollWidth` correspondeu à largura do viewport nos sete tamanhos.
- Em M06, oito arquivos de teste foram escolhidos pelo input real. O tray mostrou as oito miniaturas, o CTA permaneceu visível nos sete tamanhos e nenhum endpoint de upload foi chamado antes de “usar essas fotos”.
- O título foi calculado com Space Grotesk; os textos de interface usam os tokens do sistema Memora/DM Sans. A tela não usa fontes serifadas.
- O fluxo de confirmação foi executado contra a API e o MinIO locais: `POST` de intent respondeu 201, `PUT` assinado ao MinIO respondeu 200 e `POST` de complete respondeu 200; em seguida a navegação abriu `/templates`.
- A fixture exata do teste foi removida após a validação. As outras fotos que já estavam no banco local foram mantidas.
- `npm test`: 194 testes em 29 arquivos passaram. `npm run typecheck` e build da imagem Docker do frontend passaram.

## Fixture e privacidade

As capturas M06 usam oito cópias locais de `tests/fixtures/MEM-007-export-pattern.png` somente para preencher a grade e o tray. Essa imagem de teste é um padrão gráfico e não vem de `public/brand`; nenhuma foto de marca foi tratada como arquivo selecionado. No produto, grade e tray derivam apenas dos `File`s que a pessoa seleciona ou captura. O upload só ocorre depois do CTA explícito.

## Diferenças intencionais da board

- O navegador não desenha os indicadores de status/home do sistema operacional vistos nos mockups de telefone; as capturas mostram a área web.
- Google Fotos aparece indisponível porque o picker oficial e OAuth não estão implementados. A opção não abre conexão simulada.
- O seletor nativo entrega os arquivos que a pessoa selecionou. M06 mostra esses arquivos como seleção revisável, permite removê-los e reapresenta os mesmos itens no tray; não varre toda a fototeca para expor itens ainda não escolhidos.
- A câmera foi coberta por testes de `getUserMedia`, captura, erro e parada de tracks; compatibilidade real em Safari iOS e Chrome Android ainda precisa de teste nesses aparelhos.

As capturas são inspeção de Chromium headless, sem alegação de compatibilidade física.
