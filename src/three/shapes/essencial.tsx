import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'
import { CapMaterial, Glass, Label } from '../materials'
import type { ShapeDef, ShapeProps } from './common'

// Essencial Exclusivo: big matte block whose front-left is cut into angled facets.
const W = 1.12
const H = 1.35
const D = 0.62
const NECK_H = 0.08
const CAP_W = W * 0.62
const CAP_H = 0.4

/**
 * Flat-shaded convex body. The front face is split into facets: the top-left corner and
 * the left edge are pushed back, leaving a main plane that covers the lower right.
 */
function facetedBody() {
  const z = D / 2
  const c = 0.24
  const v = (x: number, y: number, zz: number) => new Vector3(x, y, zz)
  const A = v(-W / 2, H, z - c)
  const B = v(W / 2, H, z - 0.45 * c)
  const R = v(W / 2, 0.6 * H, z)
  const E = v(-0.28 * W, 0.82 * H, z)
  const F = v(-0.34 * W, 0.42 * H, z)
  const G = v(-0.16 * W, 0, z)
  const C = v(W / 2, 0, z)
  const Dp = v(-W / 2, 0, z - c)
  const bTL = v(-W / 2, H, -z)
  const bTR = v(W / 2, H, -z)
  const bBR = v(W / 2, 0, -z)
  const bBL = v(-W / 2, 0, -z)
  const faces = [
    [A, B, E],
    [B, R, E],
    [A, E, F],
    [A, F, Dp],
    [Dp, F, G],
    [E, F, G, C, R], // main front plane
    [A, B, bTR, bTL], // top
    [B, R, C, bBR, bTR], // right
    [Dp, G, C, bBR, bBL], // bottom
    [A, Dp, bBL, bTL], // left
    [bTL, bTR, bBR, bBL], // back
  ]
  const center = v(0, H / 2, 0)
  const out: number[] = []
  const ab = new Vector3()
  const ac = new Vector3()
  for (const poly of faces) {
    for (let i = 1; i < poly.length - 1; i++) {
      let [a, b, cc] = [poly[0], poly[i], poly[i + 1]]
      ab.subVectors(b, a)
      ac.subVectors(cc, a)
      const n = ab.cross(ac)
      const mid = a.clone().add(b).add(cc).divideScalar(3).sub(center)
      if (n.dot(mid) < 0) [b, cc] = [cc, b]
      out.push(a.x, a.y, a.z, b.x, b.y, b.z, cc.x, cc.y, cc.z)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(out, 3))
  g.computeVertexNormals()
  return g
}

function Essencial({ p, title, subtitle }: ShapeProps) {
  const { glass, finish, cap, capAccent, label = '#d4d4d6' } = p.bottle
  const body = useMemo(facetedBody, [])
  const front = D / 2 + 0.003
  const x0 = -W * 0.14
  return (
    <group>
      <mesh geometry={body}>
        <Glass color={glass} finish={finish} />
      </mesh>
      <mesh position={[0, H + NECK_H / 2, 0]}>
        <cylinderGeometry args={[0.17, 0.17, NECK_H, 40]} />
        <CapMaterial color={capAccent ?? '#d9dcdf'} metal roughness={0.35} />
      </mesh>
      <mesh position={[0, H + NECK_H + 0.015, 0]}>
        <boxGeometry args={[CAP_W * 0.94, 0.03, D * 0.78]} />
        <CapMaterial color="#1c1c1e" />
      </mesh>
      <mesh position={[0, H + NECK_H + 0.03 + CAP_H / 2, 0]}>
        <boxGeometry args={[CAP_W, CAP_H, D * 0.82]} />
        <CapMaterial color={cap} roughness={0.65} />
      </mesh>
      <Label position={[x0, 0.29, front]} size={0.04} spacing={0.02} anchorX="left" color={label}>
        natura
      </Label>
      <Label position={[x0, 0.21, front]} size={0.085} spacing={0.1} anchorX="left" color={label}>
        {title}
      </Label>
      <Label position={[x0 + W * 0.13, 0.14, front]} size={0.045} spacing={0.1} anchorX="left" color={label}>
        {subtitle}
      </Label>
    </group>
  )
}

export const essencial: ShapeDef = {
  size: { w: W, h: H + NECK_H + 0.03 + CAP_H, d: D },
  Component: Essencial,
}
