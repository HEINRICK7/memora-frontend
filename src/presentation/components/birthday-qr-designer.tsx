"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { QrCornerStyle, QrDesign, QrDotStyle } from "../../infrastructure/qr-design-renderer";
import { createQrDesignSvg, qrSvgDataUrl } from "../../infrastructure/qr-design-renderer";
import { muralApiGateway } from "../../infrastructure/mural-api-gateway";
import styles from "./birthday-qr-designer.module.css";

type BirthdayQrDesignerProps = {
  muralId: string;
  eventName: string;
  shareUrl: string;
};

type QrPresetName = "classic" | "soft" | "honey" | "event" | "custom";

const DEFAULT_DESIGN: QrDesign = {
  codeColor: "#191d20",
  cornerColor: "#191d20",
  backgroundColor: "#ffffff",
  transparentBackground: false,
  dotStyle: "square",
  cornerStyle: "square",
  margin: 4,
  logoDataUrl: null,
  showLogo: true,
  logoScale: 0.26,
  caption: "Escaneie para enviar suas fotos",
};

const PRESETS: Array<{
  name: QrPresetName;
  label: string;
  changes: Partial<QrDesign>;
}> = [
  {
    name: "classic",
    label: "Clássico",
    changes: { codeColor: "#191d20", cornerColor: "#191d20", backgroundColor: "#ffffff", dotStyle: "square", cornerStyle: "square" },
  },
  {
    name: "soft",
    label: "Suave",
    changes: { codeColor: "#191d20", cornerColor: "#191d20", backgroundColor: "#f7f7f2", dotStyle: "rounded", cornerStyle: "rounded" },
  },
  {
    name: "honey",
    label: "Lima",
    changes: { codeColor: "#191d20", cornerColor: "#191d20", backgroundColor: "#d9fd61", dotStyle: "round", cornerStyle: "rounded" },
  },
  {
    name: "event",
    label: "Cor da festa",
    changes: { codeColor: "#191d20", cornerColor: "#475cfa", backgroundColor: "#ffffff", dotStyle: "rounded", cornerStyle: "circle" },
  },
];

const DOT_OPTIONS: Array<{ value: QrDotStyle; label: string }> = [
  { value: "square", label: "Quadrado" },
  { value: "rounded", label: "Suave" },
  { value: "round", label: "Redondo" },
];

const CORNER_OPTIONS: Array<{ value: QrCornerStyle; label: string }> = [
  { value: "square", label: "Quadrado" },
  { value: "rounded", label: "Arredondado" },
  { value: "circle", label: "Círculo" },
];

function storageKey(muralId: string) {
  return `memora:qr-design:${muralId}`;
}

