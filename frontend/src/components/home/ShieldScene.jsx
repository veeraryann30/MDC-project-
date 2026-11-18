import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const PURPLE = '#a855f7';
const PURPLE_SOFT = '#c084fc';

/** Shield outline (centred, ~2 units tall). */
function makeShieldShape(scale = 1) {
  const s = new THREE.Shape();
  const w = 0.82 * scale;
  const top = 1.0 * scale;
  s.moveTo(0, top);
  s.bezierCurveTo(w * 0.35, top * 0.9, w * 0.7, top * 0.88, w, top * 0.82);
  s.lineTo(w, top * 0.12);
  s.bezierCurveTo(w, -top * 0.55, w * 0.45, -top * 0.88, 0, -top * 1.05);
  s.bezierCurveTo(-w * 0.45, -top * 0.88, -w, -top * 0.55, -w, top * 0.12);
  s.lineTo(-w, top * 0.82);
  s.bezierCurveTo(-w * 0.7, top * 0.88, -w * 0.35, top * 0.9, 0, top);
  return s;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function Environment({ light }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = new RoomEnvironment();
    const rt = pmrem.fromScene(env, 0.04);
    scene.environment = rt.texture;
    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
      env.dispose?.();
    };
  }, [gl, scene]);
  useEffect(() => {
    scene.environmentIntensity = light ? 1.0 : 0.62;
  }, [scene, light]);
  return null;
}

