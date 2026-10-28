import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { type ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-primary to-info text-primary-foreground shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.7)] hover:brightness-110',
        outline:
          'border border-border bg-secondary/35 text-foreground hover:border-primary/60 hover:text-primary',
        ghost: 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        destructive: 'border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-[13px]',
        lg: 'h-11 px-6 text-sm',
        icon: 'size-9',
        'icon-sm': 'size-7 [&_svg:not([class*=size-])]:size-3.5',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
)

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
