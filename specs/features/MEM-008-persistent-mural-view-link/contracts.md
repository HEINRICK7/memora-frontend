# MEM-008 — Contratos do mural persistente e link VIEW (rascunho)

**Estado:** draft frontend alinhado ao draft backend MEM-008 para revisão do juiz. Os detalhes abaixo são proposta de contrato; este documento não aprova schema nem autoriza implementar chamadas. Nenhum endpoint é inventado além das rotas propostas pelo backend.

**Fontes de contrato:** MEM-002, MEM-004, MEM-006 e ../memora-backend/specs/features/MEM-008-persistent-mural-view-link/contracts.md. A referência backend está em revisão e pode mudar.

## Rastreabilidade frontend/backend

Os IDs locais FE são prefixados com `MEM-008-FE-` e os IDs backend com `MEM-008-BE-`. A tabela abaixo fecha o crosswalk entre UI/E2E, contratos e critérios BE; itens sem endpoint são explicitamente FE-only.

| IDs FE | IDs backend / outras features | Correspondência de contrato e escopo sem endpoint |
|---|---|---|
| MEM-008-FE-R01–MEM-008-FE-R02 / MEM-008-FE-AC01–MEM-008-FE-AC02, MEM-008-FE-AC13 | MEM-002-API-01/02/03; MEM-008-BE-API-01; MEM-008-BE-R20 / MEM-008-BE-ADR08 | Criar/listar/obter continuam MEM-002; BE-API-01 estende MuralSummary. AC13 usa principal local MEM-002; não cria endpoint de autenticação, produção segue bloqueada até decisão de identidade no ADR-08. |
| MEM-008-FE-R03 / MEM-008-FE-AC03, MEM-008-FE-AC20 | MEM-008-BE-API-01/02, MEM-008-BE-AC05–MEM-008-BE-AC06; MEM-008-BE-API-03, MEM-008-BE-AC01–MEM-008-BE-AC04 | PATCH metadata/capa e resumo; configuração/publicação passam por BE-API-03. FE-UI-05 é fluxo de confirmação e não adiciona endpoint. |
| MEM-008-FE-R04–MEM-008-FE-R05 / MEM-008-FE-AC04–MEM-008-FE-AC05 | MEM-006-API-02/03/04; MEM-006-AC21/AC22; MEM-008-BE-R05–MEM-008-BE-R06, MEM-008-BE-AC07, MEM-008-BE-AC23–MEM-008-BE-AC24 | Associação/ordem/detach são MEM-006; BE define capa inicial, fallback e integridade de migration. Preservar seleção/retry é estado de UI sem endpoint adicional. |
| MEM-008-FE-R06 / MEM-008-FE-AC06, MEM-008-FE-AC20 | MEM-008-BE-R23, MEM-008-BE-API-03, MEM-008-BE-AC01–MEM-008-BE-AC04, MEM-008-BE-AC27–MEM-008-BE-AC28 | Publish explícito, idempotente, com geração SHARE_VIEW legada antes da transação final; falha mantém DRAFT sem grant. FE-UI-05/AC20 confirma o mesmo publish. |
| MEM-008-FE-R07 / MEM-008-FE-AC07 | MEM-008-BE-R08–MEM-008-BE-R10, MEM-008-BE-API-04, MEM-008-BE-AC09–MEM-008-BE-AC12, MEM-008-BE-ADR04/MEM-008-BE-ADR07 | Criar/replay grant VIEW; shareUrl aparece uma vez, token é hash-only. CONTRIBUTE não tem rota neste slice. |
| MEM-008-FE-R08, MEM-008-FE-R15–MEM-008-FE-R16 / MEM-008-FE-AC08, MEM-008-FE-AC15–MEM-008-FE-AC17 | MEM-008-BE-R11–MEM-008-BE-R12, MEM-008-BE-API-04–MEM-008-BE-API-06, MEM-008-BE-AC13–MEM-008-BE-AC15, MEM-008-BE-AC20 | Listar/revogar/criar outro grant usa APIs BE-04–06. Copiar/compartilhar é UI-only (FE-UI-01/AC16), sem endpoint BE; usa a shareUrl one-time de BE-API-04 e decisão BE-ADR-04. |
| MEM-008-FE-R09–MEM-008-FE-R11, MEM-008-FE-R13, MEM-008-FE-R17 / MEM-008-FE-AC09–MEM-008-FE-AC10, MEM-008-FE-AC12, MEM-008-FE-AC18 | MEM-008-BE-R13–MEM-008-BE-R17, MEM-008-BE-R21–MEM-008-BE-R22, MEM-008-BE-API-07, MEM-008-BE-AC16–MEM-008-BE-AC20, MEM-008-BE-AC22, MEM-008-BE-AC25–MEM-008-BE-AC29 | Shared GET autoriza conteúdo/URLs, códigos seguros, logging, no-store e SHARE_VIEW. Composition está fora por BE-R03/BE-ADR-02; galeria/lightbox e layout são FE-only sem endpoint, usando o payload BE-API-07. |
| MEM-008-FE-R12 / MEM-008-FE-AC11 | MEM-008-BE-R08, MEM-008-BE-R13, MEM-008-BE-API-04/07, MEM-008-BE-AC09, MEM-008-BE-AC16 | Scope VIEW limita leitura; não existe contrato BE de mutação para convidado. A UI não oferece escrita nem envia request de contribuição. |
| MEM-008-FE-R14 / MEM-008-FE-AC14, MEM-008-FE-AC16–MEM-008-FE-AC18, MEM-008-FE-AC20 | MEM-008-BE-API-01–MEM-008-BE-API-07; MEM-008-BE-AC01–MEM-008-BE-AC29; MEM-001-AC11–AC14; MEM-006-AC20–AC22 | E2E Compose FE compõe criação/resumo, PATCH/capa, attach/detach, publish, grant, shared GET, headers MinIO, EXIF e revogação. Não é endpoint próprio; cada etapa valida o contrato/API e AC backend citado. |
| MEM-008-FE-R18 / MEM-008-FE-AC19 | Sem requisito/end-point backend correspondente | Gate FE-only para claims de compatibilidade física Safari iOS/Chrome Android. Backend fornece APIs/URLs usadas, mas não pode atestar aparelhos, teclado, toque ou Web Share nativo. |
| MEM-008-FE-R19 / MEM-008-FE-AC21 | Sem requisito/end-point backend correspondente | BRAND_SYSTEM, contraste, foco, reduced motion e interação visual são FE-only; nenhum endpoint ou requisito backend é necessário. |
| MEM-008-FE-R20 / MEM-008-FE-AC14, MEM-008-FE-AC22 | MEM-008-BE-R21–MEM-008-BE-R23, MEM-008-BE-API-03/07, MEM-008-BE-AC25–MEM-008-BE-AC29, MEM-001-AC12/AC13 | Shared preview usa exclusivamente SHARE_VIEW sanitizada; original nunca é URL/objeto/fallback. E2E confirma bytes/EXIF/orientação, dimensionamento, cache e falha fechada. |

