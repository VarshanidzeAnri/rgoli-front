import { type ComponentProps } from 'react'

import { useFieldControl } from '@/components/kit/fieldContext'
import { cn } from '@/lib/cn'

export const inputClass =
  'flex h-10 w-full min-w-0 rounded-xl border border-input bg-secondary/40 px-3 text-[13px] text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 file:border-0 file:bg-transparent file:text-sm'

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" type={type} className={cn(inputClass, className)} {...useFieldControl(props)} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea data-slot="textarea" className={cn(inputClass, 'h-auto min-h-24 py-2.5', className)} {...useFieldControl(props)} />
}

