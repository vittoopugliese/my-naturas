import { memo } from 'react'
import type { Perfume } from '../../types'
import { biografia } from './biografia'
import type { ShapeDef } from './common'
import { coragio } from './coragio'
import { ekos } from './ekos'
import { essencial } from './essencial'
import { generic } from './generic'
import { homem } from './homem'
import { humor } from './humor'
import { kaiak } from './kaiak'

/**
 * The bottle model comes from the line: every bottle of a line is the same model and only its
 * colors change. Cor.agio is the one family inside Homem with its own bottle.
 */
export function shapeOf(p: Perfume): ShapeDef {
  switch (p.line) {
    case 'Essencial':
      return essencial
    case 'Homem':
      return /cor\.?agio/i.test(p.name) ? coragio : homem
    case 'Kaiak':
      return kaiak
    case 'Biografia':
      return biografia
    case 'Humor':
      return humor
    case 'Ekos':
      return ekos
    default:
      return generic
  }
}

export function sizeOf(p: Perfume) {
  const { size } = shapeOf(p)
  return typeof size === 'function' ? size(p) : size
}

/** Degrees the bottle is turned on the shelf; the same for the whole line. */
export const yawOf = (p: Perfume) => shapeOf(p).yaw

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
    case 'Kaiak':
      return { title: 'KAIAK', subtitle: p.name.replace(/^Kaiak\s*/i, '').toUpperCase() }
    case 'Biografia':
      return { title: 'Biografia', subtitle: p.name.replace(/^Biografia\s*/i, '').replace(/\(.*\)/, '').trim().toLowerCase() }
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

/** Memoized: hover and selection re-render `Bottle` every time, but the model never changes. */
export const BottleShapeView = memo(function BottleShapeView({ perfume }: { perfume: Perfume }) {
  const { Component } = shapeOf(perfume)
  return <Component p={perfume} {...labelText(perfume)} />
})
