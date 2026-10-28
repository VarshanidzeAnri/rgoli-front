import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'

import { toRadarPins, type LocatedProject } from '../projection'

/** "Offline radar": dark grid, concentric rings and numbered glowing pins (no network needed). */
export function RadarMap({
  items,
  selectedId,
  onSelect,
}: {
  items: LocatedProject[]
  selectedId: number | null
  onSelect: (projectId: number) => void
}) {
  const { t } = useTranslation('map')
  const pins = toRadarPins(items)

  return (
    <div
      role="group"
      aria-label={t('radar.label')}
      className="relative aspect-square w-full overflow-hidden rounded-[20px] border border-primary/20 bg-[#03090c]"
    >
      {/* grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(hsl(172 90% 62% / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(172 90% 62% / 0.08) 1px, transparent 1px)',
          backgroundSize: '10% 10%',
        }}
      />
      {/* rings + crosshair */}
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 size-full">
        {[12, 24, 36, 48].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="hsl(172 90% 62% / 0.18)" strokeWidth="0.3" />
        ))}
        <line x1="50" y1="0" x2="50" y2="100" stroke="hsl(172 90% 62% / 0.12)" strokeWidth="0.3" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(172 90% 62% / 0.12)" strokeWidth="0.3" />
        <defs>
          <radialGradient id="radar-glow">
            <stop offset="0" stopColor="hsl(172 90% 62% / 0.18)" />
            <stop offset="1" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#radar-glow)" />
      </svg>
      <span aria-hidden className="absolute top-2 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.3em] text-[#49f5db]/70 uppercase">
        {t('radar.north')}
      </span>

      {pins.map((pin) => {
        const active = pin.project.id === selectedId
        return (
          <button
            key={pin.project.id}
            type="button"
            onClick={() => onSelect(pin.project.id)}
            aria-pressed={active}
            aria-label={t('radar.pin', { number: pin.number, name: pin.project.name })}
            title={pin.project.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#49f5db]"
            style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
          >
            {active ? <span aria-hidden className="absolute inset-0 animate-ping-slow rounded-full bg-[#49f5db]/50" /> : null}
            <span
              className={cn(
                'relative flex size-7 items-center justify-center rounded-full border font-mono text-[11px] font-semibold transition',
                active
                  ? 'border-[#49f5db] bg-[#49f5db] text-[#00141a] shadow-[0_0_18px_#49f5db]'
                  : 'border-[#49f5db]/70 bg-[#06242a] text-[#49f5db] shadow-[0_0_12px_hsl(172_90%_62%/0.45)] hover:bg-[#0b3a40]',
              )}
            >
              {pin.number}
            </span>
          </button>
        )
      })}
    </div>
  )
}
