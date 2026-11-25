"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Shape, ShapeGeometry, SRGBColorSpace, Texture, TextureLoader } from "three";
import type { Group, Mesh } from "three";
import { MEU_NIVER_SCENE } from "../../domain/templates/meu-niver-scene";
import type { MeuNiverPhoto } from "../../domain/templates/meu-niver-scene";
import type { FiberCanvasProps } from "./fiber-canvas";

const CONFETTI = [
  [-2.3, 1.7, -0.4],
  [-1.1, 1.85, 0.2],
  [0.8, 1.9, -0.1],
  [2.2, 1.45, 0.3],
  [-2.1, -1.5, 0.1],
  [2.3, -1.35, -0.2],
] as const;

function useSceneTexture(src: string): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let active = true;
    const loader = new TextureLoader();
    const loaded = loader.load(src, (next) => {
      next.colorSpace = SRGBColorSpace;
      next.needsUpdate = true;
      if (active) setTexture(next);
    });
    return () => {
      active = false;
      loaded.dispose();
    };
  }, [src]);

  return texture;
}

function PhotoPlane({
  photo,
  selected,
  animate,
  onSelect,
}: {
  photo: MeuNiverPhoto;
  selected: boolean;
  animate: boolean;
  onSelect: (id: string) => void;
}) {
  const texture = useSceneTexture(photo.src);
  const mesh = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!animate || !mesh.current) return;
    mesh.current.position.y = photo.position[1] + Math.sin(clock.elapsedTime * 0.7 + photo.position[0]) * 0.05;
  });

  return (
    <mesh
      ref={mesh}
      position={[photo.position[0], photo.position[1], selected ? 1.7 : photo.position[2]]}
      rotation={[photo.rotation[0], photo.rotation[1], photo.rotation[2]]}
      scale={selected ? 1.22 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(photo.id);
      }}
    >
      <planeGeometry args={[photo.size[0], photo.size[1]]} />
      {texture ? (
        <meshBasicMaterial key="photo" map={texture} toneMapped={false} />
      ) : (
        <meshBasicMaterial key="wait" color="#191d20" toneMapped={false} />
      )}
    </mesh>
  );
}

function Star() {
  const geometry = useMemo(() => {
    const shape = new Shape();
    const spikes = 5;
    for (let index = 0; index < spikes * 2; index += 1) {
      const radius = index % 2 === 0 ? 0.42 : 0.18;
      const angle = (index * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return new ShapeGeometry(shape);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} position={[-2.15, 1.55, 0.8]} rotation={[0, 0, 0.2]}>
      <meshBasicMaterial color={MEU_NIVER_SCENE.star} />
    </mesh>
  );
}

function Confetti({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!animate || !group.current) return;
    group.current.rotation.z += delta * 0.15;
  });

  return (
    <group ref={group}>
      {CONFETTI.map((position) => (
        <mesh key={position.join(":")} position={position}>
          <circleGeometry args={[0.08, 6]} />
          <meshBasicMaterial color={MEU_NIVER_SCENE.confetti} />
        </mesh>
      ))}
    </group>
  );
}

export default function MeuNiverCanvas({ frameloop, label }: FiberCanvasProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const playback = hidden || frameloop === "never" ? "never" : frameloop;
  const animate = playback === "always";

  return (
    <Canvas
      frameloop={playback}
      aria-label={label}
      camera={{ position: [0, 0, 7.2], fov: 34 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      onPointerMissed={() => setSelected(null)}
    >
      <color attach="background" args={[MEU_NIVER_SCENE.background]} />
      {MEU_NIVER_SCENE.photos.map((photo) => (
        <PhotoPlane
          key={photo.id}
          photo={photo}
          selected={selected === photo.id}
          animate={animate}
          onSelect={(id) => setSelected((current) => (current === id ? null : id))}
        />
      ))}
      <Star />
      <Confetti animate={animate} />
    </Canvas>
  );
}
