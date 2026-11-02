"use client";

import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useVisible } from "./useVisible";

export interface GlobePoint {
  id: string;
  label: string;
  sub?: string;
  lat: number;
  lng: number;
  /** 0–1 emphasis (e.g. match score or rank) — brighter and larger */
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
  /** light beams rising from the most important points */
  beams?: boolean;
  /** faint starfield behind the globe */
  stars?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  className?: string;
}

const R = 1;
const MINT = new THREE.Color("#8CCFB4");
const PERI = new THREE.Color("#A7B4DA");

export function toVec(lat: number, lng: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

// ───────────── surface: dark ocean with soft key light and fresnel rim ─────────────
function Surface() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { deep: { value: new THREE.Color("#0E1626") }, mid: { value: new THREE.Color("#1B2639") }, rim: { value: new THREE.Color("#6FB89B") } },
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 deep; uniform vec3 mid; uniform vec3 rim; varying vec3 vN; varying vec3 vV;
          void main(){
            float key = clamp(dot(vN, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
            vec3 col = mix(deep, mid, pow(key, 1.4));
            float f = pow(1.0 - clamp(dot(vN, vV), 0.0, 1.0), 3.0);
            col += rim * f * 0.55;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  return (
    <mesh>
      <sphereGeometry args={[R, 96, 96]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function Graticule() {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3) => pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    for (let lat = -60; lat <= 60; lat += 30) for (let lng = -180; lng < 180; lng += 4) push(toVec(lat, lng, 1.0015), toVec(lat, lng + 4, 1.0015));
    for (let lng = -180; lng < 180; lng += 30) for (let lat = -84; lat < 84; lat += 4) push(toVec(lat, lng, 1.0015), toVec(lat + 4, lng, 1.0015));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#8CCFB4" transparent opacity={0.045} depthWrite={false} />
    </lineSegments>
  );
}

function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: { c: { value: new THREE.Color("#7FC4A8") }, c2: { value: new THREE.Color("#8D9DCC") } },
        vertexShader: `varying vec3 vN; varying float vY; void main(){ vN = normalize(normalMatrix * normal); vY = normal.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 c; uniform vec3 c2; varying vec3 vN; varying float vY; void main(){ float i = pow(max(0.0, 0.64 - dot(vN, vec3(0.0,0.0,1.0))), 3.0); vec3 col = mix(c2, c, smoothstep(-0.6, 0.6, vY)); gl_FragColor = vec4(col, 1.0) * i * 0.8; }`,
      }),
    [],
  );
  return (
    <mesh scale={1.13}>
      <sphereGeometry args={[R, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ───────────── land: dots that fade toward the limb and light up on the sunny side ─────────────
const landVS = `uniform float size; uniform float scale; varying float vFace; varying float vKey;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFace = dot(n, normalize(-mv.xyz));
    vKey = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
    gl_PointSize = size * scale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const landFS = `uniform vec3 dim; uniform vec3 lit; varying float vFace; varying float vKey;
  void main(){
    vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.15, r) * smoothstep(-0.05, 0.45, vFace);
    gl_FragColor = vec4(mix(dim, lit, vKey), a * 0.95);
  }`;

function Land() {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { size: { value: 0.022 }, scale: { value: 520 }, dim: { value: new THREE.Color("#33435A") }, lit: { value: new THREE.Color("#A3BAD0") } }, vertexShader: landVS, fragmentShader: landFS }),
    [],
  );
  useEffect(() => {
    let alive = true;
    fetch("/globe-land.json")
      .then((r) => r.json())
      .then((pts: [number, number][]) => {
        if (!alive) return;
        const arr = new Float32Array(pts.length * 3);
        pts.forEach(([lat, lng], i) => toVec(lat, lng, R * 1.002).toArray(arr, i * 3));
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
  return <points geometry={geo} material={mat} />;
}

// ───────────── markers: glowing, size by weight, pulse on the important ones ─────────────
const markVS = `attribute float aSize; attribute vec3 aColor; attribute float aPulse; uniform float time; uniform float scale; varying vec3 vC; varying float vFace; varying float vP;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFace = dot(n, normalize(-mv.xyz));
    vC = aColor; vP = aPulse;
    float pulse = 1.0 + aPulse * 0.25 * sin(time * 2.6 + position.x * 9.0);
    gl_PointSize = aSize * pulse * scale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const markFS = `varying vec3 vC; varying float vFace; varying float vP;
  void main(){
    vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard;
    float core = smoothstep(0.22, 0.0, r);
    float halo = smoothstep(0.5, 0.0, r) * 0.55;
    float a = (core + halo) * smoothstep(-0.1, 0.3, vFace);
    gl_FragColor = vec4(vC * (0.7 + core * 0.9), a);
  }`;

function Markers({ points, onHover, onSelect, hovered, focusId }: { points: GlobePoint[]; hovered: string | null; focusId?: string | null; onHover: (id: string | null) => void; onSelect?: (id: string) => void }) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { time: { value: 0 }, scale: { value: 520 } }, vertexShader: markVS, fragmentShader: markFS }),
    [],
  );
  const geo = useMemo(() => {
    const pos = new Float32Array(points.length * 3);
    const col = new Float32Array(points.length * 3);
    const size = new Float32Array(points.length);
    const pulse = new Float32Array(points.length);
    points.forEach((p, i) => {
      const w = p.weight ?? 0.6;
      toVec(p.lat, p.lng, R * 1.012).toArray(pos, i * 3);
      PERI.clone().lerp(MINT, w).toArray(col, i * 3);
      size[i] = 0.05 + w * 0.05;
      pulse[i] = w > 0.85 ? 1 : 0;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPulse", new THREE.BufferAttribute(pulse, 1));
    return g;
  }, [points]);
  useFrame(({ clock }) => {
    mat.uniforms.time.value = clock.elapsedTime;
  });
  const hp = hovered ? points.find((p) => p.id === hovered) : focusId ? points.find((p) => p.id === focusId) : undefined;
  return (
    <group>
      <points
        geometry={geo}
        material={mat}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (e.index != null) onHover(points[e.index]?.id ?? null);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.index != null && onSelect) onSelect(points[e.index].id);
        }}
      />
      {hp && <Pin p={hp} label={!!hovered} />}
    </group>
  );
}

