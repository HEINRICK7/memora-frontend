# MEM-005 — Contratos locais

## MEM-005-LOCAL-01 — CompositionDocument v1

```ts
type Transform = { x: number; y: number; scale: number; rotation: number };
type PhotoSlot = {
  slotId: string;
  assetId: string | null;
  transform: Transform;
  cropMode: "cover" | "contain";
};
type CompositionDocument = {
  schemaVersion: 1;
  templateId: string;
  templateVersion: number;
  slots: PhotoSlot[];
  textLayers: [];
  backgroundColor: "#F8F5EE";
};
type LocalCompositionDraft = {
  id: string; // UUID gerado no browser
  document: CompositionDocument;
  createdAt: string;
  updatedAt: string;
};
```

As IDs de slot correspondem 1:1 à definição imutável do template e preservam sua ordem. Nesta versão, `transform` deve ser exatamente `{x:0,y:0,scale:1,rotation:0}`. Campos não reconhecidos são recusados no boundary local.

## MEM-005-LOCAL-02 — Persistência no browser

Banco IndexedDB `memora-local-compositions`, versão 1, object store `compositionDrafts`, keyPath `id`. Operações de domínio expostas por adapter `LocalCompositionDraftStore`: criar, buscar por UUID, listar por `updatedAt` decrescente e salvar versão atual. Exclusão fica fora deste slice.

O registro contém JSON de composição e timestamps; não contém bytes da foto, URL temporária, identidade, token ou segredo. O schema de banco usa versão de migração própria; esta feature cria o store na versão inicial disponível.

## MEM-005-LOCAL-03 — Biblioteca de fotos

`PhotoGateway.listPhotos()` retorna somente `SavedPhoto {id,status:"READY",contentType,sizeBytes,previewUrl,previewExpiresAt}` do owner atual. `previewUrl` é dado transitório para renderização e nunca é serializado pelo store local.

## MEM-005-LOCAL-04 — Navegação

- Ação de catálogo leva a `/editor/{draftId}` após criação local bem-sucedida.
- `/templates` lista drafts locais e oferece retomar cada um.
- Draft inválido/inexistente mostra estado recuperável com ação “Escolher outro template”.
- Não existe endpoint HTTP de Composition nesta feature.
- Se o carregamento de uma URL temporária falhar, ação de retry chama `listPhotos()` novamente e substitui apenas o URL em memória, nunca o ID no documento.
