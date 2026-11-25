import { BufferGeometry, CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace, Vector3 } from 'three'

/** Cross-hatched knurl pattern for bump maps (caps, Cor.agio's sides). Shared by every user. */
let knurl: CanvasTexture | null = null
export function knurlTexture() {
  if (knurl) return knurl
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, size, size)
  g.strokeStyle = '#000'
  g.lineWidth = 6
  for (const [x0, y0, x1, y1] of [
    [0, 0, size, size],
    [0, size, size, 0],
    [-size, 0, size, 2 * size],
    [0, -size, 2 * size, size],
    [-size, size, size, -size],
    [0, 2 * size, 2 * size, 0],
  ]) {
    g.beginPath()
    g.moveTo(x0, y0)
    g.lineTo(x1, y1)
    g.stroke()
  }
  knurl = new CanvasTexture(c)
  knurl.colorSpace = NoColorSpace
  knurl.wrapS = knurl.wrapT = RepeatWrapping
  return knurl
}

/** Copy of the knurl texture with its own repeat, since repeat lives on the texture. One copy per repeat. */
const knurlCopies = new Map<string, CanvasTexture>()
export function knurlRepeat(u: number, v: number) {
  const key = `${u}x${v}`
  let t = knurlCopies.get(key)
  if (!t) {
    t = knurlTexture().clone()
    t.repeat.set(u, v)
    t.needsUpdate = true
    knurlCopies.set(key, t)
  }
  return t
}

/**
 * Vertical fade for bottles that go from colored (top) to clear (bottom).
 * `map` carries the color; `transmissionMap` (red channel) is dark where the glass is opaque.
 */
const gradients = new Map<string, { map: CanvasTexture; transmissionMap: CanvasTexture }>()
export function gradientTextures(top: string, bottom: string) {
  const key = top + bottom
  const cached = gradients.get(key)
  if (cached) return cached
  const h = 256
  const make = (paint: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas')
    c.width = 2
    c.height = h
    paint(c.getContext('2d')!)
    return new CanvasTexture(c)
  }
  const map = make((g) => {
    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, top)
    grad.addColorStop(0.35, top)
    grad.addColorStop(0.95, bottom)
    g.fillStyle = grad
    g.fillRect(0, 0, 2, h)
  })
  map.colorSpace = SRGBColorSpace
  const transmissionMap = make((g) => {
    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#222')
    grad.addColorStop(0.35, '#2a2a2a')
    grad.addColorStop(0.95, '#f4f4f4')
    g.fillStyle = grad
    g.fillRect(0, 0, 2, h)
  })
  transmissionMap.colorSpace = NoColorSpace
  const out = { map, transmissionMap }
  gradients.set(key, out)
  return out
}

/** UVs where v follows height (0 at the base, 1 at the top). For vertical gradients. */
export function verticalUVs<T extends BufferGeometry>(g: T): T {
  g.computeBoundingBox()
  const { min, max } = g.boundingBox!
  const pos = g.attributes.position
  const uv = g.attributes.uv
  if (!uv) return g
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5, (pos.getY(i) - min.y) / (max.y - min.y))
  uv.needsUpdate = true
  return g
}

/** Box-projected UVs in scene units times `scale`, so a tiling texture keeps one size on every face. */
export function boxUVs<T extends BufferGeometry>(g: T, scale: number): T {
  const pos = g.attributes.position
  const nor = g.attributes.normal
  const uv = g.attributes.uv
  if (!uv || !nor) return g
  const n = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(nor, i)
    const ax = Math.abs(n.x)
    const ay = Math.abs(n.y)
    const az = Math.abs(n.z)
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    if (ax >= ay && ax >= az) uv.setXY(i, z * scale, y * scale)
    else if (ay >= az) uv.setXY(i, x * scale, z * scale)
    else uv.setXY(i, x * scale, y * scale)
  }
  uv.needsUpdate = true
  return g
}