/** Highlight for the hovered/focused point: ring + label. */
function Pin({ p, label }: { p: GlobePoint; label: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => toVec(p.lat, p.lng, R * 1.014), [p]);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos]);
  useFrame(({ clock }) => {
    const m = ring.current;
    if (!m) return;
    const t = (clock.elapsedTime * 0.9) % 1;
    m.scale.setScalar(1 + t * 2.2);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t);
  });
  return (
    <group position={pos} quaternion={quat}>
      <mesh>
        <circleGeometry args={[0.016, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.022, 0.028, 40]} />
        <meshBasicMaterial color="#8CCFB4" transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {label && <Html style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
        <div className="-translate-x-1/2 -translate-y-[135%] whitespace-nowrap rounded-lg border border-white/15 bg-night-900/90 px-3 py-2 text-left shadow-pop backdrop-blur">
          <div className="text-[13px] font-semibold text-white">{p.label}</div>
          {p.sub && <div className="text-[11px] text-night-300">{p.sub}</div>}
        </div>
      </Html>}
    </group>
  );
}

function Beams({ points }: { points: GlobePoint[] }) {
  const top = useMemo(() => [...points].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).slice(0, 14), [points]);
  return (
    <group>
      {top.map((p) => {
        const w = p.weight ?? 0.5;
        const a = toVec(p.lat, p.lng, R * 1.012);
        const b = toVec(p.lat, p.lng, R * (1.03 + w * 0.06));
        return <Line key={p.id} points={[a, b]} vertexColors={[[0.55, 0.81, 0.71], [0.05, 0.08, 0.14]]} lineWidth={1.2} transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />;
      })}
    </group>
  );
}

// ───────────── arcs with a travelling comet ─────────────
function Arc({ from, to, delay }: { from: THREE.Vector3; to: THREE.Vector3; delay: number }) {
  const comet = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const dist = from.distanceTo(to);
    mid.normalize().multiplyScalar(R + 0.12 + dist * 0.32);
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to]);
  const pts = useMemo(() => curve.getPoints(64), [curve]);
  useFrame(({ clock }) => {
    if (!comet.current) return;
    const t = ((clock.elapsedTime * 0.28 + delay) % 1.4) / 1.4;
    comet.current.position.copy(curve.getPoint(Math.min(t * 1.15, 1)));
    (comet.current.material as THREE.MeshBasicMaterial).opacity = t < 0.85 ? 1 : (1 - t) * 6;
  });
  return (
    <group>
      <Line points={pts} color="#8CCFB4" lineWidth={1} transparent opacity={0.28} depthWrite={false} />
      <mesh ref={comet}>
        <sphereGeometry args={[0.011, 12, 12]} />
        <meshBasicMaterial color="#DDF2E8" transparent />
      </mesh>
    </group>
  );
}

