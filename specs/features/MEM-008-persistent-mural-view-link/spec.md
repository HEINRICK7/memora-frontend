# MEM-008 — Mural persistente com publicação e link de visualização

**Estado:** rascunho para revisão do juiz. O contrato backend MEM-008 está proposto, mas ainda não aprovado; implementação e testes de integração permanecem bloqueados.
**Fontes:** ../../../FRONTEND_SPEC.md, ../../../BRAND_SYSTEM.md, ../../../../memora-backend/BACKEND_SPEC.md, ../../../../SDD_TDD_PROTOCOL.md, ../MEM-005-local-composition-editor/spec.md, ../MEM-007-local-composition-export/spec.md e draft backend specs/features/MEM-008-persistent-mural-view-link/.

## Problema e usuário

MEM-005 e MEM-007 deixam a composição e o download no navegador. MVP1 ainda precisa transformar fotografias guardadas em um mural persistente, permitir que seu proprietário o publique e entregar um link explicitamente somente para visualização.

O proprietário precisa encontrar e continuar seus murais em outro acesso autenticado. Um convidado sem login precisa ver, pelo link válido, somente o mural publicado e suas fotos autorizadas.

## Escopo proposto

- Criar, listar, abrir e editar metadados de mural DRAFT com os endpoints privados de MEM-002/MEM-004 e a extensão proposta em MEM-008.
- Selecionar ativos READY do proprietário e associá-los ao mural, mantendo ordem e concorrência conforme MEM-006.
- Permitir escolher/limpar a capa por coverPhotoId no PATCH. A primeira associação em mural vazio define a capa; remover a foto de capa seleciona a primeira READY restante por posição ou null. Limpeza explícita por PATCH permanece null.
- Exigir publicação explícita com pelo menos uma foto READY, If-Match atual e Idempotency-Key. Publicar não cria grant automaticamente.
- Criar, listar e revogar grants VIEW; a URL é entregue somente na primeira resposta de criação. Um replay retorna metadados sem segredo; a UI permite revogar o grant e criar outro com nova chave.
- Após grant inicial, oferecer “Copiar link” usando exatamente a shareUrl retornada pelo backend e “Compartilhar” via Web Share quando disponível, com fallback acessível para copiar. Fora da clipboard na ação explícita da pessoa, a URL/token não é persistida nem registrada em logs.
- Disponibilizar /murais/[muralId]/compartilhar para listar grants, revogar com confirmação e criar novo link. A confirmação explica que novas resoluções serão bloqueadas, mas URL MinIO já emitida pode continuar válida até 60 segundos.
- Gestão básica de grants VIEW (criar, listar e revogar) faz parte do MVP1; contribuição, gestão de papéis e controles avançados de links continuam na Fase 2.
- Abrir /m/[shareToken] sem login. A página anônima mostra somente os campos retornados pelo contrato shared e não edita, contribui ou modera.
- A página anônima apresenta cabeçalho, capa, título, descrição, contagem das fotos autorizadas e galeria responsiva. Lightbox acessível permite abrir/fechar e ir para foto anterior/próxima por teclado e toque em celular e desktop.
- O contrato de preview shared entrega somente variante privada sanitizada: EXIF/GPS e outros metadados sensíveis são removidos e a orientação visual é preservada. A imagem original nunca é usada como fallback, URL ou objeto shared; indisponibilidade da variante falha fechada.
- Renovar URLs temporárias por novo GET antes/depois do prazo informado, sem persistir URLs assinadas.
- Tratar Mural como coleção persistente. CompositionDocument de MEM-005 continua local e exportável por MEM-007; este slice não persiste composição nem afirma que a galeria convidada reproduz template local.

## Pré-condições e dependências

