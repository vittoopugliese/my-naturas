import raw from '../data/perfumes.json'
import type { Occasion, Perfume, Season } from './types'

/** My collection, in the order of the real shelf. */
export const perfumes: Perfume[] = (raw.perfumes as Perfume[])
  .slice()
  .sort((a, b) => a.bottle.shelfOrder - b.bottle.shelfOrder)

export const ownedIds = new Set(perfumes.map((p) => p.id))

export const lines = [...new Set(perfumes.map((p) => p.line))]

/** Broad families for the filter chips, derived from the free-text `family` field. */
export const familyTags = ['amaderada', 'especiada', 'aromática', 'cítrica', 'marina', 'frutal', 'floral', 'oriental', 'cuero'] as const
export type FamilyTag = (typeof familyTags)[number]

const SYNONYMS: Partial<Record<FamilyTag, string[]>> = { marina: ['marina', 'acuática'] }

export function hasFamily(p: Perfume, tag: FamilyTag) {
  const f = p.family.toLowerCase()
  return (SYNONYMS[tag] ?? [tag]).some((t) => f.includes(t))
}

export const seasons: { id: Season; label: string }[] = [
  { id: 'verano', label: 'Verano' },
  { id: 'otoño', label: 'Otoño' },
  { id: 'invierno', label: 'Invierno' },
  { id: 'primavera', label: 'Primavera' },
]

export const occasions: { id: Occasion; label: string }[] = [
  { id: 'dia', label: 'Día a día' },
  { id: 'cena', label: 'Cena casual' },
  { id: 'formal', label: 'Cena formal' },
  { id: 'boliche', label: 'Boliche' },
]

// Notes that make a perfume read fresh (warm weather, daytime) or warm and dense (cold weather, night).
const FRESH = ['limón', 'lima', 'bergamota', 'mandarina', 'pomelo', 'naranja', 'clementina', 'cítricos', 'menta', 'notas acuáticas', 'sal marina', 'algas', 'calone', 'pataqueira', 'notas verdes', 'enebro', 'romero']
const WARM = ['oud', 'cuero', 'ámbar', 'benjuí', 'láudano', 'incienso', 'olíbano', 'pachulí', 'canela', 'azafrán', 'haba tonka', 'cumarú', 'cumarina', 'bálsamo', 'estoraque', 'palo santo', 'copaíba']
const SWEET = ['vainilla', 'praliné', 'chocolate', 'dulce de leche', 'caramelo', 'frambuesa', 'cereza negra', 'mora', 'ciruela', 'ananá', 'durazno', 'manzana', 'pera', 'coñac']

/**
 * Seasons and occasions, estimated from the family, the notes and the concentration.
 * A perfume can set `seasons` / `occasions` in its data to replace the estimate.
 */
function profile(p: Perfume) {
  const notes = [...p.notes.top, ...p.notes.heart, ...p.notes.base].map((n) => n.toLowerCase())
  const fam = p.family.toLowerCase()
  const count = (list: string[]) => notes.filter((n) => list.some((k) => n.includes(k))).length
  const strong = /parfum/i.test(p.concentration) && !/colônia/i.test(p.concentration)
  let fresh = count(FRESH) + (/cítrica|acuática|marina|fresca/.test(fam) ? 3 : 0) + (/colônia/i.test(p.concentration) ? 1 : 0)
  let warm = count(WARM) + (/oriental|ambarada|cuero|intensa|especiada/.test(fam) ? 3 : 0) + (/amaderada/.test(fam) ? 1 : 0) + (strong ? 2 : 0)
  const sweet = count(SWEET)
  // Normalize: perfumes with long note lists should not win just by length.
  const total = Math.max(1, notes.length / 6)
  fresh /= total
  warm /= total
  const lean = warm - fresh // > 0: warm, < 0: fresh

  const s = new Set<Season>()
  if (lean < 0.5) s.add('verano')
  if (lean < 1.5 || /floral|aromática|fougère/.test(fam)) s.add('primavera')
  if (lean > -1) s.add('otoño')
  if (lean > 0.5) s.add('invierno')

  const o = new Set<Occasion>()
  if (lean < 1 && !strong) o.add('dia')
  if (lean < 2.5) o.add('cena')
  if (lean > 0 || strong) o.add('formal')
  if (sweet >= 2 || (strong && lean > 0.5) || /especiada fresca|oriental/.test(fam)) o.add('boliche')
  return { seasons: s, occasions: o }
}

const profiles = new Map<string, ReturnType<typeof profile>>()
function profileOf(p: Perfume) {
  let v = profiles.get(p.id)
  if (!v) {
    const est = profile(p)
    v = {
      seasons: p.seasons ? new Set(p.seasons) : est.seasons,
      occasions: p.occasions ? new Set(p.occasions) : est.occasions,
    }
    profiles.set(p.id, v)
  }
  return v
}

export const seasonsOf = (p: Perfume) => profileOf(p).seasons
export const occasionsOf = (p: Perfume) => profileOf(p).occasions

export type FilterState = {
  lines: Set<string>
  families: Set<FamilyTag>
  seasons: Set<Season>
  occasions: Set<Occasion>
}

export const emptyFilters = (): FilterState => ({ lines: new Set(), families: new Set(), seasons: new Set(), occasions: new Set() })

export const filterCount = (f: FilterState) => f.lines.size + f.families.size + f.seasons.size + f.occasions.size

/** A perfume matches when it fits every active group, and any one choice inside each group. */
export function matcher(f: FilterState) {
  const any = <T,>(set: Set<T>, test: (v: T) => boolean) => set.size === 0 || [...set].some(test)
  return (p: Perfume) =>
    any(f.lines, (l) => p.line === l) &&
    any(f.families, (t) => hasFamily(p, t)) &&
    any(f.seasons, (s) => seasonsOf(p).has(s)) &&
    any(f.occasions, (o) => occasionsOf(p).has(o))
}
