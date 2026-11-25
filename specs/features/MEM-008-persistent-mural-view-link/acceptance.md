# MEM-008 — Critérios de aceite (rascunho)

**Status:** draft para revisão do juiz. O backend MEM-008 correspondente também é draft, sem aprovação. Nenhum endpoint novo deve ser implementado/testado no frontend até aprovação e OpenAPI versionada; os comportamentos propostos abaixo alinham com o draft backend atual.

## MEM-008-FE-AC01 — Criar rascunho persistente

**Given** um proprietário autenticado e um título válido
**When** cria um mural e a API confirma
**Then** frontend envia POST /api/v1/murals com Idempotency-Key UUID e título/descrição do contrato MEM-002
**And** mantém id, status e versão do servidor, sem criar cópias silenciosas em retry.

## MEM-008-FE-AC02 — Listar e retomar mural do proprietário

**Given** um mural persistido do proprietário
**When** abre /meus-murais ou recarrega o detalhe
**Then** consulta GET /api/v1/murals e GET /api/v1/murals/{muralId}
**And** distingue DRAFT, PUBLISHED e ARCHIVED pelos dados do servidor, não pelo IndexedDB da composição.

## MEM-008-FE-AC03 — Editar metadata e capa com versão

**Given** um mural DRAFT com ETag forte atual e foto READY associada quando se escolhe capa
**When** o proprietário altera título, descrição ou coverPhotoId
**Then** envia PATCH /api/v1/murals/{muralId} com If-Match atual e apenas campos alterados
**And** campo coverPhotoId omitido preserva a capa, UUID válido seleciona a foto, e null limpa explicitamente sem fallback
**And** resposta atualiza MuralSummary/ETag; foto não associada/inexistente retorna 404, associada mas não READY retorna 409, conflito não sobrescreve alterações concorrentes.

## MEM-008-FE-AC04 — Associar/ordenar/remover fotos READY e sincronizar capa

**Given** um mural DRAFT e ativos READY do mesmo proprietário
**When** associa, ordena ou remove fotos via MEM-006 usando If-Match atual
**Then** cada foto é associada no máximo uma vez e GET /murals/{muralId}/photos preserva a ordem confirmada
**And** a primeira associação em mural vazio define a capa no mesmo commit
**And** remover a foto de capa seleciona a primeira READY restante por posição ou null se não houver nenhuma
**And** metadata da composição local permanece separada da ordem do mural.

## MEM-008-FE-AC05 — Preservar seleção após retry e conflito

**Given** timeout após criação/associação ou resposta 409 por versão obsoleta
**When** o proprietário tenta novamente
**Then** reusa a chave idempotente da intenção e consulta mural/coleção atual antes de repetir associação
**And** mantém seleção ainda não confirmada para resolução explícita, sem duplicar vínculo nem reenviar If-Match antigo em loop.

## MEM-008-FE-AC06 — Publicar explicitamente sem criar grant

**Given** mural próprio DRAFT com uma ou mais fotos associadas, todas READY e do owner
**When** o proprietário confirma publicação
**Then** frontend chama POST /api/v1/murals/{muralId}/publish sem corpo, com If-Match atual e Idempotency-Key
**And** resposta 200 atualiza status PUBLISHED, publishedAt, versão/ETag e mantém Cache-Control private, no-store
**And** publicação não cria grant, shareUrl ou leitura pública por si só.
**And** interface mostra estado de publicação concluída sem apresentar link ou acesso VIEW até criação explícita de grant.

**Recusa proposta:** mural vazio recebe 409 publication_requires_photos; foto própria não READY recebe 409 photo_not_ready; associação de owner inconsistente recebe erro genérico 409 mural_not_publishable. Não exibir dados sensíveis da associação.

**Idempotência proposta:** retry do mesmo owner/mural/chave retorna a mesma publicação sem nova versão e Idempotency-Replayed: true, mesmo com If-Match que ficou antigo após a primeira resposta. A chave não pode ser reutilizada para outro mural.

## MEM-008-FE-AC07 — Criar grant somente VIEW e tratar replay sem segredo

**Given** mural PUBLISHED próprio
**When** o proprietário escolhe “Criar link somente para visualização”
**Then** cria grant com scope VIEW, expiresAt explícito e Idempotency-Key
**And** primeira resposta 201 mostra shareUrl recebida do backend uma única vez, com tokenReturned true
**And** replay da mesma chave/payload recebe metadados, shareUrl null, tokenReturned false e Idempotency-Replayed true; UI não inventa nem tenta recuperar o segredo
**And** chave igual com payload diferente exibe conflito seguro; CONTRIBUTE não é oferecido.
**And** após primeira criação, a UI oferece “Copiar link” e “Compartilhar”; copiar usa exatamente a shareUrl da resposta, Web Share recebe a mesma URL quando disponível e, sem suporte, compartilhar oferece fallback acessível para copiar.
**And** URL/token não são gravados em storage da aplicação nem enviados a logs/analytics; a única cópia persistente intencional é a clipboard acionada pela pessoa.