- O proprietário possui principal autenticado resolvido pelo backend; ownerId nunca vem do cliente. A autenticação de produção segue pendente de ADR.
- O backend atende aos contratos MEM-002, MEM-004 e MEM-006 integrados e aprova/implementa o draft MEM-008 com OpenAPI e integração real. O draft MEM-008 de backend ainda está pendente de revisão do juiz; os detalhes abaixo são proposta para harmonização, não contrato aprovado.
- Os endpoints propostos são PATCH coverPhotoId, publish, grants e shared GET conforme contracts.md; não inventar outros endpoints ou adaptar cliente antes de aprovação.
- A evidência local futura usa Compose, PostgreSQL, API e MinIO reais. URL assinada é capability bearer: revogar bloqueia novas resoluções, mas URL MinIO já emitida pode funcionar por até o TTL restante (máximo 60 segundos).

## Requisitos rastreáveis

- **MEM-008-FE-R01:** criar mural DRAFT com título obrigatório e descrição opcional pela API persistente. Idempotency-Key UUID estável durante retry ambíguo evita cópias silenciosas.
- **MEM-008-FE-R02:** listar e abrir murais do proprietário por status. Reload restaura dados do servidor, não IndexedDB da composição.
- **MEM-008-FE-R03:** editar título, descrição e coverPhotoId somente em DRAFT, usando ETag forte/If-Match. Campo de capa omitido preserva valor; null limpa explicitamente.
- **MEM-008-FE-R04:** associar somente ativos READY do proprietário, sem duplicidade. A primeira associação em coleção vazia define a capa; separar ordem do mural da ordem/reuso dos slots locais.
- **MEM-008-FE-R05:** associação, ordem, remoção e edição respeitam versão. Em conflito, reler mural/coleção e preservar seleção local para resolução explícita; sem retry cego.
- **MEM-008-FE-R06:** publicar é ação explícita. O servidor exige ao menos um vínculo e que todos os ativos estejam READY/do proprietário, e exige If-Match + Idempotency-Key. Retry igual não cria nova versão. A publicação não cria grant.
- **MEM-008-FE-R07:** somente após PUBLISHED, proprietário pode criar grant VIEW. Primeira resposta contém shareUrl; replay da mesma chave/payload retorna metadados com shareUrl null e tokenReturned false. A UI não constrói nem armazena token.
- **MEM-008-FE-R08:** listar grants sem segredo, revogar qualquer grant listado sem precisar do token, e criar novo grant com chave nova após revogação. Revogação bloqueia novas resoluções; URL MinIO emitida anteriormente pode durar até 60 segundos.
- **MEM-008-FE-R09:** rota /m/[shareToken] chama somente shared GET anônimo e exibe dados e fotos autorizadas. Convidado VIEW não edita, contribui nem modera.
- **MEM-008-FE-R10:** estados públicos distinguem códigos seguros: token inválido/malformado 404 shared_link_unavailable; expirado 410 shared_link_expired; revogado 410 shared_link_revoked; 404 shared_mural_unavailable mapeia ao estado de interface MURAL_REMOVED definido no FRONTEND_SPEC. Nenhum estado de erro expõe título, owner, UUID ou fotos.
- **MEM-008-FE-R11:** share token e URLs assinadas não vão para logs, analytics, armazenamento durável ou Referer. Respostas usam private, no-store; página pública usa noindex/nofollow/noarchive e no-referrer.
- **MEM-008-FE-R12:** publicação e VIEW não habilitam contribuição, upload ou moderação. CONTRIBUTE fica fora do slice.
- **MEM-008-FE-R13:** CompositionDocument permanece local. Capa é metadata de mural exposta por MuralSummary/PATCH do draft backend; sem endpoint de composição.
- **MEM-008-FE-R14:** E2E futuro percorre API real, PostgreSQL, MinIO e navegador após contratos aprovados; verifica publicação sem grant implícito, segredo de criação/replay, códigos seguros, renewal de URL e limites de revogação.
- **MEM-008-FE-R15:** após primeira criação de grant, “Copiar link” copia a shareUrl exata da resposta do backend; “Compartilhar” usa Web Share quando disponível e oferece fallback acessível para copiar. Fora da clipboard na ação explícita da pessoa, a URL/token não é persistida nem logada.
- **MEM-008-FE-R16:** /murais/[muralId]/compartilhar lista grants sem segredo, permite revogar e criar outro grant; revogação exige confirmação com explicação de que nova resolução para, mas URLs MinIO previamente emitidas podem funcionar por até 60 segundos.
- **MEM-008-FE-R17:** /m/[shareToken] mostra cabeçalho, capa, título, descrição, contagem das fotos autorizadas e grid responsivo; lightbox acessível abre/fecha e navega anterior/próxima via teclado e toque em celular/desktop.
- **MEM-008-FE-R18:** antes de alegar compatibilidade móvel/share, testar em Safari iOS e Chrome Android em aparelhos físicos o compartilhamento Web Share/fallback, viewport, teclado, toque e lightbox; registrar navegador, dispositivo e data em evidence.md. Até esses testes ocorrerem, cada plataforma fica explicitamente não verificada. Este gate restringe claims de compatibilidade, não implementação nem E2E Chrome desktop.
- **MEM-008-FE-R19:** telas de configuração, gestão de link e mural convidado seguem BRAND_SYSTEM: contrastes WCAG AA (4.5:1 texto normal, 3:1 texto grande), foco visível, estados que não dependem só de cor e respeito a prefers-reduced-motion, sem flashes intensos.
- **MEM-008-FE-R20:** previews servidos ao convidado são variantes privadas sanitizadas sem EXIF/GPS ou outros metadados sensíveis; orientação permanece visualmente correta. O original continua privado e nunca é retornado, referenciado ou usado como fallback pelo fluxo shared. O backend define a variante privada `SHARE_VIEW`: o shared GET retorna `previewUrl` e metadados dessa variante, nunca a chave interna `share_view_storage_key`. A transformação aplica orientação, remove GPS/EXIF/XMP, limita o maior lado a 2560 px sem upscaling e mantém proporção. Não há endpoint adicional para o derivado.

