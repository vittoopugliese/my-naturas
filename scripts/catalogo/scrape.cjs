// Downloads thescentbase pages for each slug and extracts structured fields. Page HTML is data only.
const fs = require('fs')
const path = require('path')
const [, , slugFile, outDir] = process.argv
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const unesc = (s) =>
  s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, '&')
const NAME = /name:"((?:[^"\\]|\\.)*)"/g
const arr = (seg) => [...seg.matchAll(NAME)].map((m) => unesc(m[1]))

function extract(html) {
  const r = {}
  const d = html.match(/scent_type:[^,]*,description:"((?:[^"\\]|\\.)*)"/)
  r.description = d ? unesc(d[1]) : null
  const desc = r.description || ''
  const g = desc.match(/fragrance for (women and men|men|women)/)
  r.gender = g ? { men: 'men', women: 'women', 'women and men': 'unisex' }[g[1]] : null
  const y = desc.match(/launched in (\d{4})/) || html.match(/Released in (\d{4})/)
  r.year = y ? +y[1] : null
  const fam = desc.match(/is an? (.+?) fragrance/)
  r.family = fam ? fam[1] : null
  for (const k of ['top', 'middle', 'base']) {
    const m = html.match(new RegExp(k + ':\\[(\\{name:.*?\\})\\]'))
    r[k] = m ? arr(m[1]) : []
  }
  const p = html.match(/perfumers:\[(.*?)\]/)
  r.perfumers = p ? arr(p[1]) : []
  const a = html.match(/main_accords:\[(.*?)\],[a-z_]+:/)
  r.accords = a ? [...a[1].matchAll(/name:"([^"]+)"/g)].map((m) => m[1]).slice(0, 5) : []
  const n = html.match(/<title>([^<]*)<\/title>/)
  r.title = n ? n[1] : null
  const img = html.match(/og:image" content="([^"]+)"/)
  r.image = img ? img[1] : null
  const gv = html.match(/gender_votes:\[(.*?)\]/)
  if (gv) r.genderVotes = Object.fromEntries([...gv[1].matchAll(/title:"([^"]+)",value:"(\d+)"/g)].map((m) => [m[1], +m[2]]))
  return r
}

;(async () => {
  const out = []
  for (const line of fs.readFileSync(slugFile, 'utf8').trim().split(/\r?\n/)) {
    const [name, slugs] = line.split('|')
    for (const slug of slugs.trim().split(/\s+/)) {
      const url = `https://thescentbase.com/perfumes/natura/${slug}`
      const file = path.join(outDir, 'pages', slug + '.html')
      let html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
      if (!html) {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
        if (!res.ok) {
          console.error('FAIL', res.status, slug)
          out.push({ line: name, slug, url, error: res.status })
          continue
        }
        html = await res.text()
        fs.writeFileSync(file, html)
        await sleep(400)
      }
      const r = extract(html)
      out.push({ line: name, slug, url, ...r })
      if (r.image) {
        const imgFile = path.join(outDir, 'img', slug + '.jpg')
        if (!fs.existsSync(imgFile)) {
          const ir = await fetch(r.image)
          if (ir.ok) fs.writeFileSync(imgFile, Buffer.from(await ir.arrayBuffer()))
          await sleep(200)
        }
      }
      console.log(name, slug, r.year, r.gender, r.top.length + r.middle.length + r.base.length)
    }
  }
  fs.writeFileSync(path.join(outDir, 'scraped.json'), JSON.stringify(out, null, 1))
})()
