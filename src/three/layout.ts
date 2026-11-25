import { MathUtils } from 'three'
import type { Perfume } from '../types'
import { sizeOf, yawOf } from './shapes'

/** A bottle's footprint on the shelf: rectangle centered at (x, z), turned by `angle` (rotation.y). */
type Footprint = { x: number; z: number; hw: number; hd: number; angle: number }

export type Placement = { x: number; z: number; angle: number }
export type ShelfLayout = { byId: Record<string, Placement>; total: number }

/** Back edge of the bottles (the shelf runs z = -0.9 to 0.9). */
const BACK = -0.72
const GAP = 0.012
const STEP = 0.004

function axes(a: number): [number, number][] {
  // Local x and z axes of a group rotated by `a` around y, projected on the xz plane.
  return [
    [Math.cos(a), -Math.sin(a)],
    [Math.sin(a), Math.cos(a)],
  ]
}

function radius(f: Footprint, [nx, nz]: [number, number]) {
  const [ux, uz] = axes(f.angle)
  return f.hw * Math.abs(ux[0] * nx + ux[1] * nz) + f.hd * Math.abs(uz[0] * nx + uz[1] * nz)
}

/** Separating-axis test for two rotated rectangles. */
function overlaps(a: Footprint, b: Footprint) {
  const dx = b.x - a.x
  const dz = b.z - a.z
  for (const n of [...axes(a.angle), ...axes(b.angle)]) {
    if (Math.abs(dx * n[0] + dz * n[1]) >= radius(a, n) + radius(b, n) + GAP) return false
  }
  return true
}

/**
 * Packs the bottles left to right like on the real shelf: each one turned by its `yaw`
 * and pushed against the back, then slid right only until it clears its neighbors.
 * Turned bottles tuck behind each other, so the row looks stacked rather than spaced.
 */
export function packShelf(perfumes: Perfume[]): ShelfLayout {
  const placed: Footprint[] = []
  for (const p of perfumes) {
    const { w, d } = sizeOf(p)
    const angle = -MathUtils.degToRad(yawOf(p))
    const f: Footprint = { x: 0, z: 0, hw: w / 2, hd: d / 2, angle }
    f.z = BACK + radius(f, [0, 1])
    if (placed.length) {
      f.x = placed[placed.length - 1].x
      const near = placed.slice(-3)
      while (near.some((o) => overlaps(o, f))) f.x += STEP
    }
    placed.push(f)
  }
  if (!placed.length) return { byId: {}, total: 0 }
  const left = Math.min(...placed.map((f) => f.x - radius(f, [1, 0])))
  const right = Math.max(...placed.map((f) => f.x + radius(f, [1, 0])))
  const shift = (left + right) / 2
  const byId: Record<string, Placement> = {}
  perfumes.forEach((p, i) => {
    const f = placed[i]
    byId[p.id] = { x: f.x - shift, z: f.z, angle: f.angle }
  })
  return { byId, total: right - left }
}
