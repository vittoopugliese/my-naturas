import { CylinderGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { CapMaterial, Glass, Label, isSilver } from '../materials'
import { knurlRepeat, verticalUVs } from '../textures'
import { once, type ShapeDef, type ShapeProps } from './common'

// Every Homem (except the Cor.agio family): squarish block, rounded edges, knurled cylindrical cap.
const W = 0.78
const H = 1.08
const D = 0.42
const NECK = 0.03
const CAP_R = 0.17
const CAP_H = 0.34
const GRIP_H = CAP_H - 0.082

const geo = once(() => ({
  body: verticalUVs(new RoundedBoxGeometry(W, H, D, 6, 0.07)),
  neck: new CylinderGeometry(0.13, 0.13, NECK, 32),
  band: new CylinderGeometry(CAP_R, CAP_R, 0.07, 48),
  groove: new CylinderGeometry(CAP_R - 0.006, CAP_R - 0.006, 0.012, 48),
  grip: new CylinderGeometry(CAP_R, CAP_R, GRIP_H, 48),
  knurl: knurlRepeat(28, 5),
}))

function Homem({ p, title, subtitle }: ShapeProps) {
  const { glass, glassGradientTo, finish, cap, label = '#f2f2f2' } = p.bottle
  const g = geo()
  const metal = isSilver(cap)
  const front = D / 2 + 0.003
  const x0 = -0.06
  const ly = H * 0.62
  return (
    <group>
      <mesh geometry={g.body} position={[0, H / 2, 0]}>
        <Glass color={glass} gradientTo={glassGradientTo} finish={finish} />
      </mesh>
      <mesh geometry={g.neck} position={[0, H + NECK / 2, 0]}>
        <CapMaterial color="#151515" />
      </mesh>
      <group position={[0, H + NECK, 0]}>
        {/* smooth band, groove, knurled grip */}
        <mesh geometry={g.band} position={[0, 0.035, 0]}>
          <CapMaterial color={cap} metal={metal} />
        </mesh>
        <mesh geometry={g.groove} position={[0, 0.076, 0]}>
          <CapMaterial color="#0a0a0a" />
        </mesh>
        <mesh geometry={g.grip} position={[0, 0.082 + GRIP_H / 2, 0]}>
          <CapMaterial color={cap} metal={metal} bump={g.knurl} roughness={metal ? 0.32 : 0.55} />
        </mesh>
      </group>
      <Label position={[x0, ly + 0.085, front]} size={0.038} spacing={0.02} anchorX="left" color={label}>
        natura
      </Label>
      <Label position={[x0, ly, front]} size={0.095} spacing={0.06} anchorX="left" color={label}>
        {title}
      </Label>
      {subtitle && (
        <Label position={[x0, ly - 0.078, front]} size={0.04} spacing={0.12} anchorX="left" color={label}>
          {subtitle}
        </Label>
      )}
    </group>
  )
}

export const homem: ShapeDef = { size: { w: W, h: H + NECK + CAP_H, d: D }, yaw: 44, Component: Homem }