## Regras comuns propostas

- Base /api/v1. Owner é derivado pelo backend; nunca enviar ownerId. Owner routes exigem principal autenticado, mas mecanismo de identidade de produção depende de decisão registrada em ADR antes de lançamento.
- Mutação de conteúdo mural usa ETag forte If-Match: "{version}". Respostas owner/shared usam Cache-Control: private, no-store.
- Problem Details seguem codes e status do draft backend; mensagens não incluem tokens, identidade/metadata privada nem detalhes de exceção externa.
- Não logar token, shareUrl, X-Amz-Signature, URL MinIO, storage_key ou conteúdo de imagem. Para shared path, logs/traces usam rota template, não o token.
- A especificação backend MEM-008 e suas rotas permanecem draft até aprovação do juiz e publicação de OpenAPI versionada.

## MEM-008-FE-API-01 — Criar/listar/obter mural (MEM-002)

- POST /api/v1/murals recebe Idempotency-Key: UUID, título e descrição opcional conforme MEM-002; sucesso 201 retorna MuralSummary.
- GET /api/v1/murals lista somente murals do principal; GET /api/v1/murals/{muralId} retorna MuralSummary e ETag forte.
- Respostas privadas não são cacheadas; recurso alheio/ausente não revela ownership.
- MuralSummary em MEM-008 draft inclui coverPhotoId: UUID | null e publishedAt: RFC 3339 UTC | null. DRAFT tem publishedAt null; após publicação persiste timestamp. GET não presigna imagem.

## MEM-008-FE-API-02 — Editar metadata/capa (MEM-004 + proposta MEM-008)

