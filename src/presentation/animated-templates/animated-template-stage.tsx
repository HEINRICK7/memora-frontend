"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import type { FiberCanvasProps } from "./fiber-canvas";

export type FiberCanvasModule = {
  default: ComponentType<FiberCanvasProps>;
};

type AnimatedTemplateStageProps = {
  label: string;
  fallback: ReactNode;
  reducedMotion?: boolean;
  webglAvailable?: boolean;
  playback?: "demand" | "loop";
  className?: string;
  loadCanvas?: () => Promise<FiberCanvasModule>;
};

function loadFiberCanvas(): Promise<FiberCanvasModule> {
  return import("./fiber-canvas");
}

function detectWebgl(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function detectReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AnimatedTemplateStage({
  label,
  fallback,
  reducedMotion,
  webglAvailable,
  playback = "demand",
  className,
  loadCanvas = loadFiberCanvas,
}: AnimatedTemplateStageProps) {
  const [available, setAvailable] = useState(webglAvailable ?? false);
  const [motionReduced, setMotionReduced] = useState(reducedMotion ?? false);
  const [CanvasView, setCanvasView] = useState<ComponentType<FiberCanvasProps> | null>(null);

  useEffect(() => {
    if (webglAvailable !== undefined) {
      setAvailable(webglAvailable);
      return;
    }
    setAvailable(detectWebgl());
  }, [webglAvailable]);

  useEffect(() => {
    if (reducedMotion !== undefined) {
      setMotionReduced(reducedMotion);
      return;
    }
    setMotionReduced(detectReducedMotion());
  }, [reducedMotion]);

  useEffect(() => {
    if (!available) {
      setCanvasView(null);
      return;
    }
    let cancelled = false;
    void loadCanvas().then((module) => {
      if (!cancelled) setCanvasView(() => module.default);
    });
    return () => {
      cancelled = true;
    };
  }, [available, loadCanvas]);

  const stageClassName = className
    ? `animated-template-stage ${className}`
    : "animated-template-stage";

  if (!available || !CanvasView) {
    return <div className={stageClassName}>{fallback}</div>;
  }

  return (
    <div className={stageClassName} style={{ width: "100%", height: "100%", minHeight: 240 }}>
      <CanvasView
        frameloop={motionReduced ? "never" : playback === "loop" ? "always" : "demand"}
        label={label}
      />
    </div>
  );
}