## MEM-008-FE-AC08 — Listar, revogar e criar outro link

**Given** grants do mural próprio
**When** proprietário abre /murais/[muralId]/compartilhar, consulta acesso, revoga um grant ou escolhe criar link substituto
**Then** listagem apresenta apenas metadata/status sem shareUrl/token
**And** antes de DELETE, confirmação explica que novas resoluções do link serão bloqueadas, mas URLs MinIO já emitidas podem continuar válidas por até 60 segundos
**And** após confirmação, DELETE de grant listado não exige token, retorna sucesso idempotente e atualiza a UI
**And** após revogar, UI permite criar outro grant VIEW com nova Idempotency-Key, sem depender da URL antiga.

## MEM-008-FE-AC09 — Abrir mural VIEW anônimo e renovar previews

**Given** grant VIEW ativo e não expirado para mural PUBLISHED
**When** navegador sem sessão abre /m/[shareToken] e consulta GET /api/v1/shared/{shareToken}
**Then** apresenta cabeçalho com capa, título, descrição e contagem de fotos autorizadas, além de grid responsivo com as fotos retornadas e permissões canView true/canContribute false
**And** se coverPhotoId for null, usa a primeira foto autorizada como fallback visual sem gravar uma nova capa
**And** não apresenta editar, upload, contribuição ou moderação e não recebe CompositionDocument
**And** cada preview usa a URL e previewExpiresAt recebidas; ao atingir previewExpiresAt, solicita novo GET para renovar as URLs, sem persistir o segredo de mídia.

## MEM-008-FE-AC10 — Mostrar estados públicos seguros

**Given** token inválido/malformado, expirado, revogado ou mural ausente/arquivado/não PUBLISHED
**When** visitante consulta shared GET
**Then** UI mapeia respectivamente os códigos para LINK_INVALID, LINK_EXPIRED, LINK_REVOKED ou MURAL_REMOVED conforme FRONTEND_SPEC
**And** 404 shared_mural_unavailable é apresentado como MURAL_REMOVED com cópia segura que não inclui título, owner, UUID do mural, capa ou fotos
**And** LINK_INVALID e mensagens de expirado/revogado também não exibem metadata privada
**And** erro não é inferido inspecionando formato ou conteúdo do token.

## MEM-008-FE-AC11 — Link não autoriza escrita

**Given** convidado abriu grant VIEW
**When** tenta editar mural, associar foto, publicar ou contribuir
**Then** rota não oferece essas ações e frontend não envia mutações privadas com token VIEW.

## MEM-008-FE-AC12 — Privacidade de token, URLs e cache

**Given** rota compartilhada contém token e fluxos proprietário/convidado recebem URLs MinIO assinadas
**When** navegador abre a página/carrega imagens privadas e compartilhadas
**Then** o HTML de /m/[shareToken] responde com Cache-Control: private, no-store, X-Robots-Tag: noindex, nofollow, noarchive e Referrer-Policy: no-referrer
**And** a resposta JSON de GET /api/v1/shared/{shareToken} tem seus próprios Cache-Control: private, no-store, X-Robots-Tag: noindex, nofollow, noarchive e Referrer-Policy: no-referrer
**And** cada GET de objeto MinIO realizado por URL assinada, para foto privada ou compartilhada, responde Cache-Control: private, no-store, configurado como override do presigner
**And** token/shareUrl/previewUrl/X-Amz-Signature não aparecem em logs, analytics, Referer, IndexedDB ou erros e URLs não ficam em estado durável.

## MEM-008-FE-AC13 — Identidade do proprietário permanece sob controle backend

**Given** rota privada chamada sem principal válido
**When** API responde conforme contrato de identidade
**Then** frontend não permite consultar/mutar dados usando ownerId enviado pelo cliente
**And** experiência de login não é declarada pronta até ADR de identidade aprovado.

## MEM-008-FE-AC14 — E2E real do fluxo de publicação e visualização