function restoreDesign(muralId: string): QrDesign {
  try {
    const saved = window.localStorage.getItem(storageKey(muralId));
    if (!saved) return DEFAULT_DESIGN;
    const parsed = JSON.parse(saved) as Partial<QrDesign>;
    return {
      ...DEFAULT_DESIGN,
      ...parsed,
      codeColor: /^#[\da-f]{6}$/i.test(parsed.codeColor ?? "") ? parsed.codeColor! : DEFAULT_DESIGN.codeColor,
      cornerColor: /^#[\da-f]{6}$/i.test(parsed.cornerColor ?? "") ? parsed.cornerColor! : DEFAULT_DESIGN.cornerColor,
      backgroundColor: /^#[\da-f]{6}$/i.test(parsed.backgroundColor ?? "") ? parsed.backgroundColor! : DEFAULT_DESIGN.backgroundColor,
      logoDataUrl: typeof parsed.logoDataUrl === "string" && parsed.logoDataUrl.startsWith("data:image/png;base64,")
        ? parsed.logoDataUrl
        : null,
      caption: typeof parsed.caption === "string" ? parsed.caption.slice(0, 48) : DEFAULT_DESIGN.caption,
      margin: typeof parsed.margin === "number" ? Math.max(0, Math.min(8, parsed.margin)) : DEFAULT_DESIGN.margin,
      logoScale: typeof parsed.logoScale === "number" ? Math.max(0.16, Math.min(0.34, parsed.logoScale)) : DEFAULT_DESIGN.logoScale,
    };
  } catch {
    return DEFAULT_DESIGN;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function makePng(svg: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = image.naturalHeight || size;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Não foi possível preparar a imagem."));
        return;
      }
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, size, canvas.height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível exportar o PNG.")), "image/png");
    };
    image.onerror = () => reject(new Error("Não foi possível renderizar o QR Code."));
    image.src = qrSvgDataUrl(svg);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function detectTightLogoBounds(
  image: HTMLImageElement,
): { sx: number; sy: number; sw: number; sh: number } {
  const fallback = { sx: 0, sy: 0, sw: image.width, sh: image.height };
  try {
    const probeMax = 512;
    const probeScale = Math.min(1, probeMax / Math.max(image.width, image.height));
    const pw = Math.max(1, Math.round(image.width * probeScale));
    const ph = Math.max(1, Math.round(image.height * probeScale));
    const probe = document.createElement("canvas");
    probe.width = pw;
    probe.height = ph;
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    ctx.drawImage(image, 0, 0, pw, ph);
    const { data } = ctx.getImageData(0, 0, pw, ph);

    const cornerIndices = [
      0,
      (pw - 1) * 4,
      (ph - 1) * pw * 4,
      ((ph - 1) * pw + (pw - 1)) * 4,
    ];
    const hasTransparentCorner = cornerIndices.some((i) => data[i + 3] < 240);
    const hasNearWhiteCorners = !hasTransparentCorner
      && cornerIndices.every((i) => data[i] >= 242 && data[i + 1] >= 242 && data[i + 2] >= 242);

    let minX = pw;
    let minY = ph;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < ph; y += 1) {
      for (let x = 0; x < pw; x += 1) {
        const i = (y * pw + x) * 4;
        const alpha = data[i + 3];
        if (alpha <= 16) continue;
        if (hasNearWhiteCorners && data[i] >= 244 && data[i + 1] >= 244 && data[i + 2] >= 244) {
          continue;
        }
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX <= minX || maxY <= minY) return fallback;

    const sx = Math.max(0, Math.floor(minX / probeScale));
    const sy = Math.max(0, Math.floor(minY / probeScale));
    const ex = Math.min(image.width, Math.ceil((maxX + 1) / probeScale));
    const ey = Math.min(image.height, Math.ceil((maxY + 1) / probeScale));
    const sw = ex - sx;
    const sh = ey - sy;
    if (sw < 8 || sh < 8) return fallback;
    return { sx, sy, sw, sh };
  } catch {
    return fallback;
  }
}

function prepareLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Escolha uma imagem PNG, JPEG ou WebP válida."));
      image.onload = () => {
        const outSize = 512;
        const innerSize = 492;
        const canvas = document.createElement("canvas");
        canvas.width = outSize;
        canvas.height = outSize;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Não foi possível preparar o logo."));
          return;
        }
        const bounds = detectTightLogoBounds(image);
        const scale = Math.min(innerSize / bounds.sw, innerSize / bounds.sh);
        const width = bounds.sw * scale;
        const height = bounds.sh * scale;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(
          image,
          bounds.sx,
          bounds.sy,
          bounds.sw,
          bounds.sh,
          (outSize - width) / 2,
          (outSize - height) / 2,
          width,
          height,
        );
        resolve(canvas.toDataURL("image/png"));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível carregar o logo salvo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export function BirthdayQrDesigner({ muralId, eventName, shareUrl }: BirthdayQrDesignerProps) {
  const [design, setDesign] = useState<QrDesign>(DEFAULT_DESIGN);
  const [preset, setPreset] = useState<QrPresetName>("classic");
  const [size, setSize] = useState(2048);
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    let active = true;
    const restored = restoreDesign(muralId);
    setDesign(restored);
    setPreset("custom");
    setSaved(false);
    if (!restored.logoDataUrl && muralApiGateway.getQrLogo) {
      void (async () => {
        try {
          const remote = await muralApiGateway.getQrLogo?.(muralId);
          if (!active || !remote?.logoUrl) return;
          const response = await fetch(remote.logoUrl, { cache: "no-store" });
          if (!active || !response.ok) return;
          const logoDataUrl = await blobToDataUrl(await response.blob());
          if (active) setDesign((current) => current.logoDataUrl ? current : { ...current, logoDataUrl });
        } catch {
          if (active) setStatus("Não foi possível carregar o logo salvo na festa.");
        }
      })();
    }
    return () => { active = false; };
  }, [muralId]);

  const qrSvg = useMemo(() => {
    try {
      return createQrDesignSvg(shareUrl, design, 640);
    } catch {
      return null;
    }
  }, [design, shareUrl]);

  useEffect(() => setQrError(!qrSvg), [qrSvg]);

  function updateDesign(change: Partial<QrDesign>, fromPreset = false) {
    setDesign((current) => ({ ...current, ...change }));
    if (!fromPreset) setPreset("custom");
    setSaved(false);
    setStatus("");
  }

  function applyPreset(name: QrPresetName) {
    const selected = PRESETS.find((item) => item.name === name);
    if (!selected) return;
    updateDesign(selected.changes, true);
    setPreset(name);
  }

  async function saveDesign() {
    try {
      window.localStorage.setItem(storageKey(muralId), JSON.stringify(design));
      if (design.logoDataUrl) {
        if (!muralApiGateway.saveQrLogo) throw new Error("Não foi possível salvar o logo na festa.");
        await muralApiGateway.saveQrLogo(muralId, design.logoDataUrl);
      } else if (muralApiGateway.deleteQrLogo) {
        await muralApiGateway.deleteQrLogo(muralId);
      }
      setSaved(true);
      setStatus(design.logoDataUrl
        ? "Personalização salva. O logo também aparece para os convidados."
        : "Personalização salva neste aparelho.");
    } catch {
      setSaved(false);
      setStatus("Não foi possível salvar a personalização ou o logo da festa.");
    }
  }

  async function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setStatus("Use uma imagem PNG, JPEG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus("O logo deve ter até 5 MB.");
      return;
    }
    try {
      updateDesign({ logoDataUrl: await prepareLogo(file), showLogo: true });
      setStatus("Logo aplicado ao QR.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Não foi possível carregar o logo.");
    }
  }

  async function exportPng() {
    if (!qrSvg) return;
    try {
      const blob = await makePng(createQrDesignSvg(shareUrl, design, size, true), size);
      downloadBlob(blob, `memora-qr-${size}px.png`);
      setStatus(`PNG de ${size} px baixado.`);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Não foi possível exportar PNG.");
    }
  }

  function exportSvg() {
    if (!qrSvg) return;
    const svg = createQrDesignSvg(shareUrl, design, size, true);
    downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "memora-qr.svg");
    setStatus("SVG vetorial baixado.");
  }

  function printTableCard() {
    if (!qrSvg) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setStatus("Permita abrir uma nova aba para imprimir o cartão A4.");
      return;
    }
    const safeEventName = escapeHtml(eventName);
    const safeCaption = escapeHtml(design.caption);
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QR Code — ${safeEventName}</title><style>
      @page{size:A4;margin:18mm}*{box-sizing:border-box}body{margin:0;color:#191d20;font:16px Arial,sans-serif}.card{height:261mm;display:grid;place-items:center;text-align:center}.content{width:150mm;padding:16mm;border:1px solid #e3e3dc;border-radius:10mm}.brand{font-size:14pt;font-weight:700;letter-spacing:-.04em;text-transform:lowercase}.event{margin:6mm 0 10mm;font-size:25pt;font-weight:700}.qr{display:block;width:104mm;height:104mm;margin:0 auto}.caption{margin:7mm 0 0;font-size:14pt;font-weight:700}
      </style></head><body><main class="card"><section class="content"><div class="brand">memora</div><h1 class="event">${safeEventName}</h1><img class="qr" alt="QR Code da festa" /><p class="caption">${safeCaption}</p></section></main></body></html>`);
    const qrImage = printWindow.document.querySelector<HTMLImageElement>(".qr");
    if (qrImage) {
      qrImage.onload = () => window.setTimeout(() => printWindow.print(), 300);
      qrImage.onerror = () => setStatus("Não foi possível preparar a impressão do cartão.");
      qrImage.src = qrSvgDataUrl(createQrDesignSvg(shareUrl, { ...design, transparentBackground: false }, 1100));
    }
    printWindow.document.close();
    setStatus("Cartão A4 pronto para imprimir ou salvar como PDF.");
  }

  const previewUrl = qrSvg ? qrSvgDataUrl(qrSvg) : "";

  return (
    <section className={styles.designer} aria-label="Editor do QR Code da festa">
      <div className={styles.heading}>
        <div>
          <h2>Personalize o QR da festa</h2>
          <p>O QR abre este aniversário. Ajuste o visual e imprima um cartão para as mesas.</p>
        </div>
        {saved && <span className={styles.saved} role="status">Personalização salva</span>}
      </div>

      <div className={styles.layout}>
        <div className={styles.previewCard}>
          <div className={styles.qrPaper}>
            {qrError ? (
              <p role="alert">Não foi possível gerar o QR Code para este link.</p>
            ) : (
              <img className={styles.qrImage} src={previewUrl} alt={`QR Code para enviar fotos para ${eventName}`} />
            )}
            <div className={`${styles.caption} ${design.caption ? "" : styles.captionEmpty}`}>
              {design.caption}
            </div>
          </div>
          <div className={styles.sizeRow}>
            <label htmlFor="qr-export-size">Tamanho</label>
            <select id="qr-export-size" value={size} onChange={(event) => setSize(Number(event.target.value))}>
              <option value={512}>512 px</option>
              <option value={1024}>1024 px</option>
              <option value={2048}>2048 px</option>
              <option value={4096}>4096 px</option>
            </select>
          </div>
          <div className={styles.downloadRow}>
            <button className="button button-secondary" type="button" onClick={() => void exportPng()} disabled={qrError}>Baixar PNG</button>
            <button className="button button-secondary" type="button" onClick={exportSvg} disabled={qrError}>Baixar SVG</button>
            <button className="button button-secondary" type="button" onClick={printTableCard} disabled={qrError}>Cartão A4</button>
          </div>
        </div>

        <div className={styles.controls}>
          <section className={styles.section} aria-labelledby="qr-presets-title">
            <h3 className={styles.sectionTitle} id="qr-presets-title">Estilos prontos</h3>
            <div className={styles.presets}>
              {PRESETS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  aria-pressed={preset === item.name}
                  className={`${styles.choice} ${preset === item.name ? styles.choiceSelected : ""}`}
                  onClick={() => applyPreset(item.name)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="qr-colors-title">
            <h3 className={styles.sectionTitle} id="qr-colors-title">Cores</h3>
            <div className={styles.colors}>
              <label className={styles.colorPicker}>QR <input aria-label="Cor do QR" type="color" value={design.codeColor} onChange={(event) => updateDesign({ codeColor: event.target.value })} /></label>
              <label className={styles.colorPicker}>Cantos <input aria-label="Cor dos cantos" type="color" value={design.cornerColor} onChange={(event) => updateDesign({ cornerColor: event.target.value })} /></label>
              <label className={styles.colorPicker}>Fundo <input aria-label="Cor do fundo" type="color" value={design.backgroundColor} onChange={(event) => updateDesign({ backgroundColor: event.target.value })} /></label>
            </div>
            <label className={styles.toggleRow}>
              <span>Fundo transparente</span>
              <input type="checkbox" checked={design.transparentBackground} onChange={(event) => updateDesign({ transparentBackground: event.target.checked })} />
            </label>
          </section>

          <section className={styles.section} aria-labelledby="qr-shapes-title">
            <h3 className={styles.sectionTitle} id="qr-shapes-title">Formato dos pontos</h3>
            <div className={styles.segmented}>
              {DOT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={design.dotStyle === option.value}
                  className={`${styles.choice} ${design.dotStyle === option.value ? styles.choiceSelected : ""}`}
                  onClick={() => updateDesign({ dotStyle: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <h3 className={styles.sectionTitle}>Formato dos cantos</h3>
            <div className={styles.segmented}>
              {CORNER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={design.cornerStyle === option.value}
                  className={`${styles.choice} ${design.cornerStyle === option.value ? styles.choiceSelected : ""}`}
                  onClick={() => updateDesign({ cornerStyle: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className={styles.rangeRow}>
              <span>Margem</span>
              <input aria-label="Margem do QR" type="range" min={0} max={8} step={1} value={design.margin} onChange={(event) => updateDesign({ margin: Number(event.target.value) })} />
              <span className={styles.rangeValue}>{design.margin}</span>
            </label>
          </section>

          <section className={styles.section} aria-labelledby="qr-logo-title">
            <h3 className={styles.sectionTitle} id="qr-logo-title">Logo da festa</h3>
            <div className={styles.logoRow}>
              {design.logoDataUrl && <img className={styles.logoThumb} src={design.logoDataUrl} alt="Logo escolhido para o QR" />}
              <label className={styles.logoUpload}>
                {design.logoDataUrl ? "Trocar logo" : "Enviar logo"}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectLogo(event)} />
              </label>
              {design.logoDataUrl && (
                <button className="button button-secondary" type="button" onClick={() => updateDesign({ logoDataUrl: null })}>Remover</button>
              )}
            </div>
            <p className={styles.helper}>PNG, JPEG ou WebP até 5 MB. O arquivo é reduzido no seu aparelho.</p>
            <label className={styles.toggleRow}>
              <span>Mostrar logo no centro</span>
              <input type="checkbox" checked={design.showLogo} disabled={!design.logoDataUrl} onChange={(event) => updateDesign({ showLogo: event.target.checked })} />
            </label>
            <label className={styles.rangeRow}>
              <span>Tamanho do logo</span>
              <input aria-label="Tamanho do logo" type="range" min={16} max={34} step={2} disabled={!design.logoDataUrl || !design.showLogo} value={Math.round(design.logoScale * 100)} onChange={(event) => updateDesign({ logoScale: Number(event.target.value) / 100 })} />
              <span className={styles.rangeValue}>{Math.round(design.logoScale * 100)}%</span>
            </label>
          </section>

          <section className={styles.section} aria-labelledby="qr-caption-title">
            <h3 className={styles.sectionTitle} id="qr-caption-title">Legenda</h3>
            <input
              className={styles.captionInput}
              type="text"
              maxLength={48}
              value={design.caption}
              aria-label="Legenda abaixo do QR"
              placeholder="Ex.: Escaneie e envie suas fotos"
              onChange={(event) => updateDesign({ caption: event.target.value })}
            />
          </section>

          <div className={styles.actions}>
            <button className="button button-primary" type="button" onClick={() => void saveDesign()}>Salvar personalização</button>
          </div>
          <p className={styles.helper}>O logo salvo fica no MinIO da festa e aparece para os convidados. As outras opções visuais ficam neste aparelho; o endereço do convite só aparece no QR exportado após sua ação.</p>
          <p className={styles.status} role="status">{status}</p>
        </div>
      </div>
    </section>
  );
}
