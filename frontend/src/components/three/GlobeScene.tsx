// ============================================================
// GlobeScene — Premium 3D Kerala Globe with Bloom & Atmosphere
// ============================================================

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, Points, PointMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

// Convert lat/lng to 3D sphere position
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// Atmospheric glow sphere
function AtmosphereGlow() {
  const ref = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <mesh ref={ref} scale={2.3}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial
        color="#14B8A6"
        transparent
        opacity={0.03}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

// Starfield background
function StarField() {
  const count = 2000
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 15 + Math.random() * 25
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  return (
    <Points positions={positions}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.015}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  )
}

// Main wireframe globe
function WireframeGlobe() {
  const groupRef = useRef<THREE.Group>(null!)
  const innerGlobeRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03
    }
    if (innerGlobeRef.current) {
      innerGlobeRef.current.rotation.y += delta * 0.01
    }
  })

  // Generate latitude/longitude grid lines
  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = []
    const radius = 2

    // Latitude lines (more dense)
    for (let lat = -75; lat <= 75; lat += 15) {
      const points: THREE.Vector3[] = []
      for (let lng = 0; lng <= 360; lng += 3) {
        points.push(latLngToVector3(lat, lng, radius))
      }
      lines.push(points)
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 20) {
      const points: THREE.Vector3[] = []
      for (let lat = -90; lat <= 90; lat += 3) {
        points.push(latLngToVector3(lat, lng, radius))
      }
      lines.push(points)
    }

    return lines
  }, [])

  // Kerala cities
  const keralaPoints = useMemo(() => {
    return [
      { lat: 8.524, lng: 76.936, label: 'Trivandrum' },
      { lat: 8.893, lng: 76.614, label: 'Kollam' },
      { lat: 9.498, lng: 76.329, label: 'Alappuzha' },
      { lat: 9.931, lng: 76.267, label: 'Kochi' },
      { lat: 10.527, lng: 76.214, label: 'Thrissur' },
      { lat: 11.258, lng: 75.780, label: 'Kozhikode' },
      { lat: 11.875, lng: 75.370, label: 'Kannur' },
    ].map((p) => ({
      ...p,
      position: latLngToVector3(p.lat, p.lng, 2.01),
    }))
  }, [])

  // Route arcs
  const routeArcs = useMemo(() => {
    const arcs: THREE.Vector3[][] = []
    for (let i = 0; i < keralaPoints.length - 1; i++) {
      const start = keralaPoints[i].position
      const end = keralaPoints[i + 1].position
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.2)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      arcs.push(curve.getPoints(30))
    }
    return arcs
  }, [keralaPoints])

  return (
    <group ref={groupRef}>
      {/* Inner globe with subtle gradient */}
      <mesh ref={innerGlobeRef}>
        <sphereGeometry args={[1.98, 64, 64]} />
        <meshBasicMaterial color="#050508" transparent opacity={0.95} />
      </mesh>

      {/* Atmosphere rim */}
      <AtmosphereGlow />

      {/* Grid lines */}
      {gridLines.map((points, i) => (
        <Line
          key={`grid-${i}`}
          points={points}
          color="#1a1a2e"
          lineWidth={0.4}
          transparent
          opacity={0.25}
        />
      ))}

      {/* Kerala route arcs (glowing) */}
      {routeArcs.map((points, i) => (
        <group key={`arc-group-${i}`}>
          {/* Outer glow */}
          <Line
            points={points}
            color="#14B8A6"
            lineWidth={4}
            transparent
            opacity={0.15}
          />
          {/* Core line */}
          <Line
            points={points}
            color="#14B8A6"
            lineWidth={1.5}
            transparent
            opacity={0.9}
          />
        </group>
      ))}

      {/* Kerala city points with glow */}
      {keralaPoints.map((point, i) => (
        <group key={`point-${i}`} position={point.position}>
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#14B8A6" transparent opacity={0.2} />
          </mesh>
          {/* Core point */}
          <mesh>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshBasicMaterial color="#14B8A6" />
          </mesh>
          {/* Pulse ring */}
          <PulseRing delay={i * 0.3} />
        </group>
      ))}

      {/* Animated bus dots */}
      <BusDot arc={routeArcs[0]} speed={0.25} delay={0} />
      <BusDot arc={routeArcs[2]} speed={0.2} delay={0.5} />
      <BusDot arc={routeArcs[4]} speed={0.28} delay={1.0} />
      <BusDot arc={routeArcs[1]} speed={0.22} delay={1.5} />
      <BusDot arc={routeArcs[3]} speed={0.26} delay={2.0} />
    </group>
  )
}

// Pulse ring around city points
function PulseRing({ delay }: { delay: number }) {
  const ref = useRef<THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>>(null!)
  
  useFrame((state) => {
    if (ref.current) {
      const t = ((state.clock.elapsedTime + delay) % 2) / 2
      ref.current.scale.setScalar(1 + t * 2)
      ref.current.material.opacity = 0.3 * (1 - t)
    }
  })

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.03, 0.04, 32]} />
      <meshBasicMaterial color="#14B8A6" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  )
}

// Animated bus dot traveling along route
function BusDot({ arc, speed, delay }: { arc: THREE.Vector3[]; speed: number; delay: number }) {
  const ref = useRef<THREE.Group>(null!)
  const trailRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null!)
  const time = useRef(delay)

  useFrame((_, delta) => {
    if (!ref.current || !arc.length) return
    time.current += delta * speed
    const t = ((time.current % 2) / 2)
    const idx = Math.floor(t * (arc.length - 1))
    const nextIdx = Math.min(idx + 1, arc.length - 1)
    const frac = t * (arc.length - 1) - idx

    ref.current.position.lerpVectors(arc[idx], arc[nextIdx], frac)
    
    // Trail effect
    if (trailRef.current) {
      trailRef.current.material.opacity = 0.15 + Math.sin(time.current * 10) * 0.1
    }
  })

  return (
    <group ref={ref}>
      {/* Outer glow */}
      <mesh ref={trailRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#DC2626" transparent opacity={0.2} />
      </mesh>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color="#F43F5E" />
      </mesh>
    </group>
  )
}

// Camera with subtle movement
function CameraRig() {
  const { camera } = useThree()
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    camera.position.x = Math.sin(t * 0.05) * 0.3
    camera.position.y = 0.5 + Math.cos(t * 0.08) * 0.15
    camera.lookAt(0, 0, 0)
  })

  return null
}

// Post-processing effects
function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        radius={0.8}
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
      />
    </EffectComposer>
  )
}

interface GlobeSceneProps {
  className?: string
}

export function GlobeScene({ className = '' }: GlobeSceneProps) {
  return (
    <div className={`${className} opacity-80`}>
      <Canvas
        camera={{ position: [0, 0.5, 5.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#030305']} />
          
          {/* Ambient light */}
          <ambientLight intensity={0.1} />
          
          {/* Stars */}
          <StarField />
          
          {/* Globe */}
          <WireframeGlobe />
          
          {/* Camera animation */}
          <CameraRig />
          
          {/* Post-processing */}
          <Effects />
        </Suspense>
      </Canvas>
    </div>
  )
}