**Given** Compose com frontend, backend, PostgreSQL e MinIO reais, identidade local documentada e fixture JPEG real criada pela API de upload com EXIF/GPS e orientação EXIF conhecida
**When** o navegador cria draft, associa fixture READY criada pela API de uploads, abre /murais/[muralId]/configurar, escolhe capa, revisa e confirma publicação, cria grant VIEW, copia/share a URL, abre-a em contexto anônimo, usa galeria/lightbox, renova preview, revoga, tenta abrir o link revogado e cria um grant substituto
**Then** valida requests/respostas reais, ETags/idempotência, metadata/capa, segredo retornado uma vez e ausente em replay/listagem
**And** revisão antes do publish explica que ainda não existe link; publish confirmado mostra PUBLISHED sem grant e oferece a ação explícita de criar VIEW
**And** clipboard contém exatamente a shareUrl retornada pelo backend; o teste exercita Web Share quando disponível ou o fallback acessível no Chrome desktop
**And** verifica a rota /murais/[muralId]/compartilhar, confirmação de revogação com aviso de até 60 segundos e comportamento da página convidada em viewport mobile/desktop, incluindo navegação por teclado e toque
**And** inspeciona separadamente os headers da página HTML Next, da resposta JSON shared e dos GETs reais de objeto MinIO para foto privada e compartilhada; todos têm Cache-Control: private, no-store, e página/API têm também noindex/nofollow/noarchive e no-referrer
**And** confirma Referrer-Policy: no-referrer na resposta HTTP do próprio documento HTML /m/[shareToken], sem inferi-la pela resposta JSON da API
**And** valida URLs assinadas MinIO reais, validade máxima de 60 segundos e override de Cache-Control incluído pelo presigner na resposta do objeto
**And** bytes do preview servido pelo shared GET/MinIO são de variante sanitizada: inspeção binária não encontra EXIF/GPS, os pixels exibidos mantêm a orientação esperada e a resposta/URL shared nunca aponta para o original nem o usa como fallback
**And** confirma que o objeto original segue privado ao proprietário, não é exposto no JSON shared nem acessível pelo caminho de convidado; ausência/falha da variante sanitizada falha fechada sem servir o original
**And** depois de revogar, nova resolução retorna 410 shared_link_revoked; a URL previamente emitida pode continuar funcionando até o TTL residual máximo de 60 segundos
**And** inspeciona logs/traces/proxy do Compose e confirma que o segmento do token aparece somente como template /{shareToken}, sem token, shareUrl ou URL assinada
**And** relatório/log não contém token, URL completa, assinatura ou URL assinada e containers terminam saudáveis.
**And** cobertura de viewport/touch do Playwright não é apresentada como teste físico; compatibilidade Safari iOS/Chrome Android fica pendente de MEM-008-FE-AC19.

**Bloqueio:** este E2E executável só será especificado/rodado após aprovação do draft backend, OpenAPI versionada, implementação real e ambiente de identidade local. Mocks não substituem API, storage, URLs assinadas nem resolução do grant.

## MEM-008-FE-AC15 — Declarar validade residual de URL assinada

**Given** visitante obteve URL MinIO assinada enquanto o grant estava ativo
**When** proprietário revoga o grant
**Then** próxima resolução do token é negada imediatamente
**And** UI informa que URLs já emitidas podem funcionar até expirarem, em no máximo 60 segundos, sem prometer revogação instantânea de bytes/cache.

## MEM-008-FE-AC16 — Copiar/compartilhar exatamente a URL emitida

**Given** primeira criação confirmada de grant retorna shareUrl e tokenReturned true
**When** proprietário escolhe “Copiar link” ou “Compartilhar”
**Then** “Copiar link” grava na clipboard a string shareUrl exatamente como recebida, sem reconstruir origem/path/token
**And** “Compartilhar” invoca Web Share com essa mesma URL quando navigator.share estiver disponível
**And** sem Web Share, “Compartilhar” expõe fallback acessível para copiar e anuncia sucesso/falha para tecnologia assistiva
**And** E2E compara o texto copiado com a shareUrl da resposta backend e não imprime o segredo no relatório.

## MEM-008-FE-AC17 — Gerenciar links em rota do proprietário

**Given** proprietário autenticado abre /murais/[muralId]/compartilhar para um mural seu
**When** consulta grants e pede para revogar um ativo
**Then** a rota lista status e metadata sem recuperar/exibir token da listagem
**And** confirmação informa que novas resoluções do link param após a revogação, mas URLs MinIO emitidas anteriormente podem funcionar até 60 segundos
**And** cancelar a confirmação não executa DELETE
**And** só após confirmar a UI executa DELETE; sucesso atualiza status e permite criar outro grant VIEW com nova Idempotency-Key.

## MEM-008-FE-AC18 — Galeria convidada e lightbox acessíveis

