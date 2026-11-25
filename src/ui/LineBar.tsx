import { useEffect, useRef } from 'react'

export type LineSpan = { line: string; count: number; x: number }

type Props = {
  spans: LineSpan[]
  active: string | null
  onPick: (span: LineSpan) => void
}

/** Phone tab bar: one tab per line. The tab of the line in view is lit; a tap slides the shelf to that line. */
export function LineBar({ spans, active, onPick }: Props) {
  const refs = useRef(new Map<string, HTMLButtonElement>())
  useEffect(() => {
    if (active) refs.current.get(active)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])
  return (
    <nav className="pointer-events-auto -ml-5 flex snap-x gap-1.5 overflow-x-auto pr-2 pl-5 pb-1 [scrollbar-width:none]">
      {spans.map((s) => (
        <button
          key={s.line}
          ref={(el) => {
            if (el) refs.current.set(s.line, el)
          }}
          onClick={() => onPick(s)}
          aria-pressed={s.line === active}
          className={`flex shrink-0 snap-center items-baseline gap-1.5 rounded-full border px-4 py-2 font-mono text-xs transition ${
            s.line === active ? 'border-amber-200 bg-amber-200 text-black' : 'border-white/15 bg-black/40 text-white/70 backdrop-blur'
          }`}
        >
          {s.line}
          <span className="opacity-50">{s.count}</span>
        </button>
      ))}
    </nav>
  )
}
