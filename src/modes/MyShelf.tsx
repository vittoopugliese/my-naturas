import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { lines, matcher, perfumes, type FamilyTag } from '../data'
import { CameraRig, FOV, type Focus } from '../three/CameraRig'
import { packShelf } from '../three/layout'
import { sizeOf } from '../three/shapes'
import { SHELF_MARGIN, ShelfRow } from '../three/ShelfRow'
import { Stage } from '../three/Stage'
import { DetailPanel } from '../ui/DetailPanel'
import { Filters } from '../ui/Filters'
import { LineBar, type LineSpan } from '../ui/LineBar'
import { useCompact, useSwipe } from '../useMobile'
import { toggle, useSelection } from '../useSelection'

/** My real shelf, grouped by line. */
export default function MyShelf() {
  const compact = useCompact()
  const { selectedId, setSelectedId, hoveredId, setHoveredId, step } = useSelection(perfumes)
  const [activeLines, setActiveLines] = useState<Set<string>>(new Set())
  const [activeFamilies, setActiveFamilies] = useState<Set<FamilyTag>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [moved, setMoved] = useState(false)
  const matches = useMemo(() => matcher(activeLines, activeFamilies), [activeLines, activeFamilies])
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
  const visible = perfumes.filter(matches).length
  const filterCount = activeLines.size + activeFamilies.size
  const swipe = useSwipe(step, compact && selected !== null)
  const index = selected ? perfumes.indexOf(selected) : -1

  const filters = (
    <Filters
      lines={lines}
      activeLines={activeLines}
      activeFamilies={activeFamilies}
      onToggleLine={(l) => setActiveLines((s) => toggle(s, l))}
      onToggleFamily={(f) => setActiveFamilies((s) => toggle(s, f))}
      onClear={() => {
        setActiveLines(new Set())
        setActiveFamilies(new Set())
      }}
    />
  )

  return (
    <>
      <div className="absolute inset-0 touch-none" {...swipe}>
        <Canvas
          dpr={[1, 2]}
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
              {!moved && (
                <p className="self-center rounded-full bg-black/50 px-3 py-1 font-mono text-[11px] text-white/60 backdrop-blur">
                  Deslizá para recorrer · tocá un frasco
                </p>
              )}
              {showFilters && <div className="rounded-2xl border border-white/10 bg-[#17110d]/90 p-3 backdrop-blur-md">{filters}</div>}
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <LineBar
                    spans={spans}
                    active={activeLine}
                    onPick={(s) => setPan((p) => ({ x: s.x, nonce: p.nonce + 1 }))}
                  />
                </div>
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  aria-pressed={showFilters}
                  className={`pointer-events-auto mb-1 shrink-0 rounded-full border px-3 py-2 font-mono text-xs ${
                    showFilters || filterCount ? 'border-amber-200 text-amber-200' : 'border-white/15 bg-black/40 text-white/70'
                  }`}
                >
                  Filtros{filterCount ? ` · ${filterCount}` : ''}
                </button>
              </div>
            </div>
          ) : (
            filters
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