## Invariantes

1. Mural é coleção persistente ordenada com metadata e política de acesso; Composition é arranjo visual local/exportável.
2. Só principal autenticado do proprietário altera mural; IDs UUID e URLs não são credenciais.
3. DRAFT não é visível por grant. Publicação exige uma ou mais fotos associadas READY e pertencentes ao owner.
4. A capa, se definida, é uma foto READY associada ao próprio mural. Seleção/limpeza usa PATCH; primeira associação e remoção da capa seguem as regras de MEM-008.
5. Publicar não cria grant. Grant nesta fase sempre tem scope VIEW.
6. Lista/replay de grants nunca recupera shareUrl/token. Segredo só é apresentado na primeira resposta da criação correspondente.
7. Cada URL de mídia é privada no MinIO e temporária, TTL de no máximo 60 segundos e nunca além da expiração do grant. Novo shared GET pode renovar URLs.
8. Revogação bloqueia novas resoluções; não promete invalidar URL assinada já emitida nem bytes baixados/cacheados.
9. Erros públicos não revelam metadata do mural. Falha de rede/conflito não descarta seleção ainda não confirmada.

## Estados principais

- **Proprietário:** DRAFT_LOCAL_SELECTION → CREATING_DRAFT → DRAFT_SAVING_PHOTOS → DRAFT_READY → PUBLISHING → PUBLISHED → CREATING_VIEW_GRANT → LINK_READY. Replay de criação sem segredo mostra metadados existentes e permite revogar/criar outro grant com nova chave.
- **Gestão de links:** /murals/[muralId]/compartilhar mostra metadados/status de grants, ações de copiar/compartilhar para URL recém-retornada e confirmação antes de revogar. Não mostra segredo recuperado da listagem/replay.
- **Convidado anônimo:** LOADING → VIEW_READY (cabeçalho/galeria/lightbox), LINK_INVALID (404 shared_link_unavailable), LINK_EXPIRED (410 shared_link_expired), LINK_REVOKED (410 shared_link_revoked), ou MURAL_REMOVED (404 shared_mural_unavailable). MURAL_REMOVED usa cópia segura sem título, owner, UUID ou fotos. Em todos os erros, nenhum conteúdo/preview do mural aparece.
- **Preview:** PREVIEW_READY → REFRESHING_PREVIEWS ao aproximar/atingir previewExpiresAt → VIEW_READY ou erro seguro. Renovação usa novo shared GET; URL anterior pode continuar válida até seu TTL residual.

