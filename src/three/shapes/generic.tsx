import { CylinderGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Perfume } from '../../types'
import { CapMaterial, Glass, Label, isSilver } from '../materials'
import { verticalUVs } from '../textures'
import { memoBy, type ShapeDef, type ShapeProps } from './common'

// Stand-in for catalog lines without their own model: a rounded block with a cylindrical cap,
// proportioned from the product photo (bottle.aspect = width / height, cap included).
const TOTAL_H = 1.6
const NECK = 0.04
const CAP_H = 0.36
const BODY_H = TOTAL_H - CAP_H - NECK
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Width in 1 cm steps, so similar bottles share one set of geometries. */
function width(p: Perfume) {
  const aspect = clamp(p.bottle.aspect ?? 0.55, 0.3, 0.9)
  return Math.round(clamp(aspect * TOTAL_H, 0.5, 1.15) * 10) / 10
}
const depthOf = (w: number) => clamp(w * 0.55, 0.34, 0.55)
const capROf = (w: number) => Math.min(w * 0.28, 0.2)

const geo = memoBy((key) => {
  const w = Number(key)
  const d = depthOf(w)
  const capR = capROf(w)
  return {
    body: verticalUVs(new RoundedBoxGeometry(w, BODY_H, d, 5, Math.min(0.08, w * 0.12))),
    neck: new CylinderGeometry(capR * 0.7, capR * 0.7, NECK, 24),
    cap: new CylinderGeometry(capR, capR, CAP_H, 40),
  }
})

function Generic({ p, title, subtitle }: ShapeProps) {
  const { glass, glassGradientTo, finish, cap, label = '#f2f2f2' } = p.bottle
  const w = width(p)
  const g = geo(String(w))
  const front = depthOf(w) / 2 + 0.003
  return (
    <group>
      <mesh geometry={g.body} position={[0, BODY_H / 2, 0]}>
        <Glass color={glass} gradientTo={glassGradientTo} finish={finish} />
      </mesh>
      <mesh geometry={g.neck} position={[0, BODY_H + NECK / 2, 0]}>
        <CapMaterial color="#9a9ea3" metal />
      </mesh>
      <mesh geometry={g.cap} position={[0, BODY_H + NECK + CAP_H / 2, 0]}>
        <CapMaterial color={cap} metal={isSilver(cap)} />
      </mesh>
      <Label position={[0, BODY_H * 0.62, front]} size={Math.min(0.09, w * 0.13)} spacing={0.06} color={label}>
        {title}
      </Label>
      {subtitle && (
        <Label position={[0, BODY_H * 0.62 - 0.085, front]} size={0.04} spacing={0.1} color={label}>
          {subtitle}
        </Label>
      )}
    </group>
  )
}

export const generic: ShapeDef = {
  size: (p) => {
    const w = width(p)
    return { w, h: TOTAL_H, d: depthOf(w) }
  },
  yaw: 30,
  Component: Generic,
}
