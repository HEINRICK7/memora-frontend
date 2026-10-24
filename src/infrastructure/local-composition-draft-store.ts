import type { LocalCompositionDraft } from "../domain/compositions/composition-document";
import { assertValidLocalCompositionDraft } from "../domain/compositions/composition-document";
import { TEMPLATE_CATALOG_V1 } from "../domain/templates/template-catalog";
import type { LocalCompositionDraftStore } from "../application/compositions/local-composition-draft-store";

const DATABASE_NAME = "memora-local-compositions";
const DATABASE_VERSION = 1;
const OBJECT_STORE = "compositionDrafts";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("O armazenamento local não está disponível neste navegador."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(OBJECT_STORE)) {
        database.createObjectStore(OBJECT_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
    request.onblocked = () => reject(new Error("Feche outras abas do Memora para atualizar o armazenamento local."));
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("A transação local foi interrompida."));
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível salvar no armazenamento local."));
  });
}

function waitForRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("A operação local não foi concluída."));
  });
}

function templateForDraft(draft: LocalCompositionDraft) {
  return TEMPLATE_CATALOG_V1.find(
    (template) =>
      template.templateId === draft.document.templateId &&
      template.version === draft.document.templateVersion,
  );
}

function validateDraft(draft: LocalCompositionDraft): void {
  const template = templateForDraft(draft);
  if (!template) throw new Error("O template deste rascunho não está mais disponível.");
  assertValidLocalCompositionDraft(draft, template);
}

function persistableDraft(draft: LocalCompositionDraft): LocalCompositionDraft {
  return {
    id: draft.id,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    document: {
      schemaVersion: draft.document.schemaVersion,
      templateId: draft.document.templateId,
      templateVersion: draft.document.templateVersion,
      slots: draft.document.slots.map((slot) => ({
        slotId: slot.slotId,
        assetId: slot.assetId,
        transform: {
          x: slot.transform.x,
          y: slot.transform.y,
          scale: slot.transform.scale,
          rotation: slot.transform.rotation,
        },
        cropMode: slot.cropMode,
      })),
      textLayers: [],
      backgroundColor: "#F8F5EE",
    },
  };
}

export function createLocalCompositionDraftStore(): LocalCompositionDraftStore {
  async function readWrite<T>(
    mode: IDBTransactionMode,
    execute: (objectStore: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(OBJECT_STORE, mode);
      const completed = waitForTransaction(transaction);
      try {
        const request = execute(transaction.objectStore(OBJECT_STORE));
        const [result] = await Promise.all([waitForRequest(request), completed]);
        return result;
      } catch (error) {
        try {
          transaction.abort();
        } catch {
          // The transaction may already have completed or aborted with the failed request.
        }
        await completed.catch(() => undefined);
        throw error;
      }
    } finally {
      database.close();
    }
  }

  return {
    async create(draft) {
      validateDraft(draft);
      const persisted = persistableDraft(draft);
      await readWrite("readwrite", (store) => store.add(persisted));
      return persisted;
    },

    async get(draftId) {
      return readWrite("readonly", (store) => store.get(draftId));
    },

    async list() {
      const drafts = await readWrite("readonly", (store) => store.getAll());
      return drafts.sort((left, right) => {
        const leftUpdatedAt = typeof left?.updatedAt === "string" ? left.updatedAt : "";
        const rightUpdatedAt = typeof right?.updatedAt === "string" ? right.updatedAt : "";
        const updated = rightUpdatedAt.localeCompare(leftUpdatedAt);
        const leftId = typeof left?.id === "string" ? left.id : "";
        const rightId = typeof right?.id === "string" ? right.id : "";
        return updated || leftId.localeCompare(rightId);
      });
    },

    async save(draft) {
      validateDraft(draft);
      const persisted = persistableDraft(draft);
      await readWrite("readwrite", (store) => store.put(persisted));
      return persisted;
    },
  };
}

export const localCompositionDraftStore = createLocalCompositionDraftStore();
