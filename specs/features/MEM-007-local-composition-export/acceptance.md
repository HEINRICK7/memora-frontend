# MEM-007 — Critérios de aceite

## MEM-007-AC01 — Exportar composição completa em PNG

**Given** um draft válido com todos os slots associados a fotos READY e um template que suporta PNG\
**When** a pessoa escolhe PNG e inicia a exportação\
**Then** o browser baixa um arquivo `image/png` com as dimensões declaradas no template\
**And** o conteúdo contém somente fundo, decorações e fotos na geometria/ordem do documento e template.

## MEM-007-AC02 — Exportar composição completa em JPEG

**Given** um draft válido e completo com template que suporta JPEG\
**When** a pessoa escolhe JPEG e confirma a qualidade\
**Then** o browser baixa `image/jpeg`\
**And** usa o default do template quando a pessoa não ajustou qualidade\
**And** a dimensão e composição continuam iguais às opções validadas.

## MEM-007-AC03 — Rejeitar composição incompleta

**Given** ao menos um slot requerido está vazio\
**When** a pessoa tenta exportar\
**Then** a UI identifica os slots pendentes\
**And** nenhum arquivo ou download é criado.

## MEM-007-AC04 — Resolver fotos atuais antes de renderizar

**Given** o draft contém asset IDs e URLs de prévia anteriores podem ter expirado\
**When** a pessoa inicia a exportação\
**Then** o `PhotoGateway` obtém URLs temporárias atuais e confirma disponibilidade READY\
**And** o renderer não lê nem grava URL temporária no draft.

## MEM-007-AC05 — Foto removida, indisponível ou não decodificável

**Given** um asset deixou de estar READY, seu link temporário expirou ou a imagem falha ao carregar/decodificar\
**When** a pessoa inicia a exportação\
**Then** informa o slot afetado e oferece atualizar o link temporário se expirou, ou substituir a foto se o asset estiver indisponível/não decodificável\
**And** mantém o asset ID no draft\
**And** não inicia download parcial.

## MEM-007-AC06 — Geometria, camadas e corte determinísticos

**Given** um template válido e uma composição com cada slot preenchido\
**When** renderiza o arquivo\
**Then** cada decoração e foto usa coordenadas normalizadas e dimensões de exportação\
**And** camadas são desenhadas por `layerOrder`\
**And** `cover` e `contain` respeitam o `cropMode` do slot\
**And** o resultado exclui botões, placeholders e elementos de controle da UI.

## MEM-007-AC07 — Bloquear resolução insuficiente

**Given** uma foto não tem pixels suficientes para ocupar seu slot nas dimensões alvo\
**When** a pessoa tenta exportar\
**Then** o sistema identifica o slot e pede uma imagem com maior resolução\
**And** não amplia pixels nem inicia download.

## MEM-007-AC08 — Validar dimensões/formato do template

**Given** uma definição de template anuncia MIME não suportado ou dimensão fora do envelope v1 (lado > 1800 px ou área > 2.560.000 pixels)\
**When** a pessoa inicia exportação\
**Then** a definição é rejeitada antes de alocar/renderizar Canvas\
**And** a UI apresenta erro recuperável sem fallback de tamanho/formato.

## MEM-007-AC09 — Falha de CORS ou canvas contaminado

**Given** a imagem não permite leitura cross-origin pelo Canvas 2D ou a codificação detecta canvas tainted\
**When** o browser tenta renderizar/codificar\
**Then** a tarefa termina em erro local com retry/substituição\
**And** nenhum arquivo é baixado com pixels omitidos ou erro mascarado.

## MEM-007-AC10 — Falha de codificação ou MIME divergente

**Given** Canvas retorna `null` ou MIME diferente do solicitado\
**When** a etapa de codificação termina\
**Then** a operação informa falha\
**And** não baixa/renomeia silenciosamente um arquivo de outro formato.

## MEM-007-AC11 — Cancelar exportação

**Given** a operação está preparando, carregando fotos, renderizando ou codificando\
**When** a pessoa aciona “Cancelar”\
**Then** o pedido de cancelamento é propagado ao renderer\
**And** resultado pendente é descartado mesmo se a codificação do browser já não puder ser interrompida\
**And** nenhum download é iniciado.

## MEM-007-AC12 — Progresso verdadeiro e acessível

**Given** a exportação está carregando N fotos\
**When** cada imagem é concluída\
**Then** a UI pode informar contagem concluída de 0 a N\
**And** renderização/codificação sem progresso mensurável são anunciadas como etapas indeterminadas\
**And** não exibe percentual inventado.

## MEM-007-AC13 — Exportação não publica nem altera o draft

**Given** um draft local válido\
**When** a exportação termina, falha ou é cancelada\
**Then** documento, timestamps e bytes dos assets permanecem iguais\
**And** nenhuma API de composição/publicação é chamada\
**And** nenhum resultado é salvo no IndexedDB ou enviado ao backend.

## MEM-007-AC14 — Privacidade do download transitório

**Given** o browser criou Blob e object URL para o arquivo final\
**When** o download é iniciado ou a tarefa é cancelada\
**Then** o object URL é liberado após o browser aceitá-lo ou descartar o resultado\
**And** URL assinada, token e conteúdo não aparecem em logs, analytics, nome do arquivo ou IndexedDB.

## MEM-007-AC15 — Controles, estado e responsividade

**Given** editor aberto em viewport móvel ou desktop\
**When** a pessoa navega pelo teclado/leitor de tela e escolhe formato/qualidade\
**Then** controles têm rótulos, foco visível e alvos de no mínimo 44×44 CSS px\
**And** progresso, erro, cancelamento e conclusão são anunciados\
**And** pode iniciar nova tentativa após estado terminal.

## MEM-007-AC16 — E2E real de upload privado, CORS e exportação

**Given** os serviços `postgres`, `minio`, `backend` e `frontend` estão saudáveis via Docker Compose\
**And** o runner Playwright usa Chrome desktop e uma fixture PNG determinística de 1600 × 1600 px, sem dados pessoais, com quadrantes de cores conhecidos\
**When** o setup do E2E cria um upload pela API real `POST /api/v1/uploads`, envia os bytes pela URL assinada real retornada (PUT para MinIO) e conclui por `POST /api/v1/uploads/{uploadId}/complete`\
**And** o browser abre `/templates`, seleciona o template Polaroid v1, preenche o slot com o asset READY listado pela API real e exporta PNG e JPEG\
**Then** a rede do browser contém um GET bem-sucedido à URL assinada real do MinIO, sem registrar seu query string\
**And** a resposta do MinIO autoriza por CORS a origem do frontend; renderer e `HTMLCanvasElement.toBlob()` nativos são usados sem intercepts ou substitutos\
**And** os bytes baixados têm assinatura de arquivo PNG/JPEG correspondente ao formato escolhido e decodificam no browser\
**And** ambos os arquivos têm 1200 × 1500 px, conforme `polaroid-single` v1\
**And** o pixel `(200, 300)` na área da foto corresponde ao quadrante superior esquerdo da fixture: igualdade RGB exata em PNG e diferença máxima de 24 níveis por canal em JPEG\
**And** o pixel `(600, 1350)` na área de papel é branco RGB `(255, 255, 255)`\
**And** o teste remove o asset pela API real ao final e falha se upload, URL assinada, CORS, canvas, formato, dimensões ou conteúdo não corresponderem.

Executado em Chrome desktop em 2026-10-24; ver evidência MEM-007-E2E-01 em `evidence.md`. A execução não prova suporte em Safari iOS ou Chrome Android físico; esses dispositivos permanecem não verificados até teste manual automatizado/registrado neles.
