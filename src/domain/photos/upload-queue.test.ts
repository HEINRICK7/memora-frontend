import { describe, expect, it, vi } from "vitest";
import { runUploadQueue } from "./upload-queue";

describe("runUploadQueue (MEM-011-AC10)", () => {
  it("runs tasks concurrently up to the configured limit and preserves order", async () => {
    let active = 0;
    let peakActive = 0;
    const items = [1, 2, 3, 4, 5, 6];
    const progressEvents: Array<{ completed: number; total: number }> = [];

    const results = await runUploadQueue(
      items,
      async (item) => {
        active += 1;
        peakActive = Math.max(peakActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return item * 10;
      },
      {
        concurrency: 3,
        maxRetries: 0,
        onProgress: (completed, total) => progressEvents.push({ completed, total }),
      },
    );

    expect(peakActive).toBe(3);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(results.map((r) => (r.status === "fulfilled" ? r.value : null))).toEqual([
      10, 20, 30, 40, 50, 60,
    ]);
    expect(progressEvents.at(-1)).toEqual({ completed: 6, total: 6 });
  });

  it("retries transient failures and isolates permanent errors per item", async () => {
    const attempts = new Map<string, number>();
    const worker = vi.fn(async (name: string) => {
      const next = (attempts.get(name) ?? 0) + 1;
      attempts.set(name, next);
      if (name === "flaky" && next === 1) {
        throw new Error("temporary network hiccup");
      }
      if (name === "broken") {
        throw new Error("permanent failure");
      }
      return `ok:${name}`;
    });

    const results = await runUploadQueue(["ok", "flaky", "broken"], worker, {
      concurrency: 2,
      maxRetries: 1,
      retryDelayMs: 1,
    });

    expect(results[0]).toEqual({ item: "ok", status: "fulfilled", value: "ok:ok" });
    expect(results[1]).toEqual({ item: "flaky", status: "fulfilled", value: "ok:flaky" });
    expect(results[2]?.status).toBe("rejected");
    expect(attempts.get("flaky")).toBe(2);
    expect(attempts.get("broken")).toBe(2);
  });
});
