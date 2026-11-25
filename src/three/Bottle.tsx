import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { easing } from 'maath'
import type { Group, Material, Mesh } from 'three'
import type { Perfume } from '../types'
import type { Placement } from './layout'
import { BottleShapeView, sizeOf } from './shapes'

type Props = {
  perfume: Perfume
  placement: Placement
  selected: boolean
  anySelected: boolean
  dimmed: boolean
  hovered: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

/** Where a selected bottle goes: forward to the shelf's front edge, slightly lifted. */
export const SELECTED_Z = 0.55
export const SELECTED_LIFT = 0.1

export function Bottle({ perfume, placement, selected, anySelected, dimmed, hovered, onHover, onSelect }: Props) {
  const group = useRef<Group>(null)
  const turn = useRef<Group>(null)
  const alpha = useRef({ value: 1 })
  const { h } = sizeOf(perfume)

  // The canvas renders on demand: while anything here still moves, ask for the next frame.
  useFrame((state, dt) => {
    const g = group.current
    const t = turn.current
    if (!g || !t) return
    const lift = selected ? SELECTED_LIFT : hovered && !anySelected ? 0.07 : 0
    let moving = easing.damp(g.position, 'y', lift, 0.18, dt)
    moving = easing.damp(g.position, 'z', selected ? SELECTED_Z - placement.z : 0, 0.3, dt) || moving
    // Selected: face the camera, then spin slowly. Otherwise go back to the shelf angle.
    if (selected) {
      t.rotation.y += dt * 0.35
      moving = true
    } else moving = easing.dampAngle(t.rotation, 'y', placement.angle, 0.35, dt) || moving

    // Fade: touch the materials only while the opacity changes, not on every frame.
    const target = dimmed ? 0.15 : anySelected && !selected ? 0.3 : 1
    if (easing.damp(alpha.current, 'value', target, 0.2, dt)) {
      const a = alpha.current.value
      g.traverse((o) => {
        const m = (o as Mesh).material as Material | undefined
        if (m && !Array.isArray(m)) m.opacity = a
      })
      moving = true
    }
    if (moving) state.invalidate()
  })

  return (
    <group position={[placement.x, 0, placement.z]}>
      <group
        ref={group}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(perfume.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(perfume.id)
        }}
      >
        <group ref={turn} rotation-y={placement.angle}>
          <BottleShapeView perfume={perfume} />
        </group>
        {hovered && !anySelected && (
          <Html center position={[0, h + 0.25, 0]} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap rounded-full bg-black/70 px-3 py-1 font-serif text-lg text-amber-50 backdrop-blur">
              {perfume.name}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
