import { CylinderGeometry } from 'three'
import { CapMaterial, Glass, Label } from '../materials'
import { knurlRepeat } from '../textures'
import { arcIn, loft, once, samples, type ShapeDef, type ShapeProps } from './common'

// Every Biografia (clásico, Assinatura): wide flat flask with big rounded bottom corners and
// square shoulders, a short metal neck and a tall round cap, knurled at the bottom.
const W = 1.0
const D = 0.42
const H = 1.02
const BOTTOM_R = 0.24 // radius of the rounded bottom corners, seen from the front
const TOP_R = 0.05
const NECK = 0.05
const CAP_R = 0.19
const CAP_H = 0.34
const GRIP_H = 0.12

function body() {
  const ys = [
    ...samples(0, BOTTOM_R, 12, (t) => 1 - Math.cos((t * Math.PI) / 2)),
    ...samples(BOTTOM_R, H - TOP_R, 3).slice(1),
    ...samples(H - TOP_R, H, 5).slice(1),
  ]
  return loft(
    ys.map((y) => {
      const bottom = y < BOTTOM_R ? BOTTOM_R * arcIn((BOTTOM_R - y) / BOTTOM_R) : 0
      const top = y > H - TOP_R ? TOP_R * arcIn((y - (H - TOP_R)) / TOP_R) : 0
      // Bottom corners round the width a lot and the depth only a little.
      return { y, w: W - 2 * bottom - 2 * top, d: D - 2 * Math.min(bottom, 0.05) - 2 * top, r: 0.16 }
    }),
  )
}

const geo = once(() => ({
  body: body(),
  neck: new CylinderGeometry(0.15, 0.15, NECK, 40),
  grip: new CylinderGeometry(CAP_R, CAP_R, GRIP_H, 48),
  cap: new CylinderGeometry(CAP_R, CAP_R, CAP_H - GRIP_H, 48),
  knurl: knurlRepeat(30, 2),
}))

function Biografia({ p, title, subtitle }: ShapeProps) {
  const { glass, glassGradientTo, finish, cap, capAccent, label = '#f2f2f2' } = p.bottle
  const g = geo()
  const band = capAccent ?? cap
  const front = D / 2 + 0.003
  const ly = H * 0.55
  return (
    <group>
      <mesh geometry={g.body}>
        <Glass color={glass} gradientTo={glassGradientTo} finish={finish} />
      </mesh>
      <mesh geometry={g.neck} position={[0, H + NECK / 2, 0]}>
        <CapMaterial color={band} metal roughness={0.3} />
      </mesh>
      <mesh geometry={g.grip} position={[0, H + NECK + GRIP_H / 2, 0]}>
        <CapMaterial color={band} metal bump={g.knurl} roughness={0.35} />
      </mesh>
      <mesh geometry={g.cap} position={[0, H + NECK + GRIP_H + (CAP_H - GRIP_H) / 2, 0]}>
        <CapMaterial color={cap} metal={cap === band} roughness={0.3} />
      </mesh>
      <Label position={[-W * 0.3, ly + 0.11, front]} size={0.034} spacing={0.02} anchorX="left" color={label}>
        natura
      </Label>
      <Label position={[0, ly, front]} size={0.14} spacing={0.01} color={label}>
        {title}
      </Label>
      {subtitle && (
        <Label position={[W * 0.06, ly - 0.11, front]} size={0.06} spacing={0.02} color={label}>
          {subtitle}
        </Label>
      )}
    </group>
  )
}

export const biografia: ShapeDef = { size: { w: W, h: H + NECK + CAP_H, d: D }, yaw: 25, Component: Biografia }
