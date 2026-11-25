import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { FilterProps } from '../App'
import { filterCount, lines, matcher, perfumes } from '../data'
import { CameraRig, FOV, type Focus } from '../three/CameraRig'
import { packShelf } from '../three/layout'
import { sizeOf } from '../three/shapes'
import { SHELF_MARGIN, ShelfRow } from '../three/ShelfRow'
import { Stage } from '../three/Stage'
import { DetailPanel } from '../ui/DetailPanel'
import { FilterPanel, Filters, FilterToggle } from '../ui/Filters'
import { LineBar, type LineSpan } from '../ui/LineBar'
import { useCompact, useSwipe } from '../useMobile'
import { useSelection } from '../useSelection'

/** My real shelf, grouped by line. */
export default function MyShelf({ filters, setFilters, filtersOpen, setFiltersOpen }: FilterProps) {
  const compact = useCompact()
  const { selectedId, setSelectedId, hoveredId, setHoveredId, step } = useSelection(perfumes)
  const [moved, setMoved] = useState(false)
  const matches = useMemo(() => matcher(filters), [filters])
  const layout = useMemo(() => packShelf(perfumes), [])

  // Center of each line on the shelf, for the phone tab bar.
  const spans = useMemo<LineSpan[]>(
    () =>
      lines.map((line) => {
        const xs = perfumes.filter((p) => p.line === line).map((p) => layout.byId[p.id].x)
        return { line, count: xs.length, x: (Math.min(...xs) + Math.max(...xs)) / 2 }
      }),
    [layout],
  )
  // Where the shelf camera looks. Phones start at the left end, with the first line.
  const [pan, setPan] = useState({ x: compact ? -Infinity : 0, nonce: 0 })
  const [lookX, setLookX] = useState(pan.x)
  const activeLine = useMemo(() => {
    if (!compact) return null
    const near = perfumes.reduce((a, b) => (Math.abs(layout.byId[b.id].x - lookX) < Math.abs(layout.byId[a.id].x - lookX) ? b : a))
    return near.line
  }, [compact, lookX, layout])

  const selected = perfumes.find((p) => p.id === selectedId) ?? null
  // After a bottle closes, the shelf stays where that bottle is.
  useEffect(() => {
    if (selected) setPan((s) => ({ x: layout.byId[selected.id].x, nonce: s.nonce + 1 }))
  }, [selected, layout])

  const focus: Focus = selected
    ? { kind: 'bottle', x: layout.byId[selected.id].x, y: 0, h: sizeOf(selected).h }
    : { kind: 'shelf', y: 0, width: layout.total + SHELF_MARGIN, ...pan }
  const results = useMemo(() => perfumes.filter(matches), [matches])
  const visible = results.length
  const nFilters = filterCount(filters)
  const swipe = useSwipe(step, compact && selected !== null)
  const index = selected ? perfumes.indexOf(selected) : -1

  const panel = filtersOpen && (
    <FilterPanel>
      <Filters
        value={filters}
        onChange={setFilters}
        lines={lines}
        results={results}
        onPick={(p) => {
          if (compact) setFiltersOpen(false)
          setSelectedId(p.id)
        }}
      />
    </FilterPanel>
  )
  const toggleButton = <FilterToggle open={filtersOpen} count={nFilters} onClick={() => setFiltersOpen(!filtersOpen)} />

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
            <Stage />
            <ShelfRow
              perfumes={perfumes}
              layout={layout}
              selectedId={selectedId}
              hoveredId={compact ? null : hoveredId}
              matches={matches}
              onHover={setHoveredId}
              onSelect={setSelectedId}
            />
            <CameraRig focus={focus} compact={compact} onLook={compact ? setLookX : undefined} onUserMove={() => setMoved(true)} />
          </Suspense>
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 pt-28 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8 md:pt-32">
        <p className="font-mono text-xs text-white/50">
          {visible === perfumes.length ? `${perfumes.length} perfumes` : `${visible} de ${perfumes.length}`}
        </p>
        {!selected &&
          (compact ? (
            <div className="flex flex-col gap-3">
              {!moved && !filtersOpen && (
                <p className="self-center rounded-full bg-black/50 px-3 py-1 font-mono text-[11px] text-white/60 backdrop-blur">
                  Deslizá para recorrer · tocá un frasco
                </p>
              )}
              {panel}
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <LineBar
                    spans={spans}
                    active={activeLine}
                    onPick={(s) => setPan((p) => ({ x: s.x, nonce: p.nonce + 1 }))}
                  />
                </div>
                <div className="mb-1">{toggleButton}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              {panel}
              {toggleButton}
            </div>
          ))}
      </div>

      {selected && (
        <DetailPanel
          perfume={selected}
          position={`${index + 1} / ${perfumes.length}`}
          swipe={compact ? swipe : undefined}
          onClose={() => setSelectedId(null)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </>
  )
}
