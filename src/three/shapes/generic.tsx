import { useMemo } from 'react'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Perfume } from '../../types'
import { CapMaterial, Glass, Label, isSilver } from '../materials'
import { verticalUVs } from '../textures'
import type { ShapeDef, ShapeProps } from './common'

// Stand-in for catalog bottles without their own model: a rounded block with a cylindrical cap,
// proportioned from the product photo (bottle.aspect = width / height, cap included).
const TOTAL_H = 1.6
const NECK = 0.04
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function dims(p: Perfume) {
  const aspect = clamp(p.bottle.aspect ?? 0.55, 0.3, 0.9)
  const w = clamp(aspect * TOTAL_H, 0.5, 1.15)
  const capH = 0.36
  const h = TOTAL_H - capH - NECK
  const d = clamp(w * 0.55, 0.34, 0.55)
  const capR = Math.min(w * 0.28, 0.2)
  return { w, h, d, capH, capR }
}

function Generic({ p, title, subtitle }: ShapeProps) {
  const { glass, glassGradientTo, finish, cap, label = '#f2f2f2' } = p.bottle
  const { w, h, d, capH, capR } = dims(p)
  const body = useMemo(() => verticalUVs(new RoundedBoxGeometry(w, h, d, 5, Math.min(0.08, w * 0.12))), [w, h, d])
  const front = d / 2 + 0.003
  return (
    <group>
      <mesh geometry={body} position={[0, h / 2, 0]}>
        <Glass color={glass} gradientTo={glassGradientTo} finish={finish} />
      </mesh>
      <mesh position={[0, h + NECK / 2, 0]}>
        <cylinderGeometry args={[capR * 0.7, capR * 0.7, NECK, 24]} />
        <CapMaterial color="#9a9ea3" metal />
      </mesh>
      <mesh position={[0, h + NECK + capH / 2, 0]}>
        <cylinderGeometry args={[capR, capR, capH, 40]} />
        <CapMaterial color={cap} metal={isSilver(cap)} />
      </mesh>
      <Label position={[0, h * 0.62, front]} size={Math.min(0.09, w * 0.13)} spacing={0.06} color={label}>
        {title}
      </Label>
      {subtitle && (
        <Label position={[0, h * 0.62 - 0.085, front]} size={0.04} spacing={0.1} color={label}>
          {subtitle}
        </Label>
      )}
    </group>
  )
}

export const generic: ShapeDef = {
  size: (p) => {
    const { w, d } = dims(p)
    return { w, h: TOTAL_H, d }
  },
  Component: Generic,
}