**Given** visitante abre link VIEW válido em celular ou desktop
**When** a página /m/[shareToken] carrega e a pessoa abre uma foto
**Then** o cabeçalho apresenta capa, título, descrição e contagem de fotos autorizadas; o grid adapta-se à largura disponível
**And** lightbox acessível tem nome/semântica de diálogo, fecha por botão e Escape, e restaura foco ao item que o abriu
**And** anterior/próxima funcionam por botões acessíveis, ArrowLeft/ArrowRight e gesto de toque; alvos interativos respeitam o mínimo de 44×44 CSS px indicado no FRONTEND_SPEC.

## MEM-008-FE-AC19 — Evidência física antes de declarar compatibilidade móvel/share

**Given** a UI de compartilhar e a página convidada estão implementadas e o time pretende declarar compatibilidade móvel/share
**When** o fluxo é exercitado em Safari iOS num iPhone físico e Chrome Android num dispositivo Android físico
**Then** em cada dispositivo verifica Web Share quando disponível ou o fallback acessível de cópia, confirmando que a URL usada é a shareUrl real do backend sem expor o token na evidência
**And** verifica viewport responsivo, navegação por teclado, interação por toque e lightbox (abrir, fechar, anterior e próxima)
**And** evidence.md registra separadamente para cada execução navegador/versão, dispositivo/modelo, versão do sistema operacional, data, fluxo exercitado e resultado
**And** até que a evidência de um dispositivo esteja preenchida, seu estado fica “não verificado” e nenhuma alegação de compatibilidade é feita para ele
**And** este gate de evidência/claim não bloqueia implementação nem execução do E2E Chrome desktop.

## MEM-008-FE-AC20 — Configurar título/capa e confirmar publicação

**Given** proprietário abre /murais/[muralId]/configurar para mural próprio DRAFT com fotos READY associadas
**When** altera título/descrição, escolhe ou limpa a capa e inicia publicação
**Then** formulário apresenta campos com rótulos acessíveis e permite selecionar somente foto READY associada; PATCH envia campos alterados com If-Match atual e a UI reflete MuralSummary/ETag retornado
**And** antes de publicar, a confirmação resume título, descrição, capa e contagem/fotos do mural, explica que publicar não cria link e que só pessoas com grant VIEW criado depois poderão acessar
**And** ao confirmar, chama publish conforme MEM-008-FE-AC06; só após resposta de sucesso mostra estado PUBLISHED, publishedAt e próximo passo explícito para criar grant VIEW, sem shareUrl/grant implícito
**And** cancelar a confirmação não envia a publicação.

## MEM-008-FE-AC21 — Identidade visual e acessibilidade das telas MEM-008

**Given** telas de configuração, gestão de compartilhamento e mural convidado
**When** são usadas com mouse, teclado, toque e preferência prefers-reduced-motion
**Then** usam os tokens visuais aprovados no BRAND_SYSTEM e DM Sans na UI; Engagement aparece apenas no wordmark quando usado
**And** texto normal atinge contraste mínimo 4.5:1 e texto grande 3:1; estados não dependem apenas da cor
**And** foco de teclado é visível em controles e links, rótulos/nomes acessíveis identificam ações, e prefers-reduced-motion reduz/anula movimento não essencial sem flashes intensos.

## MEM-008-FE-AC22 — Preview shared sanitizado sem exposição do original

**Given** fixture de imagem real enviada pela API contém coordenadas GPS, outros campos EXIF e orientação EXIF não padrão, e há um mural publicado com grant VIEW
**When** convidado abre o mural e o navegador baixa o preview pela URL emitida pelo contrato shared através do MinIO
**Then** o recurso usado é a variante privada `SHARE_VIEW` definida no contrato backend draft; a decodificação mantém orientação e proporção corretas, maior lado ≤2560 px sem upscaling, e inspeção binária não encontra GPS/EXIF/XMP
**And** o JSON/HTML shared não expõe URL, storage key, bytes ou identificador de acesso ao original; o original segue disponível somente pelo fluxo autorizado do proprietário
**And** backend/shared GET nunca usa o original como fallback, inclusive quando a variante sanitizada está ausente ou falha; o fluxo apresenta erro/estado seguro sem entregar os bytes originais
**And** o E2E real verifica upload da fixture pela API, leitura via URL shared/MinIO e privacidade do original, sem mockar armazenamento ou transformação
**And** o JSON shared expõe somente `previewUrl` e metadados da variante, nunca `share_view_storage_key`; a URL é assinada exclusivamente para SHARE_VIEW, sem fallback ao original.
