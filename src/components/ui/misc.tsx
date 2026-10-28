import { CheckIcon } from 'lucide-react'
import {
  Checkbox as CheckboxPrimitive,
  Label as LabelPrimitive,
  Popover as PopoverPrimitive,
  Switch as SwitchPrimitive,
  Tabs as TabsPrimitive,
  Tooltip as TooltipPrimitive,
} from 'radix-ui'
import { type ComponentProps } from 'react'

import { cn } from '@/lib/cn'

// ── Label ──────────────────────────────────────────────────────────────
export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('micro-label block', className)} {...props} />
}

// ── Checkbox ───────────────────────────────────────────────────────────
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer flex size-4.5 shrink-0 items-center justify-center rounded-md border border-input bg-secondary/40 transition outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary/40',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

// ── Switch ─────────────────────────────────────────────────────────────
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'inline-flex h-5.5 w-10 shrink-0 cursor-pointer items-center rounded-full border border-border bg-secondary transition outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 data-[state=checked]:border-primary/60 data-[state=checked]:bg-primary/30',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-muted-foreground shadow transition data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-primary" />
    </SwitchPrimitive.Root>
  )
}

// ── Tabs ───────────────────────────────────────────────────────────────
export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-secondary/30 p-1', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-muted-foreground transition outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-primary/15 data-[state=active]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-5 outline-none data-[state=active]:animate-fade-up', className)} {...props} />
}

// ── Tooltip ────────────────────────────────────────────────────────────
export const TooltipProvider = TooltipPrimitive.Provider

export function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Root delayDuration={250}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-50 rounded-lg border border-border/70 bg-popover px-2.5 py-1.5 text-[11px] text-foreground shadow-lg"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

// ── Popover ────────────────────────────────────────────────────────────
export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

export function PopoverContent({ className, sideOffset = 8, align = 'end', ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 w-80 rounded-2xl border border-border/70 bg-popover/95 p-3 shadow-xl backdrop-blur-2xl outline-none data-[state=open]:animate-fade-up',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-secondary/60', className)} {...props} />
}
