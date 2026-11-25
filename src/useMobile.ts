import { useEffect, useRef, useState } from 'react'

const QUERY = '(max-width: 767px)'

/** True on phone-sized screens (below Tailwind's `md`). */
export function useCompact() {
  const [compact, setCompact] = useState(() => window.matchMedia(QUERY).matches)
  useEffect(() => {
    const m = window.matchMedia(QUERY)
    const on = () => setCompact(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return compact
}

/**
 * Pointer handlers that call `onSwipe(1)` for a swipe to the left (next) and `onSwipe(-1)` for a swipe
 * to the right (previous). Short or mostly vertical drags are ignored, so taps and scrolls still work.
 */
export function useSwipe(onSwipe: (dir: 1 | -1) => void, enabled = true) {
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = enabled ? { x: e.clientX, y: e.clientY } : null
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current
      start.current = null
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1)
    },
  }
}
