import type { ReactNode } from 'react'
import { emptyFilters, familyTags, filterCount, occasions, seasons, type FilterState } from '../data'
import type { Perfume } from '../types'
import { toggle } from '../useSelection'

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 font-mono text-xs transition md:py-1 ${
        active ? 'border-amber-200 bg-amber-200 text-black' : 'border-white/20 text-white/70 hover:border-white/50'
      }`}
    >
      {children}
    </button>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 font-mono text-[10px] tracking-widest text-white/40 uppercase">{title}</h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  )
}

type Props = {
  value: FilterState
  onChange: (f: FilterState) => void
  /** Line chips; omit to hide them. */
  lines?: string[]
  /** Perfumes that pass the filters, listed under them while any filter is on. */
  results: Perfume[]
  /** Marked with ★ in the results (mine, in the catalog). */
  owned?: Set<string>
  onPick: (p: Perfume) => void
}

/** Every filter group, stacked: a perfume must match each active group. */
export function Filters({ value, onChange, lines, results, owned, onPick }: Props) {
  const n = filterCount(value)
  const flip = <K extends keyof FilterState>(key: K, v: FilterState[K] extends Set<infer T> ? T : never) =>
    onChange({ ...value, [key]: toggle(value[key] as Set<typeof v>, v) })

  return (
    <div className="flex flex-col gap-3">
      {n > 0 && (
        <section className="border-b border-white/10 pb-3">
          <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-white/40 uppercase">
            <span>
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
            </span>
            <button onClick={() => onChange(emptyFilters())} className="tracking-normal normal-case underline hover:text-white">
              limpiar
            </button>
          </div>
          <ul className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onPick(p)}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-left text-sm text-amber-50 hover:bg-white/20 active:bg-white/25"
                >
                  {owned?.has(p.id) && <span className="mr-1 text-amber-300">★</span>}
                  {p.name}
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="font-mono text-xs text-white/50">Ningún perfume cumple todos los filtros.</li>}
          </ul>
        </section>
      )}
      <Group title="Estación">
        {seasons.map((s) => (
          <Chip key={s.id} active={value.seasons.has(s.id)} onClick={() => flip('seasons', s.id)}>
            {s.label}
          </Chip>
        ))}
      </Group>
      <Group title="Ocasión">
        {occasions.map((o) => (
          <Chip key={o.id} active={value.occasions.has(o.id)} onClick={() => flip('occasions', o.id)}>
            {o.label}
          </Chip>
        ))}
      </Group>
      <Group title="Familia">
        {familyTags.map((f) => (
          <Chip key={f} active={value.families.has(f)} onClick={() => flip('families', f)}>
            {f}
          </Chip>
        ))}
      </Group>
      {lines && (
        <Group title="Línea">
          {lines.map((l) => (
            <Chip key={l} active={value.lines.has(l)} onClick={() => flip('lines', l)}>
              {l}
            </Chip>
          ))}
        </Group>
      )}

    </div>
  )
}

/** The button that shows or hides the filters, with the count of active ones. */
export function FilterToggle({ open, count, onClick }: { open: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? 'Ocultar filtros' : 'Mostrar filtros'}
      className={`pointer-events-auto shrink-0 rounded-full border px-3 py-2 font-mono text-xs backdrop-blur transition md:py-1.5 ${
        open || count ? 'border-amber-200 text-amber-200' : 'border-white/15 bg-black/40 text-white/70 hover:text-white'
      }`}
    >
      Filtros{count > 0 && ` · ${count}`}
      <span aria-hidden className="ml-1.5 inline-block transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
        ▴
      </span>
    </button>
  )
}

/** Panel around the filters: a card that scrolls when the screen is short. */
export function FilterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-auto max-h-[50dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#17110d]/90 p-4 backdrop-blur-md md:max-h-[60vh] md:w-[440px]">
      {children}
    </div>
  )
}
