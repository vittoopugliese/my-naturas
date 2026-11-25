import { CylinderGeometry } from 'three'
import { CapMaterial, Glass, Label } from '../materials'
import { latheBody } from './lathe'
import { once, type ShapeDef, type ShapeProps } from './common'

// Humor: flattened pebble, widest low down, sloping shoulders into a metallic cap
// in the bottle's color with a thin pastel ring.
const R = 0.33
const FLAT = 0.62
const H = 1.4
const CAP_R = 0.12
const CAP_H = 0.34

const PROFILE: [number, number][] = [
  [0, 0],
  [0.22, 0.008],
  [0.31, 0.07],
  [R, 0.3],
  [R, 0.7],
  [0.31, 1.0],
  [0.24, 1.2],
  [0.15, 1.32],
  [0.105, 1.37],
  [0.1, H],
]

const geo = once(() => ({
  body: latheBody(PROFILE),
  ring: new CylinderGeometry(CAP_R - 0.012, CAP_R - 0.012, 0.025, 40),
  cap: new CylinderGeometry(CAP_R, CAP_R, CAP_H, 48),
}))

function Humor({ p, title, subtitle }: ShapeProps) {
  const { glass, cap, capAccent, label = '#ffffff' } = p.bottle
  const g = geo()
  const front = R * FLAT + 0.004
  // Radius of curvature at the front of the flattened ellipse.
  const wrap = (R * R) / (R * FLAT)
  return (
    <group dispose={null}>
      <mesh geometry={g.body} scale={[1, 1, FLAT]}>
        <Glass color={glass} />
      </mesh>
      <mesh geometry={g.ring} position={[0, H + 0.0125, 0]}>
        <CapMaterial color={capAccent ?? '#ffffff'} roughness={0.5} />
      </mesh>
      <mesh geometry={g.cap} position={[0, H + 0.025 + CAP_H / 2, 0]}>
        <CapMaterial color={cap} metal roughness={0.3} />
      </mesh>
      <Label position={[0, 0.8, front]} size={0.12} spacing={0.02} wrapRadius={wrap} color={label}>
        {title}
      </Label>
      <Label position={[0.03, 0.7, front]} size={0.055} spacing={0} wrapRadius={wrap} color={label}>
        {subtitle}
      </Label>
      <Label position={[0, 0.16, front - 0.04]} size={0.035} spacing={0.02} wrapRadius={wrap} color={label}>
        natura
      </Label>
    </group>
  )
}

export const humor: ShapeDef = { size: { w: R * 2, h: H + 0.025 + CAP_H, d: R * 2 * FLAT }, yaw: 30, Component: Humor }