function OriginPulse({ v }: { v: THREE.Vector3 }) {
  const ring = useRef<THREE.Mesh>(null);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), v.clone().normalize()), [v]);
  useFrame(({ clock }) => {
    const m = ring.current;
    if (!m) return;
    const t = (clock.elapsedTime * 0.6) % 1;
    m.scale.setScalar(1 + t * 3);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
  });
  return (
    <group position={v} quaternion={quat}>
      <mesh ref={ring}>
        <ringGeometry args={[0.02, 0.026, 40]} />
        <meshBasicMaterial color="#E6C88E" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const n = 900;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(6 + Math.random() * 6);
      v.toArray(arr, i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.018} color="#AAB5CB" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Scene({ points, origin, arcTo, focusId, interactive, zoom, autoRotate, beams, stars, onSelect, onHover }: GlobeProps) {
  const group = useRef<THREE.Group>(null);
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
    target.current = { y: -Math.atan2(v.x, v.z), x: ((p.lat * Math.PI) / 180) * 0.55 };
  }, [focusId, points]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (target.current) {
      let dy = target.current.y - g.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      g.rotation.y += dy * Math.min(1, dt * 2.6);
      g.rotation.x += (target.current.x - g.rotation.x) * Math.min(1, dt * 2.6);
    } else if (autoRotate && !hovered && !reduced) {
      g.rotation.y += dt * 0.07;
    }
  });

  const originVec = origin ? toVec(origin.lat, origin.lng, R * 1.012) : null;
  const arcTargets = (arcTo ?? []).map((id) => points.find((p) => p.id === id)).filter(Boolean) as GlobePoint[];
  const startY = origin ? -Math.atan2(toVec(origin.lat, origin.lng).x, toVec(origin.lat, origin.lng).z) : 0;

  return (
    <>
      {stars && <Stars />}
      <group ref={group} rotation={[0.35, startY, 0]}>
        <Surface />
        <Graticule />
        <Land />
        {beams && <Beams points={points} />}
        <Markers
          points={points}
          hovered={hovered}
          focusId={focusId}
          onHover={(id) => {
            setHovered(id);
            onHover?.(id);
            document.body.style.cursor = id && onSelect ? "pointer" : "";
          }}
          onSelect={onSelect}
        />
        {originVec && (
          <group>
            <mesh position={originVec}>
              <sphereGeometry args={[0.018, 16, 16]} />
              <meshBasicMaterial color="#E6C88E" />
            </mesh>
            <OriginPulse v={originVec} />
            {origin?.label && (
              <group position={originVec}>
                <Html style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
                  <div className="-translate-x-1/2 translate-y-2 whitespace-nowrap rounded bg-sun px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-night-900">{origin.label}</div>
                </Html>
              </group>
            )}
          </group>
        )}
        {originVec && arcTargets.map((p, i) => <Arc key={p.id} from={originVec} to={toVec(p.lat, p.lng, R * 1.012)} delay={i * 0.23} />)}
      </group>
      <Atmosphere />
      {interactive && <OrbitControls enablePan={false} enableZoom={!!zoom} enableDamping dampingFactor={0.08} minDistance={1.7} maxDistance={4.2} rotateSpeed={0.45} zoomSpeed={0.6} />}
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
  const { ref, visible, seen } = useVisible<HTMLDivElement>();
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setOk(hasWebGL());
    setMobile(window.innerWidth < 768);
  }, []);
  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);
  // one stable wrapper element, so the visibility observer keeps tracking it
  return (
    <div ref={ref} className={props.className} role="img" aria-label="Interactive globe showing universities in the CareerPath dataset">
      {ok === false || (ok && !seen) ? (
        <GlobeFallback className="h-full w-full" />
      ) : ok ? (
        <Canvas frameloop={visible ? "always" : "never"} camera={{ position: [0, 0, 3.25], fov: 42 }} dpr={mobile ? [1, 1.5] : [1, 2]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} raycaster={{ params: { Points: { threshold: 0.025 } } as THREE.RaycasterParameters }}>
          <Scene {...props} />
        </Canvas>
      ) : null}
    </div>
  );
}

export function GlobeFallback({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative mx-auto aspect-square h-full max-h-full">
        <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#1B2639,#0E1626_70%)] shadow-[0_0_120px_20px_rgba(140,207,180,0.12)]" />
        <div className="absolute inset-[8%] rounded-full [background:repeating-linear-gradient(0deg,transparent_0_14px,rgba(140,207,180,0.06)_14px_15px),repeating-linear-gradient(90deg,transparent_0_14px,rgba(140,207,180,0.06)_14px_15px)] [mask-image:radial-gradient(circle,black_60%,transparent_71%)]" />
      </div>
    </div>
  );
}
