"use client";

import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export interface ConstellationNode {
  id: string;
  label: string;
  kind: "career" | "skill";
  /** 0–100 match, careers only */
  score?: number;
  links?: string[]; // skill ids for careers
}

function fibonacciSphere(n: number, r: number, jitter = 0) {
  const pts: THREE.Vector3[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = g * i + jitter;
    pts.push(new THREE.Vector3(Math.cos(th) * rad * r, y * r * 0.82, Math.sin(th) * rad * r));
  }
  return pts;
}

function Scene({ nodes, onSelect, highlight }: { nodes: ConstellationNode[]; onSelect?: (id: string) => void; highlight?: string | null }) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState<string | null>(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const careers = nodes.filter((n) => n.kind === "career");
  const skills = nodes.filter((n) => n.kind === "skill");

  const pos = useMemo(() => {
    const m = new Map<string, THREE.Vector3>();
    fibonacciSphere(careers.length, 2.15, 0.4).forEach((v, i) => m.set(careers[i].id, v));
    fibonacciSphere(skills.length, 1.05, 1.3).forEach((v, i) => m.set(skills[i].id, v));
    return m;
  }, [careers, skills]);

  const active = hover ?? highlight ?? null;
  const activeLinks = new Set<string>();
  if (active) {
    const n = nodes.find((x) => x.id === active);
    if (n?.kind === "career") n.links?.forEach((l) => activeLinks.add(l));
    if (n?.kind === "skill") careers.filter((c) => c.links?.includes(n.id)).forEach((c) => activeLinks.add(c.id));
  }

  useFrame(({ clock }, dt) => {
    if (!group.current || reduced) return;
    if (!hover) group.current.rotation.y += dt * 0.07;
    group.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.04;
  });

  return (
    <group ref={group}>
      {careers.flatMap((c) =>
        (c.links ?? []).map((s) => {
          const a = pos.get(c.id), b = pos.get(s);
          if (!a || !b) return null;
          const on = active === c.id || active === s;
          return <Line key={`${c.id}-${s}`} points={[a, b]} color={on ? "#5EEAB0" : "#8EA8FF"} lineWidth={on ? 1.6 : 0.6} transparent opacity={on ? 0.95 : active ? 0.05 : 0.16} />;
        }),
      )}
      {nodes.map((n) => {
        const p = pos.get(n.id)!;
        const isCareer = n.kind === "career";
        const dim = active && active !== n.id && !activeLinks.has(n.id);
        const s = isCareer ? 0.045 + ((n.score ?? 55) / 100) * 0.045 : 0.026;
        const color = isCareer ? (n.score == null ? "#7FE7BF" : n.score >= 70 ? "#5EEAB0" : "#9FB2E8") : "#6F86D6";
        return (
          <group key={n.id} position={p}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setHover(n.id);
                document.body.style.cursor = isCareer && onSelect ? "pointer" : "default";
              }}
              onPointerOut={() => {
                setHover(null);
                document.body.style.cursor = "";
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isCareer) onSelect?.(n.id);
              }}
            >
              <sphereGeometry args={[s, 24, 24]} />
              <meshBasicMaterial color={color} transparent opacity={dim ? 0.18 : 1} />
            </mesh>
            {isCareer && (
              <mesh scale={2.8}>
                <sphereGeometry args={[s, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={dim ? 0.02 : active === n.id ? 0.28 : 0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            )}
            {(isCareer || active === n.id || activeLinks.has(n.id)) && (
              <Html center distanceFactor={4.2} style={{ pointerEvents: "none", opacity: dim ? 0.25 : 1, transition: "opacity 200ms" }} zIndexRange={[10, 0]}>
                <div className={isCareer ? "translate-y-7 whitespace-nowrap text-center" : "translate-y-5 whitespace-nowrap text-center"}>
                  <span className={isCareer ? "rounded bg-night-900/70 px-1.5 py-0.5 text-[12px] font-medium text-night-100 backdrop-blur" : "text-[11px] text-night-300"}>
                    {n.label}
                    {isCareer && n.score != null && <span className="ml-1.5 font-mono text-[11px] text-mint">{n.score}%</span>}
                  </span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Dust() {
  const geo = useMemo(() => {
    const n = 500;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) new THREE.Vector3().randomDirection().multiplyScalar(3 + Math.random() * 5).toArray(arr, i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.02} color="#8EA8FF" transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function Constellation({ nodes, onSelect, highlight, className, interactive = true }: { nodes: ConstellationNode[]; onSelect?: (id: string) => void; highlight?: string | null; className?: string; interactive?: boolean }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setOk(false);
    }
    return () => {
      document.body.style.cursor = "";
    };
  }, []);
  if (!ok) return <div className={className} aria-hidden />;
  return (
    <div className={className} role="img" aria-label="Interactive 3D map of careers and the skills they share">
      <Canvas camera={{ position: [0, 0.4, 5.4], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <Dust />
        <Scene nodes={nodes} onSelect={onSelect} highlight={highlight} />
        {interactive && <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} rotateSpeed={0.5} />}
      </Canvas>
    </div>
  );
}
