import { CylinderGeometry } from 'three'
import { CapMaterial, Glass, Label } from '../materials'
import { knurlRepeat } from '../textures'
import { latheBody } from './lathe'
import { once, type ShapeDef, type ShapeProps } from './common'

// Ekos Copaíba: round smoky-brown bottle with rounded shoulders, glass collar
// and a ribbed black spray pump.
const R = 0.42
const H = 1.22
const PUMP_H = 0.28

const PROFILE: [number, number][] = [
  [0, 0],
  [0.38, 0.004],
  [0.415, 0.04],
  [R, 0.12],
  [R, 0.98],
  [0.39, 1.08],
  [0.27, 1.15],
  [0.15, 1.18],
  [0.13, H],
]

const geo = once(() => ({
  body: latheBody(PROFILE),
  ribs: knurlRepeat(40, 1),
  collar: new CylinderGeometry(0.15, 0.15, 0.05, 40),
  pump: new CylinderGeometry(0.115, 0.115, 0.2, 40),
  tip: new CylinderGeometry(0.06, 0.07, 0.08, 24),
}))

function Ekos({ p, title, subtitle }: ShapeProps) {
  const { glass, cap, label = '#e3cfa0' } = p.bottle
  const g = geo()
  const front = R + 0.004
  const x0 = -R * 0.6
  const stacked = title.includes('\n')
  return (
    <group dispose={null}>
      <mesh geometry={g.body}>
        <Glass color={glass} tint="#6b3f17" />
      </mesh>
      <mesh geometry={g.collar} position={[0, H + 0.025, 0]}>
        <Glass color={glass} tint="#6b3f17" />
      </mesh>
      <mesh geometry={g.pump} position={[0, H + 0.05 + 0.1, 0]}>
        <CapMaterial color={cap} bump={g.ribs} roughness={0.5} />
      </mesh>
      <mesh geometry={g.tip} position={[0, H + 0.05 + 0.2 + 0.04, 0]}>
        <CapMaterial color={cap} roughness={0.4} />
      </mesh>
      <Label position={[x0, 0.98, front]} size={0.05} spacing={0.02} anchorX="left" wrapRadius={R} color={label}>
        {`natura ${subtitle}`}
      </Label>
      <Label
        position={[x0 - 0.02, 0.62, front]}
        size={stacked ? 0.19 : Math.min(0.13, 1.1 / title.length)}
        spacing={0}
        lineHeight={0.88}
        anchorX="left"
        wrapRadius={R}
        color={label}
      >
        {title}
      </Label>
    </group>
  )
}

export const ekos: ShapeDef = { size: { w: R * 2, h: H + 0.05 + PUMP_H, d: R * 2 }, yaw: 0, Component: Ekos }
