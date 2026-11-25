// Estimates bottle (body) and cap colors from each product photo (bottle on a light background).
const fs = require('fs')
const path = require('path')
const jpeg = require('jpeg-js')
const [, , imgDir, outFile] = process.argv

const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const isBg = (r, g, b) => r > 218 && g > 218 && b > 218 && Math.max(r, g, b) - Math.min(r, g, b) < 22

function analyze(file) {
  const img = jpeg.decode(fs.readFileSync(file), { useTArray: true, formatAsRGBA: true })
  const { width: w, height: h, data } = img
  const px = (x, y) => {
    const i = (y * w + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }
  // Bounding box of non-background pixels.
  let x0 = w, x1 = 0, y0 = h, y1 = 0
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2) {
      const [r, g, b] = px(x, y)
      if (!isBg(r, g, b)) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  if (x1 <= x0) return null
  const bw = x1 - x0
  const bh = y1 - y0
  // Median per channel over a region, skipping background and specular highlights.
  const region = (fy0, fy1, fx0, fx1) => {
    const rs = [], gs = [], bs = []
    for (let y = Math.floor(y0 + bh * fy0); y < y0 + bh * fy1; y += 2)
      for (let x = Math.floor(x0 + bw * fx0); x < x0 + bw * fx1; x += 2) {
        const [r, g, b] = px(x, y)
        if (isBg(r, g, b)) continue
        if (r > 245 && g > 245 && b > 245) continue
        rs.push(r), gs.push(g), bs.push(b)
      }
    if (!rs.length) return null
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1]
    return [med(rs), med(gs), med(bs)]
  }
  const body = region(0.5, 0.85, 0.3, 0.7)
  const bodyTop = region(0.38, 0.5, 0.3, 0.7)
  const bodyBottom = region(0.85, 0.97, 0.3, 0.7)
  const cap = region(0.02, 0.16, 0.35, 0.65)
  return {
    aspect: +(bw / bh).toFixed(3),
    body: body && hex(body),
    bodyTop: bodyTop && hex(bodyTop),
    bodyBottom: bodyBottom && hex(bodyBottom),
    cap: cap && hex(cap),
  }
}

const out = {}
for (const f of fs.readdirSync(imgDir)) {
  if (!f.endsWith('.jpg')) continue
  try {
    out[f.replace(/\.jpg$/, '')] = analyze(path.join(imgDir, f))
  } catch (e) {
    out[f.replace(/\.jpg$/, '')] = { error: String(e.message) }
  }
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1))
console.log(Object.keys(out).length, 'images')
