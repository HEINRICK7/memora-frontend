export type UploadQueueResult<T, R> =
  | { item: T; status: "fulfilled"; value: R }
  | { item: T; status: "rejected"; reason: unknown };

export type UploadQueueOptions = {
  concurrency?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  onProgress?: (completed: number, total: number) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

async function runWithRetry<T, R>(
  item: T,
  worker: (item: T, index: number) => Promise<R>,
  index: number,
  maxRetries: number,
  retryDelayMs: number,
): Promise<R> {
  let attempt = 0;
  while (true) {
    try {
      return await worker(item, index);
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
      attempt += 1;
      await sleep(retryDelayMs * attempt);
    }
  }
}

export async function runUploadQueue<T, R>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<R>,
  options: UploadQueueOptions = {},
): Promise<Array<UploadQueueResult<T, R>>> {
  const total = items.length;
  if (total === 0) return [];

  const concurrency = Math.max(1, Math.min(options.concurrency ?? 3, total));
  const maxRetries = Math.max(0, options.maxRetries ?? 1);
  const retryDelayMs = Math.max(1, options.retryDelayMs ?? 350);

  const results = new Array<UploadQueueResult<T, R>>(total);
  let nextIndex = 0;
  let completed = 0;

  async function nextWorker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex;
      if (currentIndex >= total) return;
      nextIndex += 1;
      const item = items[currentIndex]!;
      try {
        const value = await runWithRetry(item, worker, currentIndex, maxRetries, retryDelayMs);
        results[currentIndex] = { item, status: "fulfilled", value };
      } catch (reason) {
        results[currentIndex] = { item, status: "rejected", reason };
      } finally {
        completed += 1;
        options.onProgress?.(completed, total);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => nextWorker()));
  return results;
}
