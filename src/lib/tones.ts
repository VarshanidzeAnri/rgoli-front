import type { Tone } from './enums'

/** border-{c}/30 bg-{c}/10 text-{c} — spelled out so Tailwind can see every class. */
export const TONE_CLASS: Record<Tone, string> = {
  primary: 'border-primary/30 bg-primary/10 text-primary',
  info: 'border-info/30 bg-info/10 text-info',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  success: 'border-success/30 bg-success/10 text-success',
  violet: 'border-violet/30 bg-violet/10 text-violet',
  muted: 'border-border bg-secondary/50 text-muted-foreground',
}

export const TONE_DOT: Record<Tone, string> = {
  primary: 'bg-primary',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  success: 'bg-success',
  violet: 'bg-violet',
  muted: 'bg-muted-foreground',
}

export const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-primary',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
  violet: 'text-violet',
  muted: 'text-muted-foreground',
}

const AVATAR_GRADIENTS = [
  'from-primary to-info',
  'from-violet to-info',
  'from-warning to-success',
  'from-info to-violet',
  'from-success to-primary',
] as const

/** Deterministic avatar gradient picked from a name. */
export function gradientFor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length] ?? AVATAR_GRADIENTS[0]
}
