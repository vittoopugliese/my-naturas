import { useCallback, useEffect, useState } from 'react'
import type { Perfume } from './types'

export function toggle<T>(set: Set<T>, value: T) {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

/**
 * Selected and hovered bottle, with keyboard: Esc closes, ← → walk through `order`
 * (the bottles of the shelf in focus).
 */
export function useSelection(order: Perfume[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const step = useCallback(
    (dir: 1 | -1) => {
      const i = order.findIndex((p) => p.id === selectedId)
      if (i < 0) return
      setSelectedId(order[(i + dir + order.length) % order.length].id)
    },
    [order, selectedId],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  return { selectedId, setSelectedId, hoveredId, setHoveredId, step }
}
