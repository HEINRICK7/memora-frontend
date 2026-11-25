"use client";

import { MEU_NIVER_SCENE } from "../../domain/templates/meu-niver-scene";
import { BrandHeader } from "../components/brand-header";
import { AnimatedTemplateStage } from "./animated-template-stage";
import type { FiberCanvasModule } from "./animated-template-stage";

function loadMeuNiverCanvas(): Promise<FiberCanvasModule> {
  return import("./meu-niver-canvas");
}

type MeuNiverStageProps = {
  webglAvailable?: boolean;
  reducedMotion?: boolean;
  loadCanvas?: () => Promise<FiberCanvasModule>;
};

export function MeuNiverStage({
  webglAvailable,
  reducedMotion,
  loadCanvas,
}: MeuNiverStageProps) {
  return (
    <div className="memora-shell meu-niver-page">
      <BrandHeader activePage="templates" />
      <main className="meu-niver-main">
        <p className="eyebrow">cena 3D</p>
        <h1>{MEU_NIVER_SCENE.title}</h1>
        <p className="meu-niver-lead">
          Toque numa foto para aproximar. As imagens desta cena são exemplos da marca.
        </p>
        <div className="meu-niver-viewport">
          <AnimatedTemplateStage
            className="meu-niver-canvas-host"
            label="Cena Meu Niver 3D"
            playback="loop"
            webglAvailable={webglAvailable}
            reducedMotion={reducedMotion}
            loadCanvas={loadCanvas ?? loadMeuNiverCanvas}
            fallback={
              <img
                className="meu-niver-fallback"
                src={MEU_NIVER_SCENE.coverSrc}
                alt="Colagem estática de Meu Niver, usada quando a cena 3D não abre"
              />
            }
          />
          <p className="meu-niver-title" aria-hidden="true">{MEU_NIVER_SCENE.title}</p>
        </div>
        <a className="button button-secondary" href="/templates">Voltar aos templates</a>
      </main>
    </div>
  );
}