/** Soft radial texture for the floor shadow / glow. */
function useRadialTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function Shield({ light, pulseKey, onActivate }) {
  const group = useRef();       // float + tilt + scroll
  const spin = useRef();        // click spin (extra Y rotation)
  const ring = useRef();
  const ringMat = useRef();
  const keyLight = useRef();
  const glow = useRef();
  const shadow = useRef();
  const anim = useRef({ spinFrom: 0, spinT: 1, pulseT: 1, spinAcc: 0 });
  const shadowTex = useRadialTexture();

  const geos = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(makeShieldShape(1), {
      depth: 0.24, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.055, bevelSegments: 8, curveSegments: 48,
    });
    body.center();
    const rim = new THREE.ExtrudeGeometry(makeShieldShape(1.06), {
      depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 48,
    });
    rim.center();
    const plate = new THREE.ExtrudeGeometry(makeShieldShape(0.86), {
      depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 48,
    });
    plate.center();
    const innerLine = new THREE.EdgesGeometry(new THREE.ShapeGeometry(makeShieldShape(0.86), 48));
    const lockBody = new THREE.ExtrudeGeometry(roundedRect(0.52, 0.42, 0.07), {
      depth: 0.09, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4, curveSegments: 16,
    });
    lockBody.center();
    const shackle = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, -0.02, 0), new THREE.Vector3(-0.15, 0.1, 0),
        new THREE.Vector3(-0.1, 0.2, 0), new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0.1, 0.2, 0), new THREE.Vector3(0.15, 0.1, 0), new THREE.Vector3(0.15, -0.02, 0),
      ]),
      64, 0.034, 16, false,
    );
    const keyDisc = new THREE.CircleGeometry(0.052, 32);
    const keySlot = new THREE.ShapeGeometry(roundedRect(0.036, 0.13, 0.016));
    return { body, rim, plate, innerLine, lockBody, shackle, keyDisc, keySlot };
  }, []);

  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);
  useEffect(() => () => shadowTex.dispose(), [shadowTex]);

  // Click / keyboard activation -> spin + pulse ring
  useEffect(() => {
    if (!pulseKey) return;
    anim.current.spinFrom = anim.current.spinAcc;
    anim.current.spinT = 0;
    anim.current.pulseT = 0;
  }, [pulseKey]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const a = anim.current;

    // Scroll progress through the hero (0 at top -> 1 once the hero has scrolled away)
    const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.9)));

    const g = group.current;
    if (g) {
      const k = 1 - Math.pow(0.0012, delta);
      const targetY = state.pointer.x * 0.5 + Math.sin(t * 0.4) * 0.12 + p * 1.1;
      const targetX = -state.pointer.y * 0.3 + Math.cos(t * 0.33) * 0.04 - p * 0.15;
      g.rotation.y += (targetY - g.rotation.y) * k;
      g.rotation.x += (targetX - g.rotation.x) * k;
      g.position.y = Math.sin(t * 0.85) * 0.055 - p * 0.25;
      g.position.x = state.pointer.x * 0.06;
    }

    // Click spin: one full smooth turn with ease-in-out
    if (spin.current) {
      if (a.spinT < 1) {
        a.spinT = Math.min(1, a.spinT + delta / 1.15);
        const e = a.spinT < 0.5 ? 4 * a.spinT ** 3 : 1 - ((-2 * a.spinT + 2) ** 3) / 2;
        a.spinAcc = a.spinFrom + e * Math.PI * 2;
        spin.current.rotation.y = a.spinAcc;
      } else {
        a.spinAcc = Math.round(a.spinAcc / (Math.PI * 2)) * Math.PI * 2;
        spin.current.rotation.y = a.spinAcc;
      }
    }

    // Security pulse ring
    if (ring.current && ringMat.current) {
      if (a.pulseT < 1) {
        a.pulseT = Math.min(1, a.pulseT + delta / 1.0);
        const s = 1 + a.pulseT * 1.6;
        ring.current.scale.set(s, s, 1);
        ringMat.current.opacity = (1 - a.pulseT) * 0.85;
        ring.current.visible = true;
      } else {
        ring.current.visible = false;
      }
    }

    // Lighting shifts with the cursor
    if (keyLight.current) {
      keyLight.current.position.x += (state.pointer.x * 3.2 - keyLight.current.position.x) * 0.08;
      keyLight.current.position.y += (state.pointer.y * 2.4 + 0.5 - keyLight.current.position.y) * 0.08;
    }
    if (glow.current) glow.current.intensity = 10 + Math.sin(t * 1.6) * 2.5 + (a.pulseT < 1 ? (1 - a.pulseT) * 30 : 0);

    // Floor shadow breathes opposite to the float
    if (shadow.current) {
      const f = Math.sin(t * 0.85);
      const s = 1 - f * 0.05;
      shadow.current.scale.set(2.4 * s, 0.7 * s, 1);
      shadow.current.material.opacity = (light ? 0.26 : 0.42) * (1 - f * 0.08);
      shadow.current.position.x = -state.pointer.x * 0.2;
    }
  });

  const metal = light ? '#16161a' : '#0b0b0d';

  return (
    <>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex} color={light ? '#111111' : PURPLE} transparent opacity={0.4} depthWrite={false} blending={light ? THREE.NormalBlending : THREE.AdditiveBlending} />
      </mesh>

      <group ref={group}>
        <group ref={spin}>
          {/* purple edge glow (slightly larger silhouette sitting just behind the body) */}
          <mesh geometry={geos.rim} position={[0, 0, -0.07]}>
            <meshStandardMaterial color={PURPLE} emissive={PURPLE} emissiveIntensity={2.6} roughness={0.4} metalness={0.2} toneMapped={false} />
          </mesh>

          {/* black metallic body */}
          <mesh
            geometry={geos.body}
            onClick={(e) => { e.stopPropagation(); onActivate?.(); }}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = ''; }}
          >
            <meshPhysicalMaterial color={metal} metalness={1} roughness={0.3} clearcoat={1} clearcoatRoughness={0.22} envMapIntensity={1.15} />
          </mesh>

          {/* inset plate + purple inner outline */}
          <mesh geometry={geos.plate} position={[0, 0, 0.19]}>
            <meshPhysicalMaterial color="#060607" metalness={0.85} roughness={0.42} clearcoat={0.6} />
          </mesh>
          <lineSegments geometry={geos.innerLine} position={[0, 0, 0.212]}>
            <lineBasicMaterial color={PURPLE_SOFT} transparent opacity={0.9} toneMapped={false} />
          </lineSegments>

          {/* central security lock */}
          <group position={[0, -0.06, 0.225]}>
            <mesh geometry={geos.lockBody}>
              <meshPhysicalMaterial color="#26262c" metalness={1} roughness={0.28} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={1.4} />
            </mesh>
            <mesh geometry={geos.shackle} position={[0, 0.2, 0]}>
              <meshStandardMaterial color="#d4d4dc" metalness={1} roughness={0.22} envMapIntensity={1.5} />
            </mesh>
            <mesh geometry={geos.keyDisc} position={[0, 0.03, 0.075]}>
              <meshBasicMaterial color={PURPLE_SOFT} toneMapped={false} />
            </mesh>
            <mesh geometry={geos.keySlot} position={[0, -0.075, 0.075]}>
              <meshBasicMaterial color={PURPLE_SOFT} toneMapped={false} />
            </mesh>
          </group>

          {/* security pulse (hidden until the shield is activated) */}
          <mesh ref={ring} position={[0, 0, 0.3]} visible={false}>
            <ringGeometry args={[1.0, 1.04, 96]} />
            <meshBasicMaterial ref={ringMat} color={PURPLE_SOFT} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        </group>
      </group>

      <ambientLight intensity={light ? 0.45 : 0.18} />
      <directionalLight position={[2.5, 3.2, 4]} intensity={light ? 2.2 : 1.7} color="#ffffff" />
      <pointLight ref={keyLight} position={[0, 0.5, 3]} intensity={light ? 7 : 12} color={PURPLE_SOFT} distance={12} />
      <pointLight ref={glow} position={[0, -0.3, -1.2]} intensity={10} color={PURPLE} distance={7} />
    </>
  );
}

export default function ShieldScene({ active = true, light = false, pulseKey = 0, onActivate }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4.5], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      <Environment light={light} />
      <Shield light={light} pulseKey={pulseKey} onActivate={onActivate} />
    </Canvas>
  );
}
