import type { BottleShape, Perfume } from '../../types'
import type { ShapeDef } from './common'
import { coragio } from './coragio'
import { ekos } from './ekos'
import { essencial } from './essencial'
import { generic } from './generic'
import { homem } from './homem'
import { humor } from './humor'
import { kaiak } from './kaiak'

export const SHAPES: Record<BottleShape, ShapeDef> = {
  'homem-rect': homem,
  'coragio-frame': coragio,
  'essencial-faceted': essencial,
  'kaiak-tall': kaiak,
  'humor-pebble': humor,
  'ekos-round': ekos,
  'generic-rect': generic,
}

export function sizeOf(p: Perfume) {
  const { size } = SHAPES[p.bottle.shape]
  return typeof size === 'function' ? size(p) : size
}

/** Text printed on each bottle, roughly matching the real labels. */
function labelText(p: Perfume): { title: string; subtitle: string } {
  switch (p.line) {
    case 'Homem':
      return {
        title: 'HOMEM',
        subtitle: p.name.replace(/^(Natura\s+)?Homem\s*/, '').replace(/\(.*\)/, '').trim().toUpperCase(),
      }
    case 'Ekos':
      // Copaíba prints its name stacked in three syllables; the rest use the plain name.
      if (/copa[ií]ba/i.test(p.name)) return { title: 'CO\nPAÍ\nBA', subtitle: 'ekos' }
      return { title: p.name.replace(/^Ekos\s*/i, '').toUpperCase(), subtitle: 'ekos' }
    case 'Humor': {
      // 'Humor a Dois' reads 'a dois'; 'Paz e Humor' reads 'e paz' on the bottle.
      const tail = p.name.match(/^(.*)\s+e\s+Humor$/i)
      return { title: 'HUMOR', subtitle: (tail ? `e ${tail[1]}` : p.name.replace(/^Humor\s*/i, '')).toLowerCase() }
    }
    default: {
      // 'Sr. N Cedro' -> SR. N / CEDRO. Falls back to the first word when the name doesn't start with the line.
      const clean = p.name.replace(/^#/, '')
      const line = p.line.replace(/^#/, '')
      if (clean.toLowerCase().startsWith(line.toLowerCase()))
        return { title: line.toUpperCase(), subtitle: clean.slice(line.length).trim().toUpperCase() }
      const [first, ...rest] = clean.split(' ')
      return { title: first.toUpperCase(), subtitle: rest.join(' ').toUpperCase() }
    }
  }
}

export function BottleShapeView({ perfume }: { perfume: Perfume }) {
  const { Component } = SHAPES[perfume.bottle.shape]
  return <Component p={perfume} {...labelText(perfume)} />
}
