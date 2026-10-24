# MEM-007 — Exportação local da composição

**Estado:** aprovado pelo juiz para implementação; ciclo TDD iniciado nesta branch.
**Fontes:** `../../../FRONTEND_SPEC.md`, `../../../BRAND_SYSTEM.md`, `../../../../memora-backend/BACKEND_SPEC.md`, `../../../../SDD_TDD_PROTOCOL.md`, `../MEM-005-local-composition-editor/spec.md`.

## Problema e usuário

Depois de montar uma composição local, a pessoa precisa salvar uma imagem que possa guardar ou compartilhar fora do Memora. A exportação deve representar o documento e o template selecionado, sem exigir publicação ou renderização no servidor.

## Pré-condições

- O draft local existe e passa pela validação estrita de `CompositionDocument` v1.
- O template e a versão referenciados existem no catálogo imutável.
- Todos os slots requeridos pelo template têm um `assetId` associado a uma fotografia `READY` acessível.
- A fotografia usada no canvas pode ser carregada com CORS autorizado pelo host MinIO e não requer resolução de exportação maior que a resolução decodificada disponível.
- Formato e dimensão alvo estão declarados pelo template.

## Requisitos rastreáveis

- **MEM-007-R01:** “Exportar” é uma ação local, separada de publicar. Ela não cria nem altera mural, composição, draft, fotos ou seus bytes originais.
- **MEM-007-R02:** somente draft válido, template suportado e composição completa exportam. Draft ausente/incompatível, slot vazio, asset indisponível, fotografia que falha ao decodificar ou formato não suportado produzem erro recuperável e nenhum download parcial.
- **MEM-007-R03:** um renderer Canvas 2D determinístico monta o fundo `#F8F5EE`, decorações e slots do template na ordem de `layerOrder`, usando geometria normalizada multiplicada pelas dimensões de exportação e aplicando `cropMode` (`cover` ou `contain`). A composição exportada não inclui controles, placeholders, diálogos ou mensagens da interface.
- **MEM-007-R04:** o arquivo usa as dimensões `template.export.width` e `template.export.height` do catálogo, limitadas neste catálogo v1 a no máximo 1800 px por lado e 2.560.000 pixels por imagem. O renderer rejeita definições fora desse envelope; a feature não aumenta a resolução declarada pelo template.
- **MEM-007-R05:** não ampliar fotografia além da resolução de pixels que ela oferece para o slot e modo de corte. Se o tamanho decodificado não sustenta as dimensões alvo do slot, bloquear a exportação e indicar quais slots precisam de fotografia com resolução maior; não apresentar uma imagem ampliada como ganho de qualidade.
- **MEM-007-R06:** oferecer os formatos que o template declara, hoje PNG e JPEG. PNG é lossless e não usa configuração de qualidade. JPEG usa `template.export.jpegQuality` como valor inicial; a pessoa pode ajustar o parâmetro normalizado entre `0` e `1`, sem promessa de tamanho de arquivo ou qualidade visual idêntica entre navegadores.
- **MEM-007-R07:** renovar a lista de fotos por `PhotoGateway` antes de exportar para resolver URLs temporárias atuais e confirmar que os assets ainda estão `READY`. URLs assinadas existem apenas em memória durante a tarefa e nunca entram no draft, no nome do arquivo, nos logs ou em analytics.
- **MEM-007-R08:** a UI informa as fases de preparação/carregamento, renderização, codificação e conclusão; progresso numérico só é exibido no carregamento quando a contagem é conhecida. O usuário pode cancelar. `AbortSignal` é verificado entre etapas e após a codificação; se `toBlob` já começou e o browser não puder interrompê-lo, descartar o resultado ao concluir, sem iniciar download.
- **MEM-007-R09:** falha de CORS, canvas contaminado, `toBlob` nulo, MIME de saída divergente, quota de canvas/memória, interrupção ou erro de rede termina em estado de erro/cancelado, com ação recuperável e sem download silencioso/fallback de formato.
- **MEM-007-R10:** a renderização, codificação e download ocorrem no browser. São permitidas as chamadas existentes para `PhotoGateway.listPhotos()` e GET das URLs temporárias do MinIO; não é chamada API de composição/publicação nem há upload do resultado. O Blob/URL de download é transitório e liberado após uso.
- **MEM-007-R11:** a ação e os controles de formato/qualidade têm rótulos, foco visível, alvo mínimo de 44×44 CSS px, anúncio acessível de estado/erro e funcionam em layout móvel e desktop.
- **MEM-007-R12:** um E2E executável em Chrome desktop valida o fluxo real de fixture → API de upload → MinIO privado → `/templates`/editor → exportação. O teste não substitui API, URL assinada, MinIO, renderer Canvas 2D ou codificação do browser por mocks/intercepts.