PATCH /api/v1/murals/{muralId} recebe If-Match: "{version}" e pelo menos um campo entre title, description, coverPhotoId.

- Campos omitidos permanecem inalterados; description: null limpa descrição.
- coverPhotoId: UUID seleciona capa READY já associada ao mesmo mural. UUID ausente/alheio/não associado resulta 404 resource_not_found; foto associada mas não READY resulta 409 photo_not_ready.
- coverPhotoId: null limpa a capa e mantém null; PATCH não escolhe substituta automaticamente.
- Somente DRAFT próprio pode ser editado. Alteração efetiva retorna 200 com MuralSummary e novo ETag; repetir o mesmo valor é no-op e preserva versão/timestamp.
- O contrato MEM-004 foi aditivado pelo draft backend MEM-008 e seu OpenAPI versionado; não tratar implementação como disponível antes da aprovação e entrega do backend.

## MEM-008-FE-API-03 — Fotos ordenadas e efeito na capa (MEM-006 + extensão proposta)

Rotas existentes no draft MEM-006: GET/POST /api/v1/murals/{muralId}/photos, PUT /api/v1/murals/{muralId}/photos/order e DELETE /api/v1/murals/{muralId}/photos/{photoId}. Usam If-Match conforme MEM-006.

- Primeira associação a coleção vazia escolhe a foto como coverPhotoId no mesmo commit e avança versão uma única vez.
- Ao remover a foto de capa, backend aponta capa à primeira foto READY restante por posição ou null se coleção ficar vazia; vínculo/capa/ordem são atualizados atomicamente.
- PATCH explícito coverPhotoId: null não inicia fallback. UI deve refletir resposta de MuralSummary em vez de derivar/forçar capa local.
- Cada GET de objeto MinIO por URL presigned de foto privada deve responder Cache-Control: private, no-store via override do presigner, inclusive para URL obtida por fluxo owner/MEM-006.
- A integração MEM-006 está sujeita à aprovação/integração de sua branch; não tratar working tree remoto como release confirmada.

## MEM-008-FE-API-04 — Publicação explícita (rota proposta backend)

POST /api/v1/murals/{muralId}/publish, sem body, com If-Match forte atual e Idempotency-Key: UUID.

- Pré-condições propostas: mural DRAFT próprio; pelo menos um vínculo; todas as fotos associadas READY e do owner; capa opcional, se definida também válida. Publish não adiciona grant nem emite shareUrl.
- Sucesso proposto: 200, MuralSummary status PUBLISHED com publishedAt, ETag atualizado e Cache-Control: private, no-store.
- Mesmo owner/mural/chave repetida retorna representação publicada sem nova versão e Idempotency-Replayed: true, mesmo se If-Match enviado já ficou antigo. Mesma chave em outro mural recebe 409 idempotency_conflict.
- Erros propostos: mural sem fotos 409 publication_requires_photos; foto própria não READY 409 photo_not_ready; associação inconsistente de owner 409 mural_not_publishable; chave ausente/malformada 400; conflito de estado/versão 409; falta If-Match 428.
- Os códigos/status são os definidos por `MEM-008-BE-API-03` no OpenAPI backend versionado; implementar somente após aprovação desse contrato.

## MEM-008-FE-API-05 — Grants VIEW (rotas propostas backend)

### Criar

POST /api/v1/murals/{muralId}/grants, Idempotency-Key: UUID, body { "scope": "VIEW", "expiresAt": null | RFC3339 }. expiresAt é obrigatório no schema; null significa sem expiração. CONTRIBUTE não é aceito nesta feature.

- Mural precisa ser PUBLISHED e do owner.
- Primeira criação retorna 201 com metadados e shareUrl opaca, tokenReturned: true. Essa é a única resposta que revela a URL ao cliente.
- Replay do mesmo mural/chave/payload retorna 200, Idempotency-Replayed: true, mesmos metadados, shareUrl: null, tokenReturned: false. Não tentar buscar segredo na listagem; UI permite revogar o grant listado e criar outro com chave nova.
- Mesma chave com payload diferente retorna 409 idempotency_conflict. Uma expiração configurada limita URL de imagem ao prazo residual do grant.

### Listar e revogar

