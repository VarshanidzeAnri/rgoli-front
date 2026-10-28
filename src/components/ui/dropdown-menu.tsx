import { CheckIcon } from 'lucide-react'
import { DropdownMenu as Menu } from 'radix-ui'
import { type ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger
export const DropdownMenuGroup = Menu.Group
export const DropdownMenuRadioGroup = Menu.RadioGroup

export function DropdownMenuContent({ className, sideOffset = 8, ...props }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-2xl border border-border/70 bg-popover/95 p-1.5 shadow-xl backdrop-blur-2xl data-[state=open]:animate-fade-up',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
}

export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-secondary data-[highlighted]:text-primary [&_svg]:size-4 [&_svg]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] outline-none data-[highlighted]:bg-secondary',
        className,
      )}
      {...props}
    >
      <span className="flex size-4 items-center justify-center">
        <Menu.ItemIndicator>
          <CheckIcon className="size-3.5 text-primary" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  )
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return <Menu.Label className={cn('micro-label px-2.5 pt-2 pb-1', className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn('my-1 h-px bg-border/70', className)} {...props} />
}
