// ============================================================
// GlobeScene — Stylized 3D wireframe globe for landing hero
// Kerala highlighted with glowing point markers
// ============================================================

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
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

function WireframeGlobe() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  // Generate latitude/longitude grid lines
  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = []
    const radius = 2

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = []
      for (let lng = 0; lng <= 360; lng += 5) {
        points.push(latLngToVector3(lat, lng, radius))
      }
      lines.push(points)
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const points: THREE.Vector3[] = []
      for (let lat = -90; lat <= 90; lat += 5) {
        points.push(latLngToVector3(lat, lng, radius))
      }
      lines.push(points)
    }

    return lines
  }, [])

  // Kerala bus route points
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
      position: latLngToVector3(p.lat, p.lng, 2.02),
    }))
  }, [])

  // Route connections as arcs
  const routeArcs = useMemo(() => {
    const arcs: THREE.Vector3[][] = []
    for (let i = 0; i < keralaPoints.length - 1; i++) {
      const start = keralaPoints[i].position
      const end = keralaPoints[i + 1].position
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.15)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      arcs.push(curve.getPoints(20))
    }
    return arcs
  }, [keralaPoints])

  return (
    <group ref={groupRef}>
      {/* Globe sphere (very faint) */}
      <Sphere args={[2, 32, 32]}>
        <meshBasicMaterial color="#0C0C14" transparent opacity={0.4} />
      </Sphere>

      {/* Grid lines */}
      {gridLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#1A1A2E"
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}

      {/* Kerala route arcs (glowing teal) */}
      {routeArcs.map((points, i) => (
        <Line
          key={`arc-${i}`}
          points={points}
          color="#0D9488"
          lineWidth={2}
          transparent
          opacity={0.8}
        />
      ))}

      {/* Kerala city points */}
      {keralaPoints.map((point, i) => (
        <mesh key={`point-${i}`} position={point.position}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="#0D9488" />
        </mesh>
      ))}

      {/* Animated bus dots along route arcs */}
      <BusDot arc={routeArcs[0]} speed={0.3} delay={0} />
      <BusDot arc={routeArcs[2]} speed={0.25} delay={0.5} />
      <BusDot arc={routeArcs[4]} speed={0.35} delay={1.0} />
    </group>
  )
}

function BusDot({ arc, speed, delay }: { arc: THREE.Vector3[]; speed: number; delay: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  const time = useRef(delay)

  useFrame((_, delta) => {
    if (!ref.current || !arc.length) return
    time.current += delta * speed
    const t = ((time.current % 2) / 2) // 0 to 1 loop
    const idx = Math.floor(t * (arc.length - 1))
    const nextIdx = Math.min(idx + 1, arc.length - 1)
    const frac = t * (arc.length - 1) - idx

    ref.current.position.lerpVectors(arc[idx], arc[nextIdx], frac)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color="#EF4444" />
    </mesh>
  )
}

export function GlobeScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [-3, 2, 4], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <WireframeGlobe />
      </Canvas>
    </div>
  )
}
