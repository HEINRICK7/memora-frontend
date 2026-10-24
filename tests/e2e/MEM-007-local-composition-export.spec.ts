import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const apiBase = process.env.MEMORA_API_URL ?? "http://localhost:8080/api/v1";
const minioOrigin = "http://localhost:9000";
const fixturePath = fileURLToPath(new URL("../fixtures/MEM-007-export-pattern.png", import.meta.url));

type UploadIntent = {
  uploadId: string;
  method: "PUT";
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
};

type CompletedPhoto = { id: string; status: "READY" };

test("MEM-007-AC16: imagem real do MinIO atravessa o editor e exporta PNG/JPEG", async ({ page, request }) => {
  const fixture = await readFile(fixturePath);
  let photoId: string | undefined;
  const signedMinioReads: Array<{ status: number; allowOrigin?: string }> = [];
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  page.on("response", (response) => {
    let origin = "";
    try {
      origin = new URL(response.url()).origin;
    } catch {
      return;
    }
    if (origin !== minioOrigin || response.request().method() !== "GET") return;
    const headers = response.headers();
    signedMinioReads.push({
      status: response.status(),
      allowOrigin: headers["access-control-allow-origin"],
    });
  });

  try {
    const intentResponse = await request.post(`${apiBase}/uploads`, {
      data: {
        fileName: "mem007-pattern.png",
        contentType: "image/png",
        sizeBytes: fixture.byteLength,
      },
    });
    expect(intentResponse.status(), "API must create a real upload intent").toBe(201);
    const intent = await intentResponse.json() as UploadIntent;

    let uploadResponse;
    try {
      uploadResponse = await request.put(intent.uploadUrl, {
        data: fixture,
        headers: intent.requiredHeaders,
      });
    } catch {
      throw new Error("The signed MinIO PUT failed; signed URL details were redacted.");
    }
    expect(uploadResponse.status(), "signed upload to MinIO must succeed").toBe(200);

    const completionResponse = await request.post(`${apiBase}/uploads/${encodeURIComponent(intent.uploadId)}/complete`);
    expect(completionResponse.status(), "API must confirm the object stored in MinIO").toBe(200);
    const completed = await completionResponse.json() as CompletedPhoto;
    photoId = completed.id;
    expect(completed.status).toBe("READY");

    await page.goto("/templates");
    await page.getByRole("button", { name: /Polaroid.*1 foto.*Retrato/i }).click();
    await page.getByRole("button", { name: /Usar template Polaroid/i }).click();
    await page.waitForURL(/\/editor\//);
    await page.getByRole("button", { name: /Escolher foto para espaço 1/i }).click();
    const dialog = page.getByRole("dialog", { name: /escolher fotografia/i });
    await dialog.getByRole("button", { name: /Usar fotografia 1/i }).click();
    await expect(page.getByRole("button", { name: /Exportar composição/i })).toBeEnabled();

    const expectedMime = [
      {
        option: "image/png",
        signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      },
      { option: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
    ] as const;

    for (const { option, signature } of expectedMime) {
      const minioReadCount = signedMinioReads.length;
      await page.getByLabel("Formato da imagem").selectOption(option);
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: /Exportar composição/i }).click();
      const download = await downloadPromise;
      const filePath = await download.path();
      expect(filePath, "the browser must provide the downloaded file").toBeTruthy();
      const bytes = await readFile(filePath!);
      expect([...bytes.subarray(0, signature.length)]).toEqual([...signature]);

      const decoded = await page.evaluate(async ({ rawBytes, mimeType }) => {
        const blob = new Blob([new Uint8Array(rawBytes)], { type: mimeType });
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Chrome did not provide a 2D canvas for file inspection");
        context.drawImage(bitmap, 0, 0);
        const pixel = (x: number, y: number) => Array.from(context.getImageData(x, y, 1, 1).data);
        return {
          width: bitmap.width,
          height: bitmap.height,
          photoPixel: pixel(200, 300),
          paperPixel: pixel(600, 1350),
        };
      }, { rawBytes: [...bytes], mimeType: option });

      expect(decoded.width).toBe(1200);
      expect(decoded.height).toBe(1500);
      expect(decoded.paperPixel).toEqual([255, 255, 255, 255]);
      if (option === "image/png") {
        expect(decoded.photoPixel).toEqual([233, 75, 53, 255]);
      } else {
        for (let channel = 0; channel < 3; channel += 1) {
          expect(Math.abs(decoded.photoPixel[channel]! - [233, 75, 53][channel]!)).toBeLessThanOrEqual(24);
        }
        expect(decoded.photoPixel[3]).toBe(255);
      }
      await expect(page.getByRole("status")).toContainText("Exportação concluída");

      const readsForExport = signedMinioReads.slice(minioReadCount);
      expect(readsForExport.some((read) => read.status === 200)).toBe(true);
      expect(readsForExport.some((read) => read.allowOrigin === new URL(page.url()).origin)).toBe(true);
    }
  } finally {
    if (photoId) {
      const deleteResponse = await request.delete(`${apiBase}/photos/${encodeURIComponent(photoId)}`);
      expect([204, 404]).toContain(deleteResponse.status());
    }
    await cdp.detach();
  }
});
