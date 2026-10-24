// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createLocalCompositionDraftStore } from "./local-composition-draft-store";

const DATABASE_NAME = "memora-local-compositions";
const STORE_NAME = "compositionDrafts";

type TestDraft = {
  id: string;
  createdAt: string;
  updatedAt: string;
  document: {
    schemaVersion: 1;
    templateId: "single-photo";
    templateVersion: 1;
    slots: Array<{
      slotId: "photo-1";
      assetId: string | null;
      transform: { x: 0; y: 0; scale: 1; rotation: 0 };
      cropMode: "cover";
    }>;
    textLayers: [];
    backgroundColor: "#F8F5EE";
  };
};

function draft(id: string, updatedAt: string): TestDraft {
  return {
    id,
    createdAt: "2026-10-24T14:00:00.000Z",
    updatedAt,
    document: {
      schemaVersion: 1,
      templateId: "single-photo",
      templateVersion: 1,
      slots: [
        {
          slotId: "photo-1",
          assetId: "8b51525e-8d76-4f71-9c34-9402292c640b",
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          cropMode: "cover",
        },
      ],
      textLayers: [],
      backgroundColor: "#F8F5EE",
    },
  };
}

function readStoredDrafts(factory: IDBFactory): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const openRequest = factory.open(DATABASE_NAME, 1);
    openRequest.onupgradeneeded = () => {
      if (!openRequest.result.objectStoreNames.contains(STORE_NAME)) {
        openRequest.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    openRequest.onerror = () => reject(openRequest.error);
    openRequest.onsuccess = () => {
      const database = openRequest.result;
      const transaction = database.transaction(STORE_NAME, "readonly");
      const getAllRequest = transaction.objectStore(STORE_NAME).getAll();
      transaction.oncomplete = () => {
        database.close();
        resolve(getAllRequest.result);
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error);
      };
    };
  });
}

describe("IndexedDB local composition draft store (MEM-005-LOCAL-02)", () => {
  let factory: IDBFactory;

  beforeEach(() => {
    factory = new IDBFactory();
    vi.stubGlobal("indexedDB", factory);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates, gets, lists by updatedAt, updates, and persists only the draft payload", async () => {
    const store = createLocalCompositionDraftStore();
    const older = draft(
      "82f44972-00f0-4b5c-8711-b9ba6d331df3",
      "2026-10-24T14:30:00.000Z",
    );
    const newer = draft(
      "edb46de7-887d-4ac8-a2ca-caa04d3843ec",
      "2026-10-24T15:00:00.000Z",
    );

    await store.create(older);
    await store.create(newer);

    expect(await store.get(older.id)).toEqual(older);
    expect((await store.list()).map((item) => item.id)).toEqual([
      newer.id,
      older.id,
    ]);

    const updated = {
      ...older,
      updatedAt: "2026-10-24T16:00:00.000Z",
      document: {
        ...older.document,
        slots: [{ ...older.document.slots[0], assetId: "c1868f10-c845-4815-909e-4d255871d1a1" }],
      },
    };
    await store.save(updated);

    expect(await store.get(older.id)).toEqual(updated);
    expect((await store.list()).map((item) => item.id)).toEqual([
      older.id,
      newer.id,
    ]);

    const stored = await readStoredDrafts(factory);
    const serialized = JSON.stringify(stored);
    expect(stored).toHaveLength(2);
    expect(serialized).not.toContain("previewUrl");
    expect(serialized).not.toContain("X-Amz-Signature");
    expect(serialized).not.toContain("SIGNED_TEMPORARY_URL");
    expect(Object.keys(stored[0] as Record<string, unknown>).sort()).toEqual([
      "createdAt",
      "document",
      "id",
      "updatedAt",
    ]);
  });

  it("rejects a signed preview URL at the local persistence boundary", async () => {
    const store = createLocalCompositionDraftStore();
    const invalid = {
      ...draft("82f44972-00f0-4b5c-8711-b9ba6d331df3", "2026-10-24T15:00:00.000Z"),
      document: {
        ...draft("82f44972-00f0-4b5c-8711-b9ba6d331df3", "2026-10-24T15:00:00.000Z").document,
        slots: [
          {
            ...draft("82f44972-00f0-4b5c-8711-b9ba6d331df3", "2026-10-24T15:00:00.000Z").document.slots[0],
            previewUrl: "https://minio.local/photo?X-Amz-Signature=secret",
          },
        ],
      },
    } as unknown as TestDraft;

    await expect(store.create(invalid)).rejects.toThrow();
    expect(JSON.stringify(await readStoredDrafts(factory))).not.toContain(
      "X-Amz-Signature=secret",
    );
  });
});
