import { XIcon } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'

export const Sheet = SheetPrimitive.Root
export const SheetTitle = SheetPrimitive.Title
export const SheetDescription = SheetPrimitive.Description

/** Side panel (mobile sidebar, task drawer). */
export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & { side?: 'left' | 'right' }) {
  const { t } = useTranslation()
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
      <SheetPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-50 flex h-full w-[min(100vw,30rem)] flex-col border-border/70 bg-popover/95 shadow-2xl backdrop-blur-2xl outline-none data-[state=open]:animate-fade-up',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label={t('actions.close')}
        >
          <XIcon className="size-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}
