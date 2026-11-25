import { ContactShadows, RoundedBox, Text } from '@react-three/drei'
import type { Perfume } from '../types'
import { Bottle } from './Bottle'
import type { ShelfLayout } from './layout'

export const SHELF_MARGIN = 0.6

type Props = {
  perfumes: Perfume[]
  layout: ShelfLayout
  /** Height of the board's top surface. */
  y?: number
  /** Engraved on the front edge of the board. */
  label?: string
  /** Bottles that get a small brass star on the board edge (mine, in the catalog). */
  marked?: Set<string>
  selectedId: string | null
  hoveredId: string | null
  matches: (p: Perfume) => boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

/** One wooden board with its bottles, packed and turned as in `layout`. */
export function ShelfRow({ perfumes, layout, y = 0, label, marked, selectedId, hoveredId, matches, onHover, onSelect }: Props) {
  const width = layout.total + SHELF_MARGIN * 2
  return (
    <group position={[0, y, 0]}>
      <RoundedBox args={[width, 0.14, 1.8]} radius={0.02} position={[0, -0.07, 0]}>
        <meshStandardMaterial color="#6b4428" roughness={0.55} />
      </RoundedBox>
      {label && (
        <Text
          position={[-width / 2 + 0.25, -0.07, 0.905]}
          fontSize={0.075}
          letterSpacing={0.18}
          anchorX="left"
          anchorY="middle"
          color="#e9d3b4"
        >
          {label.toUpperCase()}
        </Text>
      )}
      {marked &&
        perfumes
          .filter((p) => marked.has(p.id))
          .map((p) => (
            <Text key={p.id} position={[layout.byId[p.id].x, -0.07, 0.905]} fontSize={0.1} anchorX="center" anchorY="middle" color="#e2b45a">
              ★
            </Text>
          ))}
      {perfumes.map((p) => (
        <Bottle
          key={p.id}
          perfume={p}
          placement={layout.byId[p.id]}
          selected={p.id === selectedId}
          anySelected={selectedId !== null}
          dimmed={!matches(p)}
          hovered={p.id === hoveredId}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      <ContactShadows position={[0, 0.001, 0]} scale={[width, 1.8]} resolution={1024} opacity={0.75} blur={2.2} far={1.6} />
    </group>
  )
}
