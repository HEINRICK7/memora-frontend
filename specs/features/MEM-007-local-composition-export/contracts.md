# MEM-007 — Contratos de exportação local

## MEM-007-LOCAL-01 — Opções de exportação

```ts
type CompositionExportFormat = "image/png" | "image/jpeg";

type CompositionExportOptions = {
  format: CompositionExportFormat;
  /** Usado somente em JPEG. Valor Canvas normalizado entre 0 e 1. */
  jpegQuality?: number;
};
```

- `format` precisa estar listado em `TemplateDefinition.export.formats`.
- Para JPEG, `jpegQuality` omitido usa `template.export.jpegQuality`; valor fornecido deve ser número finito no intervalo inclusivo `[0, 1]`.
- Para PNG, qualidade não é enviada ao encoder e não muda o resultado lossless.
- Dimensões são sempre `template.export.width × template.export.height` e passam a validação MEM-007-R04.

## MEM-007-LOCAL-02 — Saídas e estados

```ts
type CompositionExportPhase =
  | "PREPARING"
  | "LOADING_PHOTOS"
  | "RENDERING"
  | "ENCODING"
  | "READY"
  | "DOWNLOADING"
  | "COMPLETE"
  | "CANCELLED"
  | "ERROR";

type CompositionExportProgress = {
  phase: CompositionExportPhase;
  completedPhotos?: number;
  totalPhotos?: number;
  errorCode?:
    | "INVALID_DRAFT"
    | "INCOMPLETE_COMPOSITION"
    | "PHOTO_UNAVAILABLE"
    | "PHOTO_PREVIEW_EXPIRED"
    | "PHOTO_DECODE_FAILED"
    | "INSUFFICIENT_SOURCE_RESOLUTION"
    | "UNSUPPORTED_FORMAT"
    | "UNSUPPORTED_TEMPLATE_DIMENSIONS"
    | "CANVAS_CORS"
    | "ENCODING_FAILED"
    | "CANCELLED";
};

type CompositionExportResult = {
  blob: Blob;
  mimeType: CompositionExportFormat;
  width: number;
  height: number;
  fileName: string;
};
```

`completedPhotos/totalPhotos` só aparecem durante carregamento quando o total é conhecido. Outras fases não prometem porcentagem. `fileName` deriva apenas do `templateId` sanitizado e extensão correspondente; não usa título privado, asset ID ou URL.

## MEM-007-LOCAL-03 — Portas de aplicação/infraestrutura

```ts
type ExportPhotoSource = {
  assetId: string;
  previewUrl: string; // temporária, memória da operação apenas
  previewExpiresAt: string;
};

type RenderCompositionRequest = {
  document: CompositionDocument;
  template: TemplateDefinition;
  photos: ReadonlyMap<string, ExportPhotoSource>;
  options: CompositionExportOptions;
  signal: AbortSignal;
  onProgress?: (progress: CompositionExportProgress) => void;
};

interface CompositionExportRenderer {
  render(request: RenderCompositionRequest): Promise<CompositionExportResult>;
}
```

O caso de uso de exportação valida draft/template/slots/opções, usa `PhotoGateway.listPhotos()` para resolver fontes READY com URL temporária e chama o renderer. O adapter Canvas 2D decodifica imagens em modo CORS anônimo, usa as dimensões `naturalWidth/naturalHeight` da imagem decodificada para validar a resolução, desenha decoração e slots pelo contrato do template, verifica sinal de cancelamento entre etapas, codifica por `HTMLCanvasElement.toBlob()` e valida `Blob.type`, dimensões e resolução antes de retornar. O adapter não depende de dimensões declaradas no DTO da API.

Camadas de UI criam download local a partir do resultado e liberam o object URL. Renderer e caso de uso não escrevem no IndexedDB, não chamam API de Composition/Mural e não enviam arquivo.

## MEM-007-LOCAL-04 — Política Canvas/CORS/resolução v1

