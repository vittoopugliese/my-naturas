import { useMemo } from 'react'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { CapMaterial, Glass, Label } from '../materials'
import { verticalUVs } from '../textures'
import type { ShapeDef, ShapeProps } from './common'

// Kaiak Sonar: tall satin bottle, blue at the top fading to clear, big frosted blue cap
// over a white ring with a carry loop.
const W = 0.85
const H = 1.25
const D = 0.5
const RING_H = 0.06
const CAP_H = 0.55

function Kaiak({ p, title, subtitle }: ShapeProps) {
  const { glass, glassGradientTo, finish, cap, capAccent, label = '#ffffff' } = p.bottle
  const body = useMemo(() => verticalUVs(new RoundedBoxGeometry(W, H, D, 8, 0.14)), [])
  const capGeo = useMemo(() => new RoundedBoxGeometry(W * 0.74, CAP_H, D * 0.86, 8, 0.2), [])
  const ring = capAccent ?? '#f2f2f2'
  const front = D / 2 + 0.003
  const x0 = -W * 0.3
  return (
    <group>
      <mesh geometry={body} position={[0, H / 2, 0]}>
        <Glass color={glass} gradientTo={glassGradientTo} finish={finish} />
      </mesh>
      <mesh position={[0, H + RING_H / 2, 0]}>
        <boxGeometry args={[W * 0.76, RING_H, D * 0.88]} />
        <CapMaterial color={ring} roughness={0.5} />
      </mesh>
      <mesh position={[W * 0.4, H + RING_H / 2, 0]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.055, 0.014, 10, 24]} />
        <CapMaterial color={ring} roughness={0.5} />
      </mesh>
      <mesh geometry={capGeo} position={[0, H + RING_H + CAP_H / 2, 0]}>
        <CapMaterial color={cap} roughness={0.55} />
      </mesh>
      <Label position={[x0, H * 0.78, front]} size={0.15} spacing={0.01} anchorX="left" color={label}>
        {title}
      </Label>
      <Label position={[x0 + 0.01, H * 0.78 - 0.12, front]} size={0.065} spacing={0} anchorX="left" color={label}>
        {subtitle.toLowerCase()}
      </Label>
    </group>
  )
}

export const kaiak: ShapeDef = { size: { w: W, h: H + RING_H + CAP_H, d: D }, Component: Kaiak }