- GET /api/v1/murals/{muralId}/grants retorna metadados/status paginados; schema não inclui shareUrl, token, hash, owner, storage key ou preview URL.
- DELETE /api/v1/murals/{muralId}/grants/{grantId} retorna 204 e é idempotente. O owner pode revogar sem conhecer token. Não incrementa versão do mural.
- Após revogação, novas resoluções do token são negadas imediatamente. URLs MinIO já emitidas podem funcionar até expirar, no máximo 60 segundos ou até o restante da expiração do grant, o que ocorrer primeiro.

## MEM-008-FE-API-06 — Leitura shared anônima e URLs temporárias (rota proposta backend)

GET /api/v1/shared/{shareToken} é sem autenticação; token é capability da rota.

- Resposta válida 200 contém apenas título, descrição, coverPhotoId, fotos ordenadas autorizadas, URLs temporárias e permissions.canView: true, canContribute: false. Não retorna ownerId, mural UUID, grant/token/hash, Composition, storage key ou foto de outro mural.
- **Resposta API JSON:** GET shared responde com Cache-Control: private, no-store, X-Robots-Tag: noindex, nofollow, noarchive e Referrer-Policy: no-referrer. Esses headers protegem a resposta API, não substituem os headers da página HTML.
- Cada preview URL MinIO é presigned após autorização, TTL máximo de 60 segundos e nunca além da expiração restante do grant. previewExpiresAt informa prazo efetivo. Um novo GET válido gera URLs renovadas; frontend deve buscar novamente e não manter URL em estado durável.
- **Semântica de privacidade da imagem (MEM-008-FE-R20):** o recurso usado como preview shared deve ser uma variante privada sanitizada, sem EXIF/GPS ou outros metadados sensíveis, com orientação visual preservada. O original nunca é o objeto, URL ou fallback de leitura shared. Se a variante não puder ser produzida/lida, o fluxo falha fechado sem servir o original. O contrato backend draft especifica `SHARE_VIEW` privada, acesso por `previewUrl` compartilhada e `share_view_storage_key` interno nunca serializado; variante tem maior lado ≤2560 px, orientação aplicada, sem GPS/EXIF/XMP e sem fallback ao original.
- **Resposta do objeto MinIO:** GET feito pelo navegador para cada URL assinada deve responder Cache-Control: private, no-store. Backend configura esse header como override do presigner para objetos de foto compartilhados; aplicar também a URLs de foto privada. O teste lê o header HTTP da resposta real do objeto, não apenas query params da URL.
- Presign é tudo ou nada: falha retorna 503 genérico, sem coleção parcial.
- Erros públicos propostos e distintos: token inválido/malformado → 404 shared_link_unavailable; expirado → 410 shared_link_expired; revogado → 410 shared_link_revoked; mural ausente/arquivado/não PUBLISHED → 404 shared_mural_unavailable. O frontend mapeia esse último código ao estado MURAL_REMOVED do FRONTEND_SPEC. Todos ocultam metadata do mural e owner.
- Revogação impede uma nova resolução, mas URL assinada anteriormente pode funcionar até o TTL residual máximo de 60 segundos; bytes baixados/cacheados não podem ser recolhidos pelo frontend.

## MEM-008-FE-API-07 — Composição fora do contrato

BACKEND_SPEC lista uma rota de composition proposta, mas MEM-008 não a chama. Mural publicado continua uma coleção persistente ordenada de fotos. CompositionDocument de MEM-005/007 permanece local/exportável. Capa, ao contrário, está incluída no draft backend via MuralSummary/PATCH e regras de associação/remoção descritas acima.

## MEM-008-FE-SEC-01 — Segredos, headers e estado anônimo

- shareUrl é mostrado somente após primeira criação confirmada e vive em memória transitória de apresentação. Não salvar token/shareUrl em IndexedDB, analytics/logs/traces, mensagens ou storage local.
- URL assinada de mídia fica somente em estado volátil necessário para imagem; nunca serializar/persistir.
- **HTML da página Next /m/[shareToken]:** resposta do documento usa Cache-Control: private, no-store, X-Robots-Tag: noindex, nofollow, noarchive e Referrer-Policy: no-referrer. Configurar no servidor/route da página; headers da API shared não protegem nem definem cache/indexação/referrer do documento HTML.
- **JSON da API shared:** a própria resposta GET /api/v1/shared/{shareToken} usa Cache-Control: private, no-store, X-Robots-Tag: noindex, nofollow, noarchive e Referrer-Policy: no-referrer.
- **Objeto MinIO:** response de cada GET de imagem assinada usa Cache-Control: private, no-store por override do presigner; isso vale para fotos privadas e compartilhadas. Validar o header da resposta MinIO, além da assinatura/expiração da URL.
- A rota do navegador com token não deve passar credenciais em Referer. Os três níveis de resposta são verificados separadamente no E2E real; um header presente em uma camada não satisfaz a outra.
- UI anônima representa estados por status/code do backend sem metadata privada. Nunca autorizar escrita pelo simples conhecimento do token.

