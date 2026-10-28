import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { type ComponentProps, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  className,
  children,
  size = 'md',
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const { t } = useTranslation()
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-fade-up" />
      <DialogPrimitive.Content
        className={cn(
          'glass fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden bg-popover/90 outline-none data-[state=open]:animate-fade-up',
          { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label={t('actions.close')}
        >
          <XIcon className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ title, description, eyebrow }: { title: ReactNode; description?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="border-b border-border/60 px-6 pt-5 pb-4 pr-12">
      {eyebrow ? <p className="micro-label mb-1">{eyebrow}</p> : null}
      <DialogPrimitive.Title className="text-[15px] font-semibold">{title}</DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">{description}</DialogPrimitive.Description>
      ) : (
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
      )}
    </div>
  )
}

export function DialogBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-5', className)} {...props} />
}

/** Sticky footer for form actions. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border/60 bg-popover/80 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}
