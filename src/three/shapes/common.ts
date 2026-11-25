import type { JSX } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { Perfume } from '../../types'

export type Size = { w: number; h: number; d: number }

export type ShapeProps = { p: Perfume; title: string; subtitle: string }

/**
 * A procedural bottle, one per line. Scene units: 1 = 10 cm. The bottle stands with its base at y = 0,
 * centered on x/z, label facing +z. `size` is the full bounding box (cap included), used for layout.
 * `yaw` is how many degrees the bottle is turned on the shelf (positive shows its right side).
 */
export type ShapeDef = {
  size: Size | ((p: Perfume) => Size)
  yaw: number
  Component: (props: ShapeProps) => JSX.Element
}

/**
 * Builds a value the first time it is asked for, then returns the same one.
 * Geometries live at module level this way: every bottle of a line shares them and they are never rebuilt.
 */
export function once<T>(make: () => T): () => T {
  let v: T | undefined
  return () => (v ??= make())
}

/** Same as `once`, keyed: one value per distinct key. */
export function memoBy<T>(make: (key: string) => T): (key: string) => T {
  const cache = new Map<string, T>()
  return (key) => {
    let v = cache.get(key)
    if (v === undefined) cache.set(key, (v = make(key)))
    return v
  }
}

/** One horizontal slice of a lofted body: a rounded rectangle at height `y`. */
export type Ring = { y: number; w: number; d: number; r: number }

/**
 * Smooth body built from horizontal rounded-rectangle slices, bottom to top, closed at both ends.
 * UVs: u goes around, v follows height (0 at the base, 1 at the top), so vertical gradients work.
 */
export function loft(rings: Ring[], cornerSegments = 6): BufferGeometry {
  const perCorner = cornerSegments + 1
  const n = perCorner * 4
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const y0 = rings[0].y
  const y1 = rings[rings.length - 1].y
  const corners: [number, number, number][] = [
    [1, 1, 0],
    [-1, 1, Math.PI / 2],
    [-1, -1, Math.PI],
    [1, -1, (3 * Math.PI) / 2],
  ]
  for (const { y, w, d, r } of rings) {
    const rr = Math.min(r, w / 2, d / 2)
    for (const [sx, sz, a0] of corners) {
      const cx = sx * (w / 2 - rr)
      const cz = sz * (d / 2 - rr)
      for (let i = 0; i < perCorner; i++) {
        const a = a0 + (i / cornerSegments) * (Math.PI / 2)
        pos.push(cx + rr * Math.cos(a), y, -(cz + rr * Math.sin(a)))
        uv.push(pos.length / 3 / n, (y - y0) / (y1 - y0))
      }
    }
  }
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const a = k * n + i
      const b = k * n + ((i + 1) % n)
      const c = a + n
      const e = b + n
      idx.push(a, b, c, b, e, c)
    }
  }
  // End caps: a fan from the center of the first and last rings.
  for (const [k, flip] of [
    [0, true],
    [rings.length - 1, false],
  ] as const) {
    const center = pos.length / 3
    pos.push(0, rings[k].y, 0)
    uv.push(0.5, k === 0 ? 0 : 1)
    for (let i = 0; i < n; i++) {
      const a = k * n + i
      const b = k * n + ((i + 1) % n)
      if (flip) idx.push(center, b, a)
      else idx.push(center, a, b)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Height samples from a to b, `steps` intervals, denser where needed via the easing `f`. */
export function samples(a: number, b: number, steps: number, f = (t: number) => t) {
  return Array.from({ length: steps + 1 }, (_, i) => a + (b - a) * f(i / steps))
}

/** How far a quarter-circle of radius `r` has moved in, `t` of the way along it (0 = edge, 1 = full). */
export const arcIn = (t: number) => 1 - Math.sqrt(Math.max(0, 1 - t * t))