- Envelope fechado ao catálogo atual: cada lado `<= 1800`, área `<= 2.560.000` pixels; excedentes falham antes de criar ou redimensionar Canvas.
- Cada slot calcula a escala necessária conforme geometria normalizada, dimensões do template e modo `cover/contain`. Se alguma imagem exigir escala de origem maior que `1`, a resolução é insuficiente e a exportação falha sem ampliar.
- A imagem fonte deve ser carregada com `crossOrigin = "anonymous"` antes de definir `src`; a resposta GET temporária do MinIO precisa autorizar a origem da aplicação. Canvas contaminado é erro terminal da tentativa, sem modo degradado.
- `PHOTO_PREVIEW_EXPIRED` identifica o slot cujo link temporário expirou e permite atualizar prévias; `PHOTO_UNAVAILABLE` e `PHOTO_DECODE_FAILED` identificam slots que precisam de substituição. `INSUFFICIENT_SOURCE_RESOLUTION` oferece escolher outra foto para o slot afetado.
- Imagem, template e formato são validados antes do desenho. A composição só chega a `READY` se a codificação completar com MIME idêntico ao solicitado.
- Canvas é limpo e descartado ao final/falha/cancelamento. O resultado não inclui metadados EXIF originais.

## MEM-007-LOCAL-05 — Sem endpoint HTTP novo

O contrato de exportação é local ao browser. As únicas comunicações permitidas são o `PhotoGateway` e GETs de objetos assinados existentes para leitura de fotos já salvas. Não há request/response HTTP de exportação, persistência do Blob, endpoint de composição ou compartilhamento nesta feature.

## MEM-007-E2E-01 — Cenário Compose com infraestrutura real

O teste de aceite executável será `tests/e2e/MEM-007-local-composition-export.spec.ts`, com projeto Playwright `chrome-desktop`. O setup do cenário usa uma fixture versionada em `tests/fixtures/MEM-007-export-pattern.png`: PNG sem EXIF/pessoal, 1600 × 1600 px, quatro quadrantes uniformes com centros de cor superior esquerdo `#E94B35`, superior direito `#2D7DD2`, inferior esquerdo `#97CC04`, inferior direito `#F2C14E`, suficiente para o slot de `polaroid-single` sem upscaling.

Comando executado a partir do diretório `memora-frontend`:

```sh
docker compose -f ../memora-backend/compose.yaml up --build --wait postgres minio backend frontend
npm run e2e -- --project=chrome-desktop tests/e2e/MEM-007-local-composition-export.spec.ts
```

O setup usa o principal local já configurado pelo Compose e executa, em ordem, `POST /api/v1/uploads`, PUT para a `uploadUrl`/headers assinados exatamente como retornados, e `POST /api/v1/uploads/{uploadId}/complete`. A UI então usa o `PhotoGateway` real em `/templates` e no editor. O teste observa apenas origem/status/headers seguros do GET real ao MinIO; query string assinada nunca entra em log, snapshot ou relatório.

Após cada download do browser, o runner verifica magic bytes (`89 50 4E 47 0D 0A 1A 0A` para PNG; `FF D8 FF` para JPEG), reabre os bytes no próprio contexto Chrome com `createImageBitmap`, confere 1200 × 1500 px e amostra pontos internos conhecidos: `(200, 300)` deve corresponder ao quadrante superior esquerdo `#E94B35` (RGB exato em PNG; diferença máxima de 24 níveis por canal em JPEG) e `(600, 1350)` deve ser o papel branco `(255, 255, 255)`. Os pontos ficam longe das bordas e da fronteira entre quadrantes para evitar amostrar pixels de interpolação.

O cenário não usa `page.route`/mock para API, MinIO ou imagens; não injeta renderer alternativo; não substitui `toBlob`, CORS nem storage. O browser deve receber a URL assinada de leitura do MinIO, decodificar a foto real e exercitar o renderer de produção. O runner remove o PhotoAsset temporário usando `DELETE /api/v1/photos/{photoId}` em limpeza `finally`. As URLs assinadas e bytes da fixture não são emitidos no log.

Resultado, versão real do browser e headers verificados estão registrados em `evidence.md`. Chrome desktop é a evidência automatizada executada; Safari iOS físico e Chrome Android físico permanecem não verificados até teste neles.
