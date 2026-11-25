import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { lines, matcher, perfumes, type FamilyTag } from '../data'
import { CameraRig, FOV, type Focus } from '../three/CameraRig'
import { packShelf } from '../three/layout'
import { sizeOf } from '../three/shapes'
import { SHELF_MARGIN, ShelfRow } from '../three/ShelfRow'
import { Stage } from '../three/Stage'
import { DetailPanel } from '../ui/DetailPanel'
import { Filters } from '../ui/Filters'
import { toggle, useSelection } from '../useSelection'

/** My real shelf: the 12 bottles in the order of the photo. */
export default function MyShelf() {
  const { selectedId, setSelectedId, hoveredId, setHoveredId, step } = useSelection(perfumes)
  const [activeLines, setActiveLines] = useState<Set<string>>(new Set())
  const [activeFamilies, setActiveFamilies] = useState<Set<FamilyTag>>(new Set())
  const matches = useMemo(() => matcher(activeLines, activeFamilies), [activeLines, activeFamilies])
  const layout = useMemo(() => packShelf(perfumes), [])

  const selected = perfumes.find((p) => p.id === selectedId) ?? null
  const focus: Focus = selected
    ? { kind: 'bottle', x: layout.byId[selected.id].x, y: 0, h: sizeOf(selected).h }
    : { kind: 'shelf', y: 0, width: layout.total + SHELF_MARGIN }
  const visible = perfumes.filter(matches).length

  return (
    <>
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
            hoveredId={hoveredId}
            matches={matches}
            onHover={setHoveredId}
            onSelect={setSelectedId}
          />
          <CameraRig focus={focus} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 pt-28 md:p-8 md:pt-32">
        <p className="font-mono text-xs text-white/50">
          {visible === perfumes.length ? `${perfumes.length} perfumes` : `${visible} de ${perfumes.length}`}
        </p>
        {!selected && (
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
        )}
      </div>

      {selected && (
        <DetailPanel perfume={selected} onClose={() => setSelectedId(null)} onPrev={() => step(-1)} onNext={() => step(1)} />
      )}
    </>
  )
}
