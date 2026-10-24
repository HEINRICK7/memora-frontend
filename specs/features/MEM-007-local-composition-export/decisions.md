# MEM-007 — Decisões

## MEM-007-ADR-01 — Renderizar no browser com Canvas 2D

O editor e a prévia são locais. Um renderer Canvas 2D usa o mesmo `CompositionDocument` v1 e as definições versionadas do catálogo para evitar caminho de publicação, servidor de imagem ou mutação de draft. Igualdade determinística cobre geometria, fundo, corte e ordem de camadas para os mesmos pixels de entrada; codificadores do browser podem gerar bytes diferentes.

## MEM-007-ADR-02 — Resolução limitada pelo catálogo atual

O catálogo define dimensões de até 1800 × 1800 px; seus templates de maior área são Single e Grid, com 2.560.000 px (1600 × 1600). MEM-007 v1 rejeita dimensões acima desses limites antes de reservar memória. Isso é um limite contratual de produto baseado no catálogo existente, não uma alegação de que todo dispositivo suporta a exportação; Safari iOS e Chrome Android ainda exigem validação real.

## MEM-007-ADR-03 — Não ampliar fotografia de baixa resolução

Uma imagem com menos pixels que o necessário para seu slot não é ampliada para preencher a resolução de saída. A exportação informa o slot e pede fotografia de resolução suficiente. Essa política segue FRONTEND_SPEC (“evitando upscaling enganoso”) e preserva o tamanho fixo declarado pelo template, sem reduzir a dimensão final silenciosamente.

## MEM-007-ADR-04 — CORS como condição de exportação

Fotos de `PhotoAsset` ficam privadas no MinIO e são lidas por URL temporária. O adapter usa imagens CORS anônimas e exige resposta CORS válida para a origem do frontend. Não se tentará baixar por proxy do backend, remover controles de acesso ou fornecer fallback que exporte tela contaminada; a integração real em Docker deve comprovar a configuração MinIO.

## MEM-007-ADR-05 — Qualidade é parâmetro do encoder, não garantia de tamanho

PNG permanece lossless. JPEG começa na qualidade `template.export.jpegQuality` (hoje `0.92`) e permite parâmetro normalizado de `0` a `1`. O produto não promete bytes máximos, equivalência entre engines ou ganho de detalhe com qualidade maior.

## MEM-007-ADR-06 — Cancelamento descarta resultado

`AbortSignal` interrompe etapas assíncronas onde o browser permite. `HTMLCanvasElement.toBlob()` pode não ser interrompível depois de iniciado; nesse caso, o renderer descarta o resultado quando ele retorna e a apresentação nunca cria/inicia o download. Não prometer cancelamento físico instantâneo de trabalho já iniciado pelo browser.

## MEM-007-ADR-07 — Validar com fixture, API e MinIO reais no E2E

Exportação depende de leitura CORS de objeto privado. O gate E2E usa uma fixture sintética e versionada, cria seu asset pela API de upload e grava os bytes via URL assinada no MinIO local do Compose. O Chrome desktop percorre a UI pública do catálogo/editor e o renderer/codificador de produção; apenas dados/fotos de teste são usados. Interceptar a API ou storage invalidaria a evidência porque não exercitaria o risco de canvas tainted.

Playwright Chrome desktop é a primeira evidência automatizada e precisa registrar browser, resultado dos downloads e headers CORS sem query string assinada. Isso não autoriza afirmar compatibilidade física com Safari iOS ou Chrome Android; ambos permanecem explicitamente não verificados até rodarem nesses dispositivos.

## MEM-007-ADR-08 — Recuperação específica para cada falha de fotografia

Um link assinado expirado recebe estado `PHOTO_PREVIEW_EXPIRED` e ação de atualizar prévias. Asset ausente/não READY e falha de decodificação mantêm os `slotIds` afetados e oferecem substituição; resolução insuficiente direciona para escolher uma foto maior. A UI não oferece atualização como solução para problemas que ela não pode corrigir.
