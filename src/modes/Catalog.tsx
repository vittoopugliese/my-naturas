import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import catalogRaw from '../../data/catalogo.json'
import type { FilterProps } from '../App'
import { filterCount, matcher, ownedIds, perfumes as mine } from '../data'
import { CameraRig, FOV, type Focus } from '../three/CameraRig'
import { packShelf, type ShelfLayout } from '../three/layout'
import { sizeOf } from '../three/shapes'
import { SHELF_MARGIN, ShelfRow } from '../three/ShelfRow'
import { Stage } from '../three/Stage'
import type { Perfume } from '../types'
import { DetailPanel } from '../ui/DetailPanel'
import { FilterPanel, Filters, FilterToggle } from '../ui/Filters'
import { useCompact, useSwipe } from '../useMobile'
import { useSelection } from '../useSelection'

/** Men's lines, in the order the shelves are stacked (top to bottom). */
const LINE_ORDER = ['Homem', 'Essencial', 'Kaiak', 'Biografia', 'Sr. N', 'Humor', 'Ekos', 'Sintonia', 'Urbano', 'Horus', 'Hoje']
/** Vertical distance between boards. Tallest bottle is ~2 units. */
const SPACING = 2.7
/** Only the shelf in focus and its neighbors are mounted, so the GPU never holds every bottle. */
const MOUNT_RADIUS = 1

type Shelf = { line: string; perfumes: Perfume[]; layout: ShelfLayout; y: number }

function buildShelves(): Shelf[] {
  // My bottles join the catalog with their exact models.
  const all = [...(catalogRaw.perfumes as Perfume[]), ...mine]
  const byLine = new Map<string, Perfume[]>()
  for (const p of all) byLine.set(p.line, [...(byLine.get(p.line) ?? []), p])
  const order = [...LINE_ORDER, ...[...byLine.keys()].filter((l) => !LINE_ORDER.includes(l))]
  return order
    .filter((line) => byLine.has(line))
    .map((line, i) => {
      // Oldest first; unknown years go last.
      const perfumes = byLine.get(line)!.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.name.localeCompare(b.name))
      return { line, perfumes, layout: packShelf(perfumes), y: -i * SPACING }
    })
}

/** Every Natura men's line, one shelf per line, ordered by year. Loaded on demand. */
export default function Catalog({ filters, setFilters, filtersOpen, setFiltersOpen }: FilterProps) {
  const shelves = useMemo(buildShelves, [])
  const compact = useCompact()
  const [current, setCurrent] = useState(0)
  const shelf = shelves[current]
  const { selectedId, setSelectedId, hoveredId, setHoveredId, step } = useSelection(shelf.perfumes)
  const matches = useMemo(() => matcher(filters), [filters])
  const nFilters = filterCount(filters)
  const total = shelves.reduce((n, s) => n + s.perfumes.length, 0)
  // Matches across every shelf, so a filter also finds perfumes on shelves not in view.
  const results = useMemo(() => shelves.flatMap((s) => s.perfumes.filter(matches)), [shelves, matches])
  const lineNames = useMemo(() => shelves.map((s) => s.line), [shelves])

  const goTo = (i: number) => {
    setSelectedId(null)
    setCurrent(Math.max(0, Math.min(shelves.length - 1, i)))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedId) return
      if (e.key === 'ArrowDown') goTo(current + 1)
      if (e.key === 'ArrowUp') goTo(current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const select = (id: string) => {
    const i = shelves.findIndex((s) => s.perfumes.some((p) => p.id === id))
    if (i !== current) setCurrent(i)
    setSelectedId(id)
  }

  const selected = shelf.perfumes.find((p) => p.id === selectedId) ?? null
  const focus: Focus = selected
    ? { kind: 'bottle', x: shelf.layout.byId[selected.id].x, y: shelf.y, h: sizeOf(selected).h }
    : { kind: 'shelf', y: shelf.y, width: shelf.layout.total + SHELF_MARGIN }

  const swipe = useSwipe(step, compact && selected !== null)

  return (
    <>
      <div className="absolute inset-0 touch-none" {...swipe}>
      <Canvas
        dpr={[1, compact ? 1.5 : 2]}
        frameloop="demand"
        camera={{ position: [0, 1.6, 14], fov: FOV, near: 0.1, far: 100 }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <Suspense fallback={null}>
          <Stage y={shelf.y} wallTop={8} wallBottom={-shelves.length * SPACING - 4} />
          {shelves.map((s, i) =>
            Math.abs(i - current) <= MOUNT_RADIUS ? (
              <ShelfRow
                key={s.line}
                perfumes={s.perfumes}
                layout={s.layout}
                y={s.y}
                label={`${s.line} · ${s.perfumes.length}`}
                marked={ownedIds}
                selectedId={i === current ? selectedId : null}
                hoveredId={compact ? null : hoveredId}
                matches={matches}
                onHover={setHoveredId}
                onSelect={select}
              />
            ) : null,
          )}
          <CameraRig focus={focus} compact={compact} />
        </Suspense>
      </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 pt-28 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8 md:pt-32">
        <div>
          <p className="font-mono text-xs text-white/50">
            {total} perfumes · {shelves.length} líneas · ★ en mi estante
          </p>
          {!selected && (
            <nav className="pointer-events-auto -mx-5 mt-4 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:w-44 md:px-0 md:flex-col md:overflow-visible">
              {shelves.map((s, i) => {
                const mineHere = s.perfumes.filter((p) => ownedIds.has(p.id)).length
                const hits = nFilters ? s.perfumes.filter(matches).length : null
                return (
                  <button
                    key={s.line}
                    onClick={() => goTo(i)}
                    className={`flex shrink-0 items-baseline justify-between gap-3 rounded-full px-3 py-2 text-left font-mono md:rounded md:px-2 md:py-1 text-xs transition ${
                      i === current ? 'bg-amber-200 text-black' : 'text-white/60 hover:bg-white/10'
                    } ${hits === 0 && i !== current ? 'opacity-35' : ''}`}
                  >
                    <span>{s.line}</span>
                    <span className="opacity-60">
                      {hits !== null ? (
                        `${hits} de ${s.perfumes.length}`
                      ) : (
                        <>
                          {mineHere > 0 && `★${mineHere} `}
                          {s.perfumes.length}
                        </>
                      )}
                    </span>
                  </button>
                )
              })}
            </nav>
          )}
        </div>
        {!selected && (
          <div className="flex flex-col items-start gap-3">
            {filtersOpen ? (
              <FilterPanel>
                <Filters
                  value={filters}
                  onChange={setFilters}
                  lines={lineNames}
                  results={results}
                  owned={ownedIds}
                  onPick={(p) => {
                    if (compact) setFiltersOpen(false)
                    select(p.id)
                  }}
                />
              </FilterPanel>
            ) : (
              <>
                <p className="font-mono text-[11px] text-white/40 md:hidden">Deslizá para recorrer el estante · tocá un frasco</p>
                <p className="hidden font-mono text-[11px] text-white/40 md:block">
                  ↑ ↓ cambian de estante · click derecho y arrastrar recorre los estantes largos
                </p>
              </>
            )}
            <FilterToggle open={filtersOpen} count={nFilters} onClick={() => setFiltersOpen(!filtersOpen)} />
          </div>
        )}
      </div>

      {selected && (
        <DetailPanel
          perfume={selected}
          owned={ownedIds.has(selected.id)}
          position={`${shelf.perfumes.indexOf(selected) + 1} / ${shelf.perfumes.length}`}
          swipe={compact ? swipe : undefined}
          onClose={() => setSelectedId(null)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </>
  )
}
