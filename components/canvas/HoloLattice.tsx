"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "@/hooks/useScrollStore";

// "System Online" — a slowly rotating low-poly icosahedron rendered as a glowing
// violet Fresnel rim + cyan wireframe with hologram scanlines and a slow sweep.
// The camera-facing center stays dark so hero text over it remains legible; only
// the grazing-angle silhouette + edges glow (the dark-mode Fresnel trick).

const VIOLET = new THREE.Color("#8b5cf6");
const CYAN = new THREE.Color("#22d3ee");

const vertexShader = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewV;
  varying float vWorldY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewV = normalize(-mv.xyz);
    vWorldY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormalV;
  varying vec3 vViewV;
  varying float vWorldY;
  void main() {
    // Fresnel: bright at grazing angles (silhouette), dark facing the camera.
    float fres = pow(1.0 - clamp(dot(vNormalV, vViewV), 0.0, 1.0), uPower);
    // Hologram horizontal scanlines drifting upward.
    float scan = 0.82 + 0.18 * sin(vWorldY * 42.0 - uTime * 3.0);
    // Slow bright sweep band travelling up the form ("system online").
    float band = smoothstep(0.10, 0.0, abs(fract(vWorldY * 0.20 - uTime * 0.05) - 0.5));
    // Violet rim, cyan biased toward the sweep + brightest edges.
    vec3 col = mix(uViolet, uCyan, clamp(fres * 0.5 + band * 0.6, 0.0, 1.0));
    float a = fres * scan + band * 0.12;
    gl_FragColor = vec4(col * uIntensity * (scan + band * 0.7), a);
  }
`;

export default function HoloLattice({ lowPower = false }: { lowPower?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const scrollOffset = useScrollStore((s) => s.offset);

  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // detail 1 = 80 faces — a clean geodesic lattice; coarser on low-power.
  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(1.3, lowPower ? 0 : 1),
    [lowPower],
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uViolet: { value: VIOLET },
      uCyan: { value: CYAN },
      uPower: { value: 2.8 },
      uIntensity: { value: 1.3 },
    }),
    [],
  );

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    if (matRef.current) matRef.current.uniforms.uTime.value = t;

    if (reduced) {
      g.rotation.set(0.5, 0.6, 0);
      g.position.y = 0;
      return;
    }
    const s = scrollOffset * 0.0006;
    g.rotation.y = t * 0.07 + s;
    g.rotation.x = Math.sin(t * 0.14) * 0.18 + s * 0.4;
    g.position.y = Math.sin(t * 0.4) * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, 0, -1]}>
      {/* Fresnel-rim hologram body */}
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Cyan wireframe lattice */}
      <mesh geometry={geometry} scale={1.004}>
        <meshBasicMaterial
          color={CYAN}
          wireframe
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Faint inner violet core for depth */}
      <mesh geometry={geometry} scale={0.5}>
        <meshBasicMaterial
          color={VIOLET}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
