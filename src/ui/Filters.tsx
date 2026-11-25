import { familyTags, type FamilyTag } from '../data'

type Props = {
  /** Line chips; omit to show only families. */
  lines?: string[]
  activeLines?: Set<string>
  activeFamilies: Set<FamilyTag>
  onToggleLine?: (line: string) => void
  onToggleFamily: (tag: FamilyTag) => void
  onClear: () => void
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 font-mono text-xs transition ${
        active ? 'border-amber-200 bg-amber-200 text-black' : 'border-white/20 text-white/70 hover:border-white/50'
      }`}
    >
      {children}
    </button>
  )
}

export function Filters({ lines, activeLines, activeFamilies, onToggleLine, onToggleFamily, onClear }: Props) {
  const any = (activeLines?.size ?? 0) > 0 || activeFamilies.size > 0
  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      {lines && onToggleLine && activeLines && (
        <div className="flex flex-wrap gap-1.5">
          {lines.map((l) => (
            <Chip key={l} active={activeLines.has(l)} onClick={() => onToggleLine(l)}>
              {l}
            </Chip>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {familyTags.map((f) => (
          <Chip key={f} active={activeFamilies.has(f)} onClick={() => onToggleFamily(f)}>
            {f}
          </Chip>
        ))}
        {any && (
          <button onClick={onClear} className="px-2 font-mono text-xs text-white/50 underline hover:text-white">
            limpiar
          </button>
        )}
      </div>
    </div>
  )
}