## Invariantes

1. Exportar nunca publica nem compartilha um mural.
2. O arquivo visual decorre do mesmo template versionado, documento e assets que alimentam a prévia; para os mesmos pixels de origem e opções, geometrias e camadas são iguais. Codificação binária pode variar entre navegadores.
3. Drafts locais continuam contendo somente documento e timestamps: sem Blob, URL assinada, token ou credencial.
4. Falha ou cancelamento não altera a composição salva e não deixa link de Blob reutilizável na interface.
5. O resultado respeita o formato e dimensões efetivamente retornados; a aplicação não renomeia silenciosamente PNG como JPEG nem declara pixel count maior que o catálogo.

## Estados da ação

`IDLE → PREPARING → LOADING_PHOTOS → RENDERING → ENCODING → READY → DOWNLOADING → COMPLETE`; `PREPARING`, `LOADING_PHOTOS`, `RENDERING` ou `ENCODING` podem terminar em `CANCELLED` ou `ERROR`. `COMPLETE`, `CANCELLED` e `ERROR` retornam a `IDLE` após uma nova tentativa explícita.

## Erros e privacidade

- Composição incompleta/inválida: indicar slots que precisam de foto; nenhuma imagem é baixada.
- URL assinada expirada: identificar o slot e oferecer atualizar a prévia; asset removido/indisponível ou falha de decodificação: identificar o slot e oferecer substituir a foto. Não limpar referência no draft.
- Resolução insuficiente: identificar slot e pedir uma versão de maior resolução; não reduzir dimensões sem informar, recortar silenciosamente ou ampliar o arquivo.
- CORS/tainted canvas, falha de codificação ou falta de memória: mostrar mensagem local e opção de tentar novamente; não usar fallback que enfraqueça o contrato de privacidade.
- Cancelamento: não iniciar download e descartar qualquer Blob criado depois do pedido de cancelamento.
- Nenhuma fotografia, URL assinada ou conteúdo da composição é enviado para analytics/logs. A imagem final é gerada no browser e não é persistida automaticamente.

## Fora de escopo

Editar crop/transform, texto, molduras escolhidas pelo usuário, undo/redo, mudar dimensões do template, exportar para PDF, publicar mural, sincronizar composição com backend, compartilhar link, exportação em lote, persistir resultado no IndexedDB e suportar formatos além de PNG/JPEG.

## Critérios observáveis

1. Uma composição completa pode baixar arquivo PNG ou JPEG renderizado com template, fundo, decoração, slots e ordem corretos.
2. Exportação usa resolução versionada do template e não amplia fonte insuficiente.
3. Alterar formato/qualidade altera as opções de codificação sem alterar o draft.
4. Draft incompleto, foto indisponível, CORS/tainted canvas ou falha de codificação nunca entrega download parcial ou de formato errado.
5. Cancelar em qualquer etapa não inicia download, inclusive quando a codificação não puder ser interrompida imediatamente.
6. O rascunho no IndexedDB não ganha Blob, URL temporária ou dado de sessão após exportar.
7. A operação apresenta estados acessíveis, mensagens recuperáveis e controles responsivos.
8. O cenário E2E MEM-007-AC16 envia fixture real pelo fluxo da API e URL assinada do Compose, abre o editor no Chrome desktop e comprova MIME pelo cabeçalho binário, dimensões e pixels do arquivo baixado; a mesma execução valida CORS ao carregar a imagem real do MinIO.

## Decisões abertas para revisão

- Validar nos browsers-alvo se os objetos privados do MinIO enviam CORS suficiente para Canvas 2D; a suíte Compose atual deve servir de ambiente de integração, sem relaxar acesso ao bucket.
- Validar exportação e pressão de memória no Safari iOS e Chrome Android antes de afirmar compatibilidade. O envelope numérico reflete o catálogo atual, não um benchmark de dispositivo.
- Revisar se qualidade JPEG deve ser controle contínuo ou valores predefinidos na UI; o contrato inicial expõe um número normalizado e default `0.92` do catálogo.

## Evidência de navegador

- **Executado:** Chrome desktop controlado por Playwright contra frontend, backend, PostgreSQL e MinIO reais iniciados via Compose. Resultado, browser e verificações estão registrados em `evidence.md`.
- **Ainda não verificado:** Safari iOS físico e Chrome Android físico. Não declarar compatibilidade nesses dispositivos antes de executar os fluxos e registrar os resultados.
- Especificação e fixture determinística não contam como execução nem evidência de compatibilidade.
