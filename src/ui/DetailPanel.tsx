import type { Perfume } from '../types'

const TIERS = [
  { key: 'top', label: 'Salida' },
  { key: 'heart', label: 'Corazón' },
  { key: 'base', label: 'Fondo' },
] as const

type Props = {
  perfume: Perfume
  /** Shown in the catalog, where most bottles are not mine. */
  owned?: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

/** Panel accent: the bottle color, or for near-black bottles their label or cap accent. */
function accentOf(p: Perfume) {
  const { glass, label, capAccent } = p.bottle
  const n = parseInt(glass.slice(1), 16)
  const brightness = ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)
  if (brightness > 120) return glass
  if (label === 'iridescent') return '#7fd6c8'
  return capAccent ?? '#c9a77a'
}

export function DetailPanel({ perfume: p, owned, onClose, onPrev, onNext }: Props) {
  const tint = accentOf(p)
  return (
    <aside
      className="pointer-events-auto absolute inset-x-0 bottom-0 max-h-[55vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#17110d]/90 p-6 backdrop-blur-md md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[420px] md:rounded-none md:border-t-0 md:border-l"
      style={{ backgroundImage: `linear-gradient(160deg, ${tint}55, transparent 45%)` }}
    >
      <div className="flex items-center justify-between font-mono text-xs text-white/50">
        <span>
          {p.brand} · {p.line}
        </span>
        <div className="flex gap-1">
          <button onClick={onPrev} className="rounded px-2 py-1 hover:bg-white/10" aria-label="Anterior">
            ←
          </button>
          <button onClick={onNext} className="rounded px-2 py-1 hover:bg-white/10" aria-label="Siguiente">
            →
          </button>
          <button onClick={onClose} className="rounded px-2 py-1 hover:bg-white/10" aria-label="Cerrar">
            ✕
          </button>
        </div>
      </div>

      <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold text-amber-50">{p.name}</h2>
      <p className="mt-1 font-serif text-lg text-white/70 italic">{p.family}</p>
      {owned && (
        <p className="mt-3 inline-block rounded-full bg-amber-200 px-3 py-0.5 font-mono text-[11px] text-black">En mi estante</p>
      )}

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
        <dt className="text-white/40">Concentración</dt>
        <dd>{p.concentration || '—'}</dd>
        <dt className="text-white/40">Año</dt>
        <dd>{p.year ?? '—'}</dd>
        {p.perfumers.length > 0 && (
          <>
            <dt className="text-white/40">Perfumista</dt>
            <dd>{p.perfumers.join(', ')}</dd>
          </>
        )}
      </dl>

      <div className="mt-6 space-y-4">
        {TIERS.map(({ key, label }, i) => (
          <section key={key}>
            <h3 className="mb-2 font-mono text-[11px] tracking-widest text-white/40 uppercase">{label}</h3>
            <ul className="flex flex-wrap gap-1.5" style={{ paddingLeft: `${i * 12}px` }}>
              {p.notes[key].map((n) => (
                <li
                  key={n}
                  className="rounded-full border px-2.5 py-0.5 text-sm"
                  style={{ borderColor: `${tint}aa`, background: `${tint}22` }}
                >
                  {n}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-6 font-mono text-[11px] text-white/40">
        {!p.verified && !p.bottle.estimated && <p className="mb-1 text-amber-200/70">Las notas varían entre fuentes.</p>}
        {p.bottle.estimated && <p className="mb-1 text-white/50">Frasco aproximado: forma por línea y color tomado de la foto del producto.</p>}
        <a href={p.source} target="_blank" rel="noreferrer" className="underline hover:text-white/70">
          Fuente
        </a>
      </footer>
    </aside>
  )
}
