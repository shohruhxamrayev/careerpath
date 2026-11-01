"use client";

import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export interface GlobePoint {
  id: string;
  label: string;
  sub?: string;
  lat: number;
  lng: number;
  /** 0–1 emphasis (e.g. match score) — brighter and larger */
  weight?: number;
}

export interface GlobeProps {
  points: GlobePoint[];
  /** Draw arcs from this origin to `arcTo` point ids */
  origin?: { lat: number; lng: number; label?: string };
  arcTo?: string[];
  focusId?: string | null;
  interactive?: boolean;
  /** allow wheel/pinch zoom (off on pages where the globe sits inside scrolling content) */
  zoom?: boolean;
  autoRotate?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  className?: string;
}

const R = 1;

export function toVec(lat: number, lng: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.9)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.beginPath();
  g.arc(32, 32, 32, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: { c: { value: new THREE.Color("#3FD6A0") } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 c; varying vec3 vN; void main(){ float i = pow(max(0.0, 0.62 - dot(vN, vec3(0.0,0.0,1.0))), 3.2); gl_FragColor = vec4(c, 1.0) * i * 0.75; }`,
      }),
    [],
  );
  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[R, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function Land({ tex }: { tex: THREE.Texture }) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/globe-land.json")
      .then((r) => r.json())
      .then((pts: [number, number][]) => {
        if (!alive) return;
        const arr = new Float32Array(pts.length * 3);
        pts.forEach(([lat, lng], i) => toVec(lat, lng, R * 1.001).toArray(arr, i * 3));
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        setGeo(g);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!geo) return null;
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.02} map={tex} transparent alphaTest={0.05} color="#46607A" depthWrite={false} sizeAttenuation />
    </points>
  );
}

function Markers({ points, tex, onHover, onSelect, hovered }: { points: GlobePoint[]; tex: THREE.Texture; hovered: string | null; onHover: (id: string | null) => void; onSelect?: (id: string) => void }) {
  const geo = useMemo(() => {
    const pos = new Float32Array(points.length * 3);
    const col = new Float32Array(points.length * 3);
    const base = new THREE.Color("#5EEAB0");
    const cool = new THREE.Color("#8EA8FF");
    points.forEach((p, i) => {
      toVec(p.lat, p.lng, R * 1.012).toArray(pos, i * 3);
      const c = cool.clone().lerp(base, p.weight ?? 0.6);
      c.toArray(col, i * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [points]);
  const hp = hovered ? points.find((p) => p.id === hovered) : undefined;
  return (
    <group>
      <points
        geometry={geo}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (e.index != null) onHover(points[e.index]?.id ?? null);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.index != null && onSelect) onSelect(points[e.index].id);
        }}
      >
        <pointsMaterial size={0.055} map={tex} vertexColors transparent alphaTest={0.05} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
      {hp && (
        <group position={toVec(hp.lat, hp.lng, R * 1.02)}>
          <mesh>
            <sphereGeometry args={[0.022, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <Html style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
            <div className="-translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-md border border-white/15 bg-night-900/90 px-3 py-2 text-left shadow-pop backdrop-blur">
              <div className="text-[13px] font-semibold text-white">{hp.label}</div>
              {hp.sub && <div className="text-[11px] text-night-300">{hp.sub}</div>}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

function Arc({ from, to, delay }: { from: THREE.Vector3; to: THREE.Vector3; delay: number }) {
  const ref = useRef<{ material: { dashOffset: number } } | null>(null);
  const pts = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const dist = from.distanceTo(to);
    mid.normalize().multiplyScalar(R + 0.15 + dist * 0.35);
    return new THREE.QuadraticBezierCurve3(from, mid, to).getPoints(48);
  }, [from, to]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.material.dashOffset -= dt * 0.35;
  });
  return (
    <Line
      ref={ref as any}
      points={pts}
      color="#5EEAB0"
      lineWidth={1.2}
      transparent
      opacity={0.75}
      dashed
      dashScale={6}
      dashSize={0.5}
      gapSize={0.35}
      dashOffset={delay}
    />
  );
}

function Scene({ points, origin, arcTo, focusId, interactive, zoom, autoRotate, onSelect, onHover }: GlobeProps) {
  const group = useRef<THREE.Group>(null);
  const tex = useMemo(() => dotTexture(), []);
  const [hovered, setHovered] = useState<string | null>(null);
  const target = useRef<{ y: number; x: number } | null>(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const p = focusId ? points.find((x) => x.id === focusId) : null;
    if (!p) {
      target.current = null;
      return;
    }
    const v = toVec(p.lat, p.lng);
    target.current = { y: -Math.atan2(v.x, v.z), x: (p.lat * Math.PI) / 180 * 0.55 };
  }, [focusId, points]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (target.current) {
      // shortest-path rotation toward the focused point
      let dy = target.current.y - g.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      g.rotation.y += dy * Math.min(1, dt * 3);
      g.rotation.x += (target.current.x - g.rotation.x) * Math.min(1, dt * 3);
    } else if (autoRotate && !hovered && !reduced) {
      g.rotation.y += dt * 0.08;
    }
  });

  const originVec = origin ? toVec(origin.lat, origin.lng, R * 1.012) : null;
  const arcTargets = (arcTo ?? []).map((id) => points.find((p) => p.id === id)).filter(Boolean) as GlobePoint[];

  return (
    <>
      <ambientLight intensity={0.6} />
      <group ref={group} rotation={[0.35, origin ? -Math.atan2(toVec(origin.lat, origin.lng).x, toVec(origin.lat, origin.lng).z) : 0, 0]}>
        <mesh>
          <sphereGeometry args={[R, 64, 64]} />
          <meshBasicMaterial color="#0A1018" />
        </mesh>
        <Land tex={tex} />
        <Markers
          points={points}
          tex={tex}
          hovered={hovered}
          onHover={(id) => {
            setHovered(id);
            onHover?.(id);
            document.body.style.cursor = id && onSelect ? "pointer" : "";
          }}
          onSelect={onSelect}
        />
        {originVec && (
          <group position={originVec}>
            <mesh>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshBasicMaterial color="#FFD27A" />
            </mesh>
            {origin?.label && (
              <Html style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
                <div className="-translate-x-1/2 translate-y-2 whitespace-nowrap rounded bg-sun px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-night-900">{origin.label}</div>
              </Html>
            )}
          </group>
        )}
        {originVec && arcTargets.map((p, i) => <Arc key={p.id} from={originVec} to={toVec(p.lat, p.lng, R * 1.012)} delay={i * 0.3} />)}
      </group>
      <Atmosphere />
      {interactive && <OrbitControls enablePan={false} enableZoom={!!zoom} minDistance={1.8} maxDistance={4.2} rotateSpeed={0.5} zoomSpeed={0.6} />}
    </>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Globe(props: GlobeProps) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(hasWebGL()), []);
  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);
  if (ok === false) return <GlobeFallback className={props.className} />;
  if (ok === null) return <div className={props.className} aria-hidden />;
  return (
    <div className={props.className} role="img" aria-label="Interactive globe showing universities in the CareerPath dataset">
      <Canvas camera={{ position: [0, 0, 3.25], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <Scene {...props} />
      </Canvas>
    </div>
  );
}

export function GlobeFallback({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative mx-auto aspect-square h-full max-h-full">
        <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#16202d,#070a0f_70%)] shadow-[0_0_120px_20px_rgba(94,234,176,0.12)]" />
        <div className="absolute inset-[8%] rounded-full [background:repeating-linear-gradient(0deg,transparent_0_14px,rgba(94,234,176,0.06)_14px_15px),repeating-linear-gradient(90deg,transparent_0_14px,rgba(94,234,176,0.06)_14px_15px)] [mask-image:radial-gradient(circle,black_60%,transparent_71%)]" />
      </div>
    </div>
  );
}
