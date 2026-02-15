// ============================================================
// ParticleField — Reactive floating particles background
// Used on landing page and as ambient dashboard background
// Particles respond to mouse movement and event frequency
// ============================================================

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 500, color = '#0D9488' }: { count?: number; color?: string }) {
  const mesh = useRef<THREE.Points>(null!)
  const mouseRef = useRef({ x: 0, y: 0 })

  const { viewport } = useThree()

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10

      vel[i * 3] = (Math.random() - 0.5) * 0.002
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001
    }

    return [pos, vel]
  }, [count])

  const sizes = useMemo(() => {
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 2 + 0.5
    }
    return s
  }, [count])

  useFrame(({ pointer }) => {
    if (!mesh.current) return

    mouseRef.current.x = pointer.x * viewport.width * 0.5
    mouseRef.current.y = pointer.y * viewport.height * 0.5

    const posArray = mesh.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < count; i++) {
      const idx = i * 3

      // Base movement
      posArray[idx] += velocities[idx]
      posArray[idx + 1] += velocities[idx + 1]
      posArray[idx + 2] += velocities[idx + 2]

      // Wrap around bounds
      if (posArray[idx] > 10) posArray[idx] = -10
      if (posArray[idx] < -10) posArray[idx] = 10
      if (posArray[idx + 1] > 10) posArray[idx + 1] = -10
      if (posArray[idx + 1] < -10) posArray[idx + 1] = 10
    }

    mesh.current.geometry.attributes.position.needsUpdate = true

    // Slow rotation
    mesh.current.rotation.y += 0.0001
    mesh.current.rotation.x += 0.00005
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function ParticleField({
  className,
  count = 500,
  color = '#0D9488',
}: {
  className?: string
  count?: number
  color?: string
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: false }}
      >
        <Particles count={count} color={color} />
      </Canvas>
    </div>
  )
}
