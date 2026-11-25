export type BottleShape = 'homem-rect' | 'coragio-frame' | 'essencial-faceted' | 'kaiak-tall' | 'humor-pebble' | 'ekos-round' | 'generic-rect'

/** gloss = shiny glass (default), matte = coated, frosted = satin glass. */
export type Finish = 'gloss' | 'matte' | 'frosted'

export interface Bottle {
  shape: BottleShape
  glass: string
  /** Bottom color for bottles that fade from color at the top to clear glass at the bottom. */
  glassGradientTo?: string
  finish?: Finish
  cap: string
  capAccent: string | null
  /** Label text color, or "iridescent". */
  label?: string
  shelfOrder: number
  /** Degrees the bottle is turned on the shelf; positive shows its right side. */
  yaw?: number
  /** Width / height of the product photo; sizes the generic bottle. */
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
