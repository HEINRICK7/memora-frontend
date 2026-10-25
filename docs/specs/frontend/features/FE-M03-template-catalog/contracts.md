# FE-M03 — Contratos rastreáveis

| ID | Interface | Uso | Garantia |
|---|---|---|---|
| FE-M03-C01 | `TEMPLATE_CATALOG_V1: readonly TemplateDefinition[]` | Fonte dos cards e previews | Cada escolha mantém `templateId`, `version`, `photoCount`, `aspectRatio`, slots e decorações reais; a UI não renomeia nem adiciona layouts. |
| FE-M03-C02 | `filterTemplateCatalog(catalog, { photoCount?, aspectRatio? })` | Combina filtros do catálogo | Só aplica critérios existentes no modelo; nenhum filtro temático é simulado. |
| FE-M03-C03 | `LocalCompositionDraftStore.create/list` via `createCompositionDraft` e `listCompositionDrafts` | Cria e retoma composições | O rascunho começa sem fotos e persiste no armazenamento local existente; não implica upload nem sincronização. |
| FE-M03-C04 | Navegação existente do Next.js | Abre `/editor/{draftId}` | Só navega depois da criação persistida; não cria rota de preview inexistente. |
| FE-M03-C05 | Assets locais em `public/brand/v2/photos/**` | Conteúdo ilustrativo dos slots | Os arquivos são amostras de marca e são decorativos, sem associação a contas ou murais de usuários. |

## HTTP e privacidade

O catálogo, a busca e os filtros não fazem chamadas HTTP. Fotos de exemplo vêm do pacote local da marca e nunca são salvas no MinIO. O rascunho segue o contrato local já implementado; esta tela não envia fotografias ou tokens e não publica composição.