## Erros e privacidade

- Owner 401/404/409/422/428 seguem Problem Details aprovado; não enviar ownerId. Em conflito, reler estado e pedir resolução quando necessário.
- Erros públicos usam os códigos/status seguros de MEM-008-FE-R10. 404 shared_mural_unavailable mapeia ao estado de interface MURAL_REMOVED, com mensagem genérica sem título, owner, UUID, capa ou fotos. 404 shared_link_unavailable e 410 expirado/revogado também não exibem metadata privada.
- 503 ou falha de rede conserva estado confirmado, evita conteúdo parcial e oferece retry seguro. Publish e grant usam chaves idempotentes estáveis por intenção.
- Owner/shared responses usam Cache-Control: private, no-store. Shared response também usa X-Robots-Tag: noindex, nofollow, noarchive e Referrer-Policy: no-referrer.
- Nunca gravar shareUrl, token, previewUrl, X-Amz-Signature, conteúdo de foto ou URLs de MinIO em logs, analytics, IndexedDB ou mensagens.
- Na revogação, comunicar que novas resoluções foram bloqueadas; não afirmar que uma URL assinada já entregue expirou imediatamente.

## Fora de escopo

CONTRIBUTE, upload/moderação por convidado, Google Fotos, câmera/AR, persistência da composição, compartilhar sem grant, excluir ativos e autenticação/OIDC de produção até ADR próprio.

## Critérios observáveis

1. Mural criado aparece em /meus-murais após navegação/reload por dados backend.
2. Fotos READY são associadas/ordenadas sem duplicidade; capa inicial/remoção refletem as regras de MEM-008-FE-R04.
3. Publicação exige confirmação, ao menos uma foto READY, If-Match e Idempotency-Key, e não cria grant.
4. Primeira criação VIEW mostra a shareUrl uma vez; replay não recupera segredo; UI oferece revogar e criar outro.
5. Copiar link usa byte a byte a shareUrl retornada pelo backend; compartilhar usa Web Share se disponível e fallback acessível de cópia quando não estiver.
6. Rota de gestão lista/revoga grants e a confirmação explica o bloqueio de novas resoluções e a validade residual máxima de 60s das URLs já emitidas.
7. Link anônimo válido mostra header, capa, título, descrição, contagem e fotos autorizadas; grid responde a celular/desktop; lightbox opera por teclado e toque.
8. Nova consulta renova URLs; erros públicos não expõem conteúdo.
9. Revogar bloqueia nova resolução e a UI reconhece até 60s de validade residual possível para URLs já emitidas.
10. E2E, RED de integração e implementação ficam bloqueados até aprovação do draft backend e OpenAPI versionada.
11. Safari iOS e Chrome Android físicos permanecem “não verificados” até completar MEM-008-FE-AC19; implementação e E2E Chrome desktop podem avançar. Não alegar compatibilidade móvel antes da evidência registrada em evidence.md.
12. Telas cobertas por MEM-008 usam tokens aprovados e verificam contraste WCAG AA, foco visível e movimento reduzido conforme MEM-008-FE-R19.
13. Fixture real com EXIF/GPS e orientação conhecida é lida pela API/MinIO no contexto shared como variante sanitizada: metadados não aparecem nos bytes compartilhados, pixels mantêm a orientação esperada e nenhum caminho shared retorna ou substitui pela imagem original.

## Decisões abertas para revisão

- Aprovar ou ajustar o draft backend MEM-008 e versionar OpenAPI antes de frontend RED/API.
- ADR de autenticação e sessão de proprietário em produção.
- Confirmar rate limiting e demais gates antes de habilitar links públicos em produção.
- Decidir quando CompositionDocument será persistido. Este slice não o envia à API.
