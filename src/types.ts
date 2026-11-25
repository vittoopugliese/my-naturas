/** gloss = shiny glass (default), matte = coated, frosted = satin glass. */
export type Finish = 'gloss' | 'matte' | 'frosted'

/** Colors of one bottle. The model itself comes from the line (see `shapeOf`). */
export interface Bottle {
  glass: string
  /** Bottom color for bottles that fade from color at the top to clear glass at the bottom. */
  glassGradientTo?: string
  finish?: Finish
  cap: string
  capAccent: string | null
  /** Label text color, or "iridescent". */
  label?: string
  shelfOrder: number
  /** Width / height of the product photo; sizes the generic bottle of lines without a model. */
  aspect?: number
  /** Shape and colors guessed from a product photo, not checked against the real bottle. */
  estimated?: boolean
  /** Optional .glb that replaces the procedural bottle. */
  model?: string
}

export interface Perfume {
  id: string
  brand: string
  line: string
  name: string
  concentration: string
  year: number | null
  perfumers: string[]
  family: string
  notes: { top: string[]; heart: string[]; base: string[] }
  bottle: Bottle
  source: string
  verified: boolean
}
