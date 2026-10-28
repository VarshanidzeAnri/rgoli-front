import { useMemo } from 'react'

import type { Tone } from '@/lib/enums'
import { useAppSelector } from '@/store'
import { selectTheme } from '@/store/uiSlice'

const TONE_VAR: Record<Tone, string> = {
  primary: '--primary',
  info: '--info',
  warning: '--warning',
  danger: '--destructive',
  success: '--success',
  violet: '--violet',
  muted: '--muted-foreground',
}

const CHROME = { grid: '--border', axis: '--muted-foreground', surface: '--card', text: '--foreground' } as const

function read(name: string): string {
  if (typeof document === 'undefined') return 'currentColor'
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value ? `hsl(${value})` : 'currentColor'
}

/**
 * SVG chart marks can't use var() in attributes reliably, so tone tokens are resolved to
 * concrete colors and recomputed whenever the theme changes.
 */
export function useChartColors() {
  const theme = useAppSelector(selectTheme)
  return useMemo(() => {
    const tone = Object.fromEntries(Object.entries(TONE_VAR).map(([k, v]) => [k, read(v)])) as Record<Tone, string>
    const chrome = Object.fromEntries(Object.entries(CHROME).map(([k, v]) => [k, read(v)])) as Record<keyof typeof CHROME, string>
    return { tone, ...chrome, theme }
  }, [theme])
}
