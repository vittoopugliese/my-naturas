// Builds data/catalogo.json: every Natura men's / unisex perfume from thescentbase that is not
// already in the owner's collection (data/perfumes.json), with Spanish notes and an estimated bottle.
const fs = require('fs')
const [, , scrapedFile, colorsFile, collectionFile, outFile] = process.argv
if (!outFile) {
  console.error('Uso: node build-catalog.cjs <scraped.json> <colors.json> <perfumes.json> <catalogo.json>')
  process.exit(1)
}
const scraped = JSON.parse(fs.readFileSync(scrapedFile, 'utf8'))
const colors = JSON.parse(fs.readFileSync(colorsFile, 'utf8'))
const collection = JSON.parse(fs.readFileSync(collectionFile, 'utf8'))
const NOTES = require('./notes-es.cjs')

// thescentbase slug -> id in data/perfumes.json
const OWNED = {
  'essencial-exclusivo': 'essencial-exclusivo',
  'homem-cor-agio': 'homem-coragio',
  homem: 'homem',
  'homem-essence': 'homem-essence',
  'homem-tato': 'homem-tato',
  'homem-elo': 'homem-elo',
  'kaiak-sonar': 'kaiak-sonar',
  'humor-a-dois': 'humor-a-dois',
  'humor-6-paz-e-humor': 'humor-e-paz',
  'kaiak-extremo': 'kaiak-extremo',
  'kaiak-noite': 'kaiak-noite',
  'kaiak-pulso': 'kaiak-pulso',
  'kaiak-oceano': 'kaiak-oceano',
  'essencial-oud-pimenta': 'essencial-oud-pimenta',
  'biografia-assinatura': 'biografia-assinatura',
  'essencial-atrai': 'essencial-atrai',
  'essencial-sentir': 'essencial-sentir',
  'essencial-exclusivo-floral': 'essencial-exclusivo-floral',
}
const ownedIds = new Set(collection.perfumes.map((p) => p.id))
for (const id of Object.values(OWNED)) if (!ownedIds.has(id)) throw new Error('unknown owned id ' + id)

const FAMILY = {
  Aromatic: 'aromática', Fougere: 'fougère', Woody: 'amaderada', Floral: 'floral', Musk: 'almizclada',
  Oriental: 'oriental', Spicy: 'especiada', Aquatic: 'acuática', Fruity: 'frutal', Citrus: 'cítrica',
  Chypre: 'chipre', Leather: 'cuero',
}
const family = (f) => {
  if (!f) return ''
  const s = f.split(' ').map((w) => FAMILY[w] ?? w.toLowerCase()).join(' ')
  return s[0].toUpperCase() + s.slice(1)
}
const es = (n) => {
  if (!(n in NOTES)) throw new Error('missing note translation: ' + n)
  return NOTES[n]
}
const uniq = (a) => [...new Set(a)]

const isMasculine = (p) => {
  if (p.gender === 'men' || p.gender === 'unisex') return true
  const v = p.genderVotes || {}
  const male = (v.male || 0) + (v['more male'] || 0)
  const total = Object.values(v).reduce((a, b) => a + b, 0)
  return total > 0 && male / total > 0.6
}

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lum = (h) => {
  const [r, g, b] = rgb(h)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const dist = (a, b) => rgb(a).reduce((s, v, i) => s + Math.abs(v - rgb(b)[i]), 0)

// Lines with their own bottle model in src/three/shapes (shapeOf). The rest use the generic bottle, sized by the photo.
const MODELED = new Set(['Homem', 'Essencial', 'Kaiak', 'Biografia', 'Humor', 'Ekos'])

function bottleFor(p) {
  const c = colors[p.slug] || {}
  let glass = c.body || '#8a8f95'
  let glassGradientTo
  // Colored top fading to a much lighter bottom: treat as a gradient bottle (like Tato or Elo).
  if (c.bodyTop && c.bodyBottom && dist(c.bodyTop, c.bodyBottom) > 150 && lum(c.bodyBottom) > lum(c.bodyTop) + 60) {
    glass = c.bodyTop
    glassGradientTo = c.bodyBottom
  }
  const cap = c.cap || '#1b1b1b'
  const label = lum(glass) > 150 ? '#1a1a1a' : '#f2f2f2'
  const b = { glass, cap, capAccent: null, label, shelfOrder: 0 }
  if (glassGradientTo) b.glassGradientTo = glassGradientTo
  if (!MODELED.has(p.line) && c.aspect) b.aspect = c.aspect
  b.estimated = true
  return b
}

const nameOf = (p) => {
  const m = (p.description || '').match(/^(.+?) by Natura/)
  // Drop edition years baked into some names ("Ekos Alma 2025").
  return m ? m[1].replace(/\s+\d{4}$/, '') : p.slug
}

const perfumes = []
for (const p of scraped) {
  if (p.error || OWNED[p.slug] || !isMasculine(p)) continue
  const name = nameOf(p)
  perfumes.push({
    id: p.slug,
    brand: 'Natura',
    line: p.line,
    name,
    concentration: '',
    year: p.year,
    perfumers: p.perfumers,
    family: family(p.family),
    notes: { top: uniq(p.top.map(es)), heart: uniq(p.middle.map(es)), base: uniq(p.base.map(es)) },
    bottle: bottleFor(p),
    source: p.url,
    verified: false,
  })
}

const out = {
  _meta: {
    updated: new Date().toISOString().slice(0, 10),
    notes:
      'Natura men\'s and unisex perfumes from thescentbase.com (gender, year, notes, perfumers). Excludes the ones in data/perfumes.json, which the app merges in by id. bottle.* is estimated: colors sampled from the product photo (bottle.estimated = true). The bottle model comes from the line. concentration is empty because the source does not list it.',
    ownedSlugs: OWNED,
  },
  perfumes,
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n')
const byLine = {}
for (const p of perfumes) byLine[p.line] = (byLine[p.line] || 0) + 1
console.log(perfumes.length, 'perfumes', byLine)
