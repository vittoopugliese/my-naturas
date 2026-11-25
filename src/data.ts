import raw from '../data/perfumes.json'
import type { Perfume } from './types'

/** My collection, in the order of the real shelf. */
export const perfumes: Perfume[] = (raw.perfumes as Perfume[])
  .slice()
  .sort((a, b) => a.bottle.shelfOrder - b.bottle.shelfOrder)

export const ownedIds = new Set(perfumes.map((p) => p.id))

export const lines = [...new Set(perfumes.map((p) => p.line))]

/** Broad families for the filter chips, derived from the free-text `family` field. */
export const familyTags = ['amaderada', 'especiada', 'aromática', 'cítrica', 'marina', 'frutal', 'oriental'] as const
export type FamilyTag = (typeof familyTags)[number]

const SYNONYMS: Partial<Record<FamilyTag, string[]>> = { marina: ['marina', 'acuática'] }

export function hasFamily(p: Perfume, tag: FamilyTag) {
  const f = p.family.toLowerCase()
  return (SYNONYMS[tag] ?? [tag]).some((t) => f.includes(t))
}

export function matcher(activeLines: Set<string>, activeFamilies: Set<FamilyTag>) {
  return (p: Perfume) =>
    (activeLines.size === 0 || activeLines.has(p.line)) &&
    (activeFamilies.size === 0 || [...activeFamilies].some((f) => hasFamily(p, f)))
}
