import { TorusGeometry } from 'three'
import { CapMaterial, Glass, Label } from '../materials'
import { arcIn, loft, once, samples, type ShapeDef, type ShapeProps } from './common'

// Every current Kaiak (Sonar, Oceano, Pulso, Noite, Extremo, 21K, Eau de Parfum): a flask with
// round shoulders that close into a wide cap. A colored ring with a carry loop on the right
// sits between the glass and the cap. Most fade from a dark top to clear glass.
const W = 0.76
const D = 0.44
const H = 1.2
const SHOULDER = 0.3 // height of the rounded shoulder
const TOP_W = W * 0.74
const TOP_D = D * 0.84
const BASE_R = 0.035
const RING_H = 0.05
const CAP_H = 0.3

function body() {
  const ys = [
    ...samples(0, BASE_R, 5),
    ...samples(BASE_R, H - SHOULDER, 4).slice(1),
    ...samples(H - SHOULDER, H, 14, (t) => Math.sin((t * Math.PI) / 2)).slice(1),
  ]
  return loft(
    ys.map((y) => {
      // Rounded base edge, then straight walls, then a circular shoulder up to the ring.
      const base = y < BASE_R ? BASE_R * arcIn((BASE_R - y) / BASE_R) : 0
      const s = y > H - SHOULDER ? arcIn((y - (H - SHOULDER)) / SHOULDER) : 0
      return {
        y,
        w: W - 2 * base - (W - TOP_W) * s,
        d: D - 2 * base - (D - TOP_D) * s,
        r: 0.13 - 0.04 * s,
      }
    }),
  )
}

/** Short rounded-rectangle block (ring or cap), with a softened top edge. */
function block(w: number, d: number, h: number, r: number, round: number) {
  const ys = [0, ...samples(h - round, h, 5).slice(round > 0 ? 0 : 5)]
  return loft(
    ys.map((y) => {
      const k = round > 0 && y > h - round ? round * arcIn((y - (h - round)) / round) : 0
      return { y, w: w - 2 * k, d: d - 2 * k, r: Math.max(0.01, r - k) }
    }),
  )
}

const geo = once(() => ({
  body: body(),
  ring: block(TOP_W * 1.01, TOP_D * 1.01, RING_H, 0.09, 0),
  cap: block(TOP_W, TOP_D, CAP_H, 0.09, 0.05),
  loop: new TorusGeometry(0.05, 0.014, 10, 24),
}))

function Kaiak({ p, title, subtitle }: ShapeProps) {
  const { glass, glassGradientTo, finish, cap, capAccent, label = '#ffffff' } = p.bottle
  const g = geo()
  const ring = capAccent ?? cap
  const front = D / 2 + 0.003
  const ly = H * 0.55
  return (
    <group dispose={null}>
      <mesh geometry={g.body}>
        <Glass color={glass} gradientTo={glassGradientTo} finish={finish} />
      </mesh>
      <mesh geometry={g.ring} position={[0, H, 0]}>
        <CapMaterial color={ring} roughness={0.45} />
      </mesh>
      <mesh geometry={g.loop} position={[TOP_W / 2 + 0.03, H + RING_H / 2, 0]} rotation-x={Math.PI / 2}>
        <CapMaterial color={ring} roughness={0.45} />
      </mesh>
      <mesh geometry={g.cap} position={[0, H + RING_H, 0]}>
        <CapMaterial color={cap} roughness={finish === 'frosted' ? 0.6 : 0.35} />
      </mesh>
      <Label position={[-W * 0.27, ly + 0.11, front]} size={0.032} spacing={0.02} anchorX="left" color={label}>
        natura
      </Label>
      <Label position={[0, ly, front]} size={0.15} spacing={0.04} color={label}>
        {title}
      </Label>
      {subtitle && (
        <Label position={[0, ly - 0.12, front]} size={subtitle.length > 6 ? 0.05 : 0.08} spacing={0.08} color={label}>
          {subtitle}
        </Label>
      )}
    </group>
  )
}

export const kaiak: ShapeDef = { size: { w: W + 0.1, h: H + RING_H + CAP_H, d: D }, yaw: 22, Component: Kaiak }
