"use client";

import { Canvas } from "@react-three/fiber";

export type FiberCanvasProps = {
  frameloop: "always" | "demand" | "never";
  label: string;
};

export default function FiberCanvas({ frameloop, label }: FiberCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "low-power" }}
      aria-label={label}
    >
      <color attach="background" args={["#F8F5EE"]} />
    </Canvas>
  );
}