## MEM-008-FE-SEC-02 — Variante shared sanitizada (MEM-008-FE-R20, MEM-008-FE-AC14, MEM-008-FE-AC22)

- Resposta e URLs do fluxo shared referem apenas a variante privada sanitizada definida pelo contrato backend draft. A transformação remove EXIF/GPS e outros metadados sensíveis e preserva orientação visual nos pixels.
- O original permanece privado e nunca pode ser servido pelo shared GET, referenciado pela resposta compartilhada ou usado como fallback se a variante sanitizada falhar/estiver ausente.
- A prova E2E usa imagem de fixture criada pela API contendo GPS/EXIF e orientação conhecida; inspeciona os bytes efetivamente baixados do MinIO, o resultado visual decodificado e a ausência de caminho shared para o original. O payload não expõe a chave interna `share_view_storage_key`; a API retorna apenas `previewUrl` e metadados da variante (maior lado ≤2560 px).

## MEM-008-FE-UI-01 — Copiar e compartilhar link (MEM-008-FE-R15, MEM-008-FE-AC07, MEM-008-FE-AC16)

- A ação “Copiar link” usa byte a byte a shareUrl absoluta recebida na primeira resposta de criação do grant. Não derivar URL de window.location, host, muralId ou token.
- “Compartilhar” usa Web Share API quando disponível, passando a mesma shareUrl. Se indisponível ou não utilizável, fornece caminho acessível de cópia com rótulo/feedback anunciado e manejo de erro.
- Compartilhar/copy não grava shareUrl/token em storage da aplicação nem o envia a analytics/logs. A única cópia persistente intencional é a clipboard acionada pela própria pessoa. Se replay retorna shareUrl null/tokenReturned false, UI não mostra cópia de segredo inexistente; proprietário pode revogar pela lista e emitir outro grant.
- E2E compara clipboard com shareUrl observada na resposta real da API. Desktop Chrome valida cópia/fallback; quando navigator.share estiver disponível, valida o URL entregue à API do browser sem afirmar que o diálogo nativo foi fisicamente aceito.

## MEM-008-FE-UI-02 — Gestão de grants pelo proprietário (MEM-008-FE-R16, MEM-008-FE-AC08, MEM-008-FE-AC17)

- A rota existente em FRONTEND_SPEC é /murais/[muralId]/compartilhar. Gestão básica de grants VIEW (criar/listar/revogar) é MVP1; contribuição, escolha de papéis e gestão avançada ficam na Fase 2. Usa POST/GET/DELETE de grants em MEM-008-FE-API-05; não cria endpoint alternativo.
- Lista somente metadata/status da API e ações de revogar/criar VIEW. Antes de DELETE, confirmação diz que novas resoluções param imediatamente, mas URL MinIO emitida anteriormente pode funcionar até 60 segundos. Não prometer invalidação dos bytes já baixados.
- Após confirmação e sucesso de DELETE, atualizar a lista; oferecer criação com nova Idempotency-Key. Grant revogado não tem segredo recuperável.

## MEM-008-FE-UI-03 — Galeria e lightbox anônimos (MEM-008-FE-R17, MEM-008-FE-AC09, MEM-008-FE-AC18)

- /m/[shareToken] usa shared response de MEM-008-FE-API-06. Apresenta cabeçalho com coverPhotoId/capa, título, descrição, contagem derivada do número de fotos autorizadas e grid responsivo. Se coverPhotoId for null, pode usar a primeira foto autorizada como fallback visual sem PATCH ou persistência.
- Código 404 shared_mural_unavailable mostra o estado MURAL_REMOVED do FRONTEND_SPEC com cópia segura. Não exibir nem inferir título, owner, UUID, capa, fotos ou outros metadados do mural indisponível.
- Lightbox é diálogo acessível com nome, fecha por controle visível e Escape, restaura foco ao acionador e oferece controles nomeados para anterior/próxima. ArrowLeft/ArrowRight e toque/swipe no mobile navegam sem remover controles acessíveis.
- Validar layouts de celular/desktop, foco/teclado e alvos de ao menos 44×44 CSS px conforme FRONTEND_SPEC. O E2E de browser cobre viewport móvel/desktop, keyboard e touch; isso não declara validação física em Safari iOS/Chrome Android.

