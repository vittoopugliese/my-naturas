import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, Vector3 } from 'three'
import { CapMaterial, Glass, Label } from '../materials'
import { once, type ShapeDef, type ShapeProps } from './common'

// Every Essencial: big block whose front-left is cut into angled facets, gold or silver neck and a
// square cap. The perfumes only change colors (Exclusivo is matte grey, Oud Pimenta fades navy to
// copper, Sentir is green, Atrai is plum).
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
  const uv: number[] = []
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
      // v follows height, for bottles that fade from one color to another.
      uv.push(0.5, a.y / H, 0.5, b.y / H, 0.5, cc.y / H)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(out, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

const geo = once(() => ({
  body: facetedBody(),
  neck: new CylinderGeometry(0.17, 0.17, NECK_H, 40),
  capBase: new BoxGeometry(CAP_W * 0.94, 0.03, D * 0.78),
  cap: new BoxGeometry(CAP_W, CAP_H, D * 0.82),
}))

function Essencial({ p, title, subtitle }: ShapeProps) {
  const { glass, glassGradientTo, finish, cap, capAccent, label = '#d4d4d6' } = p.bottle
  const g = geo()
  const front = D / 2 + 0.003
  const x0 = -W * 0.14
  return (
    <group>
      <mesh geometry={g.body}>
        <Glass color={glass} gradientTo={glassGradientTo} finish={finish} />
      </mesh>
      <mesh geometry={g.neck} position={[0, H + NECK_H / 2, 0]}>
        <CapMaterial color={capAccent ?? '#d9dcdf'} metal roughness={0.35} />
      </mesh>
      <mesh geometry={g.capBase} position={[0, H + NECK_H + 0.015, 0]}>
        <CapMaterial color="#1c1c1e" />
      </mesh>
      <mesh geometry={g.cap} position={[0, H + NECK_H + 0.03 + CAP_H / 2, 0]}>
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
  yaw: 18,
  Component: Essencial,
}
