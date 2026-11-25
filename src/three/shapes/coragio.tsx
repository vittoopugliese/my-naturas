import { useMemo } from 'react'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { CapMaterial, Glass, Label } from '../materials'
import { boxUVs, knurlTexture } from '../textures'
import type { ShapeDef, ShapeProps } from './common'

// Homem Cor.agio: glossy black body with knurled sides, a grey metal plate on the front that
// rises above the body, and a clear block on top holding the orange stepped actuator.
const W = 0.66
const D = 0.5
const BODY_H = 1.2
const PLATE_Y = 0.12
const PLATE_H = 1.32
const TOP = PLATE_Y + PLATE_H

function Coragio({ p, title, subtitle }: ShapeProps) {
  const { glass, cap, capAccent, label = '#f2efe8' } = p.bottle
  const body = useMemo(() => boxUVs(new RoundedBoxGeometry(W, BODY_H, D, 6, 0.09), 9), [])
  const knurl = useMemo(() => knurlTexture(), [])
  const front = D / 2
  const plateZ = front + 0.035
  const ly = PLATE_Y + PLATE_H * 0.55
  const x0 = -W * 0.3
  return (
    <group>
      <mesh geometry={body} position={[0, BODY_H / 2, 0]}>
        <meshPhysicalMaterial
          color={glass}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.05}
          bumpMap={knurl}
          bumpScale={2}
          transparent
        />
      </mesh>
      {/* front plate: silver frame + dark grey panel */}
      <mesh position={[0, PLATE_Y + PLATE_H / 2, front + 0.015]}>
        <boxGeometry args={[W * 0.92, PLATE_H, 0.04]} />
        <CapMaterial color="#9da2a8" metal roughness={0.35} />
      </mesh>
      <mesh position={[0, PLATE_Y + PLATE_H / 2, plateZ]}>
        <boxGeometry args={[W * 0.84, PLATE_H - 0.06, 0.012]} />
        <CapMaterial color={cap} roughness={0.7} />
      </mesh>
      {/* nozzle */}
      <mesh position={[0, TOP - 0.08, plateZ + 0.008]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.035, 0.035, 0.01, 24]} />
        <CapMaterial color="#8a8f95" metal />
      </mesh>
      <mesh position={[0, TOP - 0.08, plateZ + 0.012]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.016, 0.016, 0.01, 16]} />
        <meshBasicMaterial color={capAccent ?? '#ff5a1a'} transparent />
      </mesh>
      {/* clear block on top with the orange steps */}
      <mesh position={[0, BODY_H + (TOP - BODY_H) / 2, -0.03]}>
        <boxGeometry args={[W * 0.84, TOP - BODY_H, D * 0.78]} />
        <Glass color="#dfe6ea" />
      </mesh>
      <mesh position={[W * 0.12, BODY_H + 0.04, -0.03]}>
        <boxGeometry args={[0.2, 0.08, D * 0.5]} />
        <CapMaterial color={capAccent ?? '#ff5a1a'} roughness={0.45} />
      </mesh>
      <mesh position={[W * 0.16, BODY_H + 0.12, -0.03]}>
        <boxGeometry args={[0.13, 0.08, D * 0.5]} />
        <CapMaterial color={capAccent ?? '#ff5a1a'} roughness={0.45} />
      </mesh>
      <Label position={[x0, ly + 0.09, plateZ + 0.007]} size={0.036} spacing={0.02} anchorX="left" color={label}>
        natura
      </Label>
      <Label position={[x0, ly, plateZ + 0.007]} size={0.1} spacing={0.04} anchorX="left" color={label}>
        {title}
      </Label>
      <Label position={[x0, ly - 0.085, plateZ + 0.007]} size={0.048} spacing={0.32} anchorX="left" color={label}>
        {subtitle}
      </Label>
    </group>
  )
}

export const coragio: ShapeDef = { size: { w: W, h: TOP, d: D + 0.06 }, Component: Coragio }
