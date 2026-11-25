import { lazy, Suspense, useState } from 'react'
import { emptyFilters, type FilterState } from './data'
import MyShelf from './modes/MyShelf'

// The catalog (≈90 bottles plus its data) is a separate chunk, fetched only when opened.
const Catalog = lazy(() => import('./modes/Catalog'))

type Mode = 'mine' | 'catalog'

/** Filters live here, so they stay the same when switching between my shelf and the catalog. */
export type FilterProps = {
  filters: FilterState
  setFilters: (f: FilterState) => void
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'mine', label: 'Mi estante' },
  { id: 'catalog', label: 'Catálogo' },
]

export default function App() {
  const [mode, setMode] = useState<Mode>('mine')
  const [filters, setFilters] = useState(emptyFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterProps: FilterProps = { filters, setFilters, filtersOpen, setFiltersOpen }
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Only one mode is mounted at a time: switching drops the other canvas and its GPU memory. */}
      {mode === 'mine' ? (
        <MyShelf {...filterProps} />
      ) : (
        <Suspense fallback={<p className="absolute inset-0 grid place-items-center font-mono text-xs text-white/50">Cargando catálogo…</p>}>
          <Catalog {...filterProps} />
        </Suspense>
      )}

      <header className="pointer-events-none absolute top-0 left-0 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] md:p-8">
        <p className="font-mono text-xs tracking-[0.3em] text-amber-200/70">NATTORIO</p>
        <h1 className="font-serif text-2xl font-semibold text-amber-50 md:text-4xl">
          {mode === 'mine' ? 'Mi colección' : 'Natura para hombre'}
        </h1>
        <div className="pointer-events-auto mt-2 inline-flex rounded-full border border-white/15 bg-black/30 p-0.5 font-mono text-xs backdrop-blur">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`rounded-full px-3 py-1.5 transition md:py-1 ${mode === m.id ? 'bg-amber-200 text-black' : 'text-white/60 hover:text-white'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>
    </div>
  )
}
