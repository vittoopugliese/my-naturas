import { occasions, occasionsOf, seasons, seasonsOf } from '../data'
import type { Perfume } from '../types'
import type { useSwipe } from '../useMobile'

const TIERS = [
  { key: 'top', label: 'Salida' },
  { key: 'heart', label: 'Corazón' },
  { key: 'base', label: 'Fondo' },
] as const

type Props = {
  perfume: Perfume
  /** Shown in the catalog, where most bottles are not mine. */
  owned?: boolean
  /** Place in the list, such as "3 / 25". */
  position?: string
  /** Phone only: swipe the sheet left / right to go to the next / previous bottle. */
  swipe?: ReturnType<typeof useSwipe>
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

export function DetailPanel({ perfume: p, owned, position, swipe, onClose, onPrev, onNext }: Props) {
  const tint = accentOf(p)
  return (
    <aside
      {...swipe}
      className="pointer-events-auto absolute inset-x-0 bottom-0 max-h-[52dvh] overflow-y-auto overscroll-contain rounded-t-3xl select-none md:select-text border-t border-white/10 bg-[#17110d]/90 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:inset-y-0 md:p-6 md:right-0 md:left-auto md:max-h-none md:w-[420px] md:rounded-none md:border-t-0 md:border-l"
      style={{ backgroundImage: `linear-gradient(160deg, ${tint}55, transparent 45%)` }}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25 md:hidden" />
      <div className="flex items-center justify-between font-mono text-xs text-white/50">
        <span>
          {p.brand} · {p.line}
          {position && <span className="ml-2 text-white/30">{position}</span>}
        </span>
        <div className="flex gap-1">
          <button onClick={onPrev} className="grid size-10 place-items-center rounded-full text-base hover:bg-white/10 active:bg-white/20 md:size-8 md:text-xs" aria-label="Anterior">
            ←
          </button>
          <button onClick={onNext} className="grid size-10 place-items-center rounded-full text-base hover:bg-white/10 active:bg-white/20 md:size-8 md:text-xs" aria-label="Siguiente">
            →
          </button>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full text-base hover:bg-white/10 active:bg-white/20 md:size-8 md:text-xs" aria-label="Cerrar">
            ✕
          </button>
        </div>
      </div>

      <h2 className="mt-2 font-serif text-3xl md:mt-3 md:text-4xl leading-tight font-semibold text-amber-50">{p.name}</h2>
      <p className="mt-1 font-serif text-lg text-white/70 italic">{p.family}</p>
      {owned && (
        <p className="mt-3 inline-block rounded-full bg-amber-200 px-3 py-0.5 font-mono text-[11px] text-black">En mi estante</p>
      )}

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
        <dt className="text-white/40">Concentración</dt>
        <dd>{p.concentration || '—'}</dd>
        <dt className="text-white/40">Año</dt>
        <dd>{p.year ?? '—'}</dd>
        <dt className="text-white/40">Estación</dt>
        <dd>{seasons.filter((s) => seasonsOf(p).has(s.id)).map((s) => s.label).join(', ')}</dd>
        <dt className="text-white/40">Ocasión</dt>
        <dd>{occasions.filter((o) => occasionsOf(p).has(o.id)).map((o) => o.label).join(', ')}</dd>
        {p.perfumers.length > 0 && (
          <>
            <dt className="text-white/40">Perfumista</dt>
            <dd>{p.perfumers.join(', ')}</dd>
          </>
        )}
      </dl>

      <div className="mt-5 space-y-4 md:mt-6">
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
