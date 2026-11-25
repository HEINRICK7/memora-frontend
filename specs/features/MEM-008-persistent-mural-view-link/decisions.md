# MEM-008 — Decisões (rascunho)

**Estado:** todos os itens são propostas para revisão. O draft backend MEM-008 ainda não foi aprovado; estes registros não congelam contratos nem liberam implementação frontend.

## MEM-008-FE-ADR-01 — Mural é coleção persistente, não Composition

O mural persiste título, descrição e vínculos ordenados de PhotoAssets para exibição em galeria. CompositionDocument continua local/exportável até existir contrato de composição persistida e feature que decida como publicar sua renderização. Publicação não envia implicitamente o JSON local.

## MEM-008-FE-ADR-02 — Primeiro link do MVP é VIEW

Este slice usa somente scope VIEW para convidado. Gestão básica (criar, listar e revogar grants VIEW) faz parte do MVP1, conforme o fluxo de publicação e a rota /murais/[muralId]/compartilhar do FRONTEND_SPEC. CONTRIBUTE, upload, moderação, escolha de papéis e gestão avançada de links ficam para a Fase 2. O frontend reflete canView/canContribute do contrato shared e nunca autoriza escrita pelo token.

## MEM-008-FE-ADR-03 — Segredo de grant é retornado uma vez

A primeira criação de grant retorna shareUrl para apresentação ao proprietário. Retry com a mesma chave e payload retorna metadados sem segredo (shareUrl null, tokenReturned false); listagem também não contém segredo. UI não persiste a URL e, se não a recebeu, pode revogar o grant listado e criar outro com nova chave. Esse comportamento segue o draft backend e requer aprovação.

## MEM-008-FE-ADR-04 — Conflitos usam versão atual do mural

Mutação de conteúdo usa ETag forte e If-Match. Frontend aplica uma mutação por vez por mural, avança versão em resposta confirmada e, em conflito, relê versão/coleção antes de pedir nova ação. Não faz merge silencioso nem retry cego.

## MEM-008-FE-ADR-05 — Superfície nova depende de OpenAPI aprovada

Publicação, grants e shared GET têm propostas detalhadas no draft backend MEM-008. O frontend documenta IDs/rastreabilidade e semântica proposta, mas não implementa client, RED de integração ou E2E antes de aprovação e OpenAPI versionada. Não criar endpoints ou DTOs por inferência.

## MEM-008-FE-ADR-06 — Identidade de produção é gate explícito

FRONTEND_SPEC/BACKEND_SPEC deixam provedor/sessão do proprietário em aberto. Compose usa identidade local apenas para teste e não demonstra autenticação de produção. Rota de login, tokens/cookies e renovação aguardam ADR de identidade.

## MEM-008-FE-ADR-07 — Capa é editável e acompanha associações

Conforme proposta no backend MEM-008, MuralSummary inclui coverPhotoId e PATCH do mural aceita UUID ou null sob If-Match. UUID deve indicar foto READY associada. Primeira associação a mural vazio escolhe capa; remover a capa troca para a primeira READY restante por posição ou null; limpeza explícita pelo PATCH permanece null. Capa não é obrigatória para publicar, mas deve ser válida se definida. Esta decisão segue draft pendente de aprovação.

## MEM-008-FE-ADR-08 — Publicação é explícita e não concede acesso

Publish exige ao menos um vínculo, todas as fotos READY/do owner, If-Match e Idempotency-Key. Replay do mesmo owner/mural/chave não incrementa versão. Publicar não cria grant; criação VIEW é uma ação separada do proprietário. Códigos/status devem ser confirmados no OpenAPI aprovado.

## MEM-008-FE-ADR-09 — Resolução pública distingue estados sem metadata

UI representa códigos públicos propostos: invalid/malformed 404 shared_link_unavailable → LINK_INVALID; expired 410 shared_link_expired → LINK_EXPIRED; revoked 410 shared_link_revoked → LINK_REVOKED; mural ausente/arquivado/não PUBLISHED 404 shared_mural_unavailable → estado MURAL_REMOVED do FRONTEND_SPEC. A cópia de MURAL_REMOVED não inclui título, owner, mural UUID, capa ou fotos. Respostas e mensagens de erro não incluem metadata privada nem inferem existência de outros murais.

## MEM-008-FE-ADR-10 — URL de mídia expira e renova via GET

URLs assinadas MinIO expiram em no máximo 60 segundos e nunca além da expiração restante do grant. Um novo GET shared autorizado fornece URLs novas. Revogação bloqueia imediatamente novas resoluções; URL já emitida pode continuar válida até o TTL restante, no máximo 60 segundos. A UI não afirma revogação instantânea de URL ou de conteúdo baixado/cacheado.

## MEM-008-FE-ADR-11 — Respostas privadas e compartilhadas não são cacheadas

Responses usam Cache-Control private, no-store. Shared adiciona X-Robots-Tag noindex, nofollow, noarchive e Referrer-Policy no-referrer. Token, shareUrl e URL assinada nunca vão a logs, analytics, Referer ou armazenamento durável. Confirmar aplicação dos headers no browser/Compose no E2E real após aprovação.

## MEM-008-FE-ADR-12 — Preview shared usa variante sanitizada, nunca o original

O fluxo de convidado recebe exclusivamente variante privada sanitizada que remove EXIF/GPS e demais metadados sensíveis e apresenta pixels com orientação correta. O objeto original permanece privado ao proprietário e não pode ser retorno, referência ou fallback do shared GET; falha/ausência da variante deve falhar fechada. A fixture E2E contém metadados GPS/EXIF e orientação conhecida para provar bytes compartilhados limpos e conteúdo visual corretamente orientado. O contrato backend draft define `SHARE_VIEW`, `share_view_storage_key` como referência interna não serializada, limite de preview de 2560 px e resposta shared via `previewUrl`/metadados derivados. Este ADR de frontend fixa a semântica de consumo e não inventa endpoint adicional.

## Questões para juiz/backend

1. Aprovar/ajustar o draft backend MEM-008 e versionar OpenAPI antes de RED e integração do frontend.
2. Confirmar codes/status e idempotência de publish/create grant no contrato aprovado.
3. Confirmar se a política de renovação de URLs temporárias e a janela de validade residual após revoke estão alinhadas com a política de segurança de produção.
4. Resolver identidade de proprietário em produção e rate limiting antes de habilitar links públicos em produção.