## MEM-008-FE-UI-04 — Evidência de compatibilidade física (MEM-008-FE-R18, MEM-008-FE-AC19)

- Rodar fluxo em aparelho iPhone físico com Safari iOS real e em aparelho Android físico com Chrome Android real. Para cada plataforma, registrar browser/versão, dispositivo/modelo, OS/versão, data, ações share (Web Share ou fallback), viewport, teclado, toque, abrir/fechar/navegar lightbox e resultado em evidence.md.
- Evidências não podem conter token, shareUrl completa ou URL assinada. Registrar apenas a confirmação de igualdade da URL copiada com a resposta de grant, sem reproduzir o segredo.
- O status de cada plataforma permanece NÃO VERIFICADO até sua execução ser registrada. Teste de viewport/emulação em Playwright ou Chrome desktop não substitui teste físico. Isso é gate para afirmar compatibilidade, não para implementar a feature ou rodar E2E desktop.

## MEM-008-FE-UI-05 — Configuração e confirmação de publicação (MEM-008-FE-R03/MEM-008-FE-R06, MEM-008-FE-AC06/MEM-008-FE-AC20)

- A configuração do owner ocorre em /murais/[muralId]/configurar, rota definida no FRONTEND_SPEC. Título e descrição usam os campos MEM-004; capa seleciona somente foto READY associada e é salva pelo PATCH coverPhotoId com If-Match atual.
- Antes do publish, apresentar resumo de título, descrição, capa e fotos e informar que publicar não cria grant nem torna o mural acessível por link; criação do grant VIEW é ação posterior.
- Neste contrato backend, acesso por link é controlado pela existência de grant VIEW, não por um campo visibility separado. A interface pode explicar que o mural segue sem acesso por link até criar grant, mas não deve enviar campo/endpoint de visibilidade inventado.
- Cancelar revisão não publica. Sucesso do publish reflete MuralSummary PUBLISHED/publishedAt e oferece próximo passo para criar VIEW sem inventar link ou segredo.

## MEM-008-FE-UI-06 — Identidade e acessibilidade (MEM-008-FE-R19, MEM-008-FE-AC21)

- Usar tokens aprovados do BRAND_SYSTEM e DM Sans para UI; Engagement fica restrita ao wordmark quando exibido. Não adotar estética de dashboard ou estados transmitidos somente por cor.
- Verificar texto normal com contraste >=4.5:1 e texto grande >=3:1, foco visível e labels/nome acessíveis nas ações. Respeitar prefers-reduced-motion e evitar flashes intensos.
- Esses critérios aplicam-se às rotas de configuração, gestão VIEW e mural convidado, além dos controles do lightbox.

## MEM-008-FE-E2E-01 — Gate futuro Compose real

Depois da aprovação do draft backend e integração dos contratos, o E2E deverá usar Compose com frontend, API, PostgreSQL e MinIO reais, além de identidade local documentada. Deve criar fixture pela API, associar foto READY, selecionar/validar capa, publicar, criar grant, abrir shareUrl em contexto anônimo, renovar a URL via novo GET e revogar.

Playwright não deve mockar publish/grants/shared-read, presign, toBlob/storage, nem substituir MinIO/API por fixture interceptada. Deve validar conteúdo, Referrer-Policy na resposta HTTP do próprio documento HTML (sem inferi-la pelo JSON API), demais headers da página Next e da API shared separadamente, headers de cada GET MinIO privado/compartilhado, replay sem segredo, códigos seguros, logs/traces/proxy com path-token redigido ao template /{shareToken}, prazo de URLs, nova resolução após revogação e o limite de até 60s para URL já emitida. Para MEM-008-FE-AC14/MEM-008-FE-AC22, fixture real com EXIF/GPS/orientação deve provar ausência desses metadados nos bytes da variante shared, orientação visual correta e inacessibilidade do original pelo convidado; nunca aceitar fallback ao original. Este contrato não afirma que runner/cenário já existe nem que backend esteja aprovado.
