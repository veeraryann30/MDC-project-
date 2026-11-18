import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Shield outline as a THREE.Shape (unit-ish scale, centred on origin). */
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

function makeCheckShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.4, -0.02);
  s.lineTo(-0.12, -0.3);
  s.lineTo(0.4, 0.22);
  s.lineTo(0.31, 0.31);
  s.lineTo(-0.12, -0.12);
  s.lineTo(-0.31, 0.07);
  s.closePath();
  return s;
}

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = new RoomEnvironment();
    const rt = pmrem.fromScene(env, 0.04);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
      env.dispose?.();
    };
  }, [gl, scene]);
  return null;
}

function Shield() {
  const group = useRef();
  const sweep = useRef();
  const sweepMat = useRef();

  const { bodyGeo, plateGeo, checkGeo, edgeGeo } = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(makeShieldShape(1), {
      depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 40,
    });
    body.center();
    const plate = new THREE.ExtrudeGeometry(makeShieldShape(0.84), {
      depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 40,
    });
    plate.center();
    const check = new THREE.ExtrudeGeometry(makeCheckShape(), {
      depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2,
    });
    check.center();
    const edge = new THREE.EdgesGeometry(new THREE.ShapeGeometry(makeShieldShape(0.84), 40));
    return { bodyGeo: body, plateGeo: plate, checkGeo: check, edgeGeo: edge };
  }, []);

  useEffect(() => () => {
    bodyGeo.dispose(); plateGeo.dispose(); checkGeo.dispose(); edgeGeo.dispose();
  }, [bodyGeo, plateGeo, checkGeo, edgeGeo]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (g) {
      const targetY = state.pointer.x * 0.38 + Math.sin(t * 0.35) * 0.08;
      const targetX = -state.pointer.y * 0.22 + Math.cos(t * 0.3) * 0.03;
      const k = 1 - Math.pow(0.0015, delta);
      g.rotation.y += (targetY - g.rotation.y) * k;
      g.rotation.x += (targetX - g.rotation.x) * k;
      g.position.y = Math.sin(t * 0.8) * 0.045;
    }
    if (sweep.current && sweepMat.current) {
      const cycle = (t % 4.5) / 4.5;
      sweep.current.position.y = 1.05 - cycle * 2.2;
      sweepMat.current.opacity = Math.sin(cycle * Math.PI) * 0.55;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={bodyGeo}>
        <meshPhysicalMaterial color="#17191d" metalness={0.92} roughness={0.28} clearcoat={1} clearcoatRoughness={0.18} />
      </mesh>
      <mesh geometry={plateGeo} position={[0, 0, 0.18]}>
        <meshPhysicalMaterial color="#0d0e10" metalness={0.7} roughness={0.5} />
      </mesh>
      <lineSegments geometry={edgeGeo} position={[0, 0, 0.205]}>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.65} />
      </lineSegments>
      <mesh geometry={checkGeo} position={[0, 0.02, 0.225]}>
        <meshStandardMaterial color="#0e7490" emissive="#22d3ee" emissiveIntensity={0.55} roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Scan sweep: a soft horizontal band travelling down the face */}
      <mesh ref={sweep} position={[0, 0, 0.235]}>
        <planeGeometry args={[1.5, 0.035]} />
        <meshBasicMaterial ref={sweepMat} color="#67e8f9" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Particles({ count = 36 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.6 + Math.random() * 1.2;
      const th = Math.random() * Math.PI * 2;
      a[i * 3] = Math.cos(th) * r;
      a[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
      a[i * 3 + 2] = Math.sin(th) * r * 0.5 - 0.6;
    }
    return a;
  }, [count]);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.04; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#a5f3fc" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
      <ringGeometry args={[0.9, 0.915, 96]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.28} />
    </mesh>
  );
}

export default function ShieldScene({ active = true }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4.4], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      <Environment />
      <ambientLight intensity={0.15} />
      <directionalLight position={[2.5, 3, 4]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-3, -1, 2]} intensity={14} color="#22d3ee" distance={9} />
      <Shield />
      <Particles />
      <Floor />
    </Canvas>
  );
}
