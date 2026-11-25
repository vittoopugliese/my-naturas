import type { JSX } from 'react'
import type { Perfume } from '../../types'

export type Size = { w: number; h: number; d: number }

export type ShapeProps = { p: Perfume; title: string; subtitle: string }

/**
 * A procedural bottle. Scene units: 1 = 10 cm. The bottle stands with its base at y = 0,
 * centered on x/z, label facing +z. `size` is the full bounding box (cap included), used for layout; it may depend on the perfume.
 */
export type ShapeDef = {
  size: Size | ((p: Perfume) => Size)
  Component: (props: ShapeProps) => JSX.Element
}
