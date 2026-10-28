import { Command } from 'cmdk'
import { CheckIcon, ChevronsUpDownIcon, SearchIcon, XIcon } from 'lucide-react'
import { forwardRef, useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { inputClass } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/misc'
import { cn } from '@/lib/cn'

import { useFieldControl } from './fieldContext'

export interface ComboOption {
  value: number
  label: string
  /** Extra text that is searched and shown dimmed (e.g. project key, email). */
  hint?: string
  icon?: ReactNode
}

interface BaseProps {
  options: ComboOption[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-label'?: string
}

type Props =
  | (BaseProps & { multiple?: false; value: number | null | undefined; onChange: (value: number | null) => void })
  | (BaseProps & { multiple: true; value: number[]; onChange: (value: number[]) => void })

/**
 * Searchable select built on cmdk (projects, people). `multiple` turns it into a
 * multi-select with removable chips (assignees, members).
 */
export const Combobox = forwardRef<HTMLButtonElement, Props>(function Combobox(props, ref) {
  const { options, placeholder, searchPlaceholder, disabled, className, ...rest } = props
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const aria = useFieldControl({ id: rest.id, 'aria-invalid': rest['aria-invalid'], 'aria-describedby': rest['aria-describedby'], 'aria-label': rest['aria-label'] })
  const listId = useId()

  const selectedIds = props.multiple ? props.value : props.value === null || props.value === undefined ? [] : [props.value]
  const selected = options.filter((o) => selectedIds.includes(o.value))

  const toggle = (id: number) => {
    if (props.multiple) {
      props.onChange(props.value.includes(id) ? props.value.filter((v) => v !== id) : [...props.value, id])
    } else {
      props.onChange(props.value === id ? null : id)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          className={cn(inputClass, 'h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5 text-left', className)}
          {...aria}
        >
          {selected.length === 0 ? (
            <span className="flex-1 truncate text-muted-foreground/70">{placeholder ?? t('combobox.placeholder')}</span>
          ) : props.multiple ? (
            <span className="flex flex-1 flex-wrap gap-1.5">
              {selected.map((o) => (
                <span key={o.value} className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-secondary/60 pr-1 pl-1.5 text-[11.5px]">
                  {o.icon}
                  {o.label}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t('combobox.remove', { name: o.label })}
                    className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(o.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        toggle(o.value)
                      }
                    }}
                  >
                    <XIcon className="size-3" />
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span className="flex flex-1 items-center gap-2 truncate">
              {selected[0]?.icon}
              {selected[0]?.label}
            </span>
          )}
          <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0">
        <Command
          filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-3">
            <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
            <Command.Input
              placeholder={searchPlaceholder ?? t('combobox.search')}
              className="h-10 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <Command.List id={listId} className="max-h-64 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-xs text-muted-foreground">{t('noResults')}</Command.Empty>
            {options.map((o) => {
              const active = selectedIds.includes(o.value)
              return (
                <Command.Item
                  key={o.value}
                  value={`${o.label} ${o.hint ?? ''} #${o.value}`}
                  onSelect={() => toggle(o.value)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] outline-none data-[selected=true]:bg-secondary data-[selected=true]:text-primary"
                >
                  {o.icon}
                  <span className="min-w-0 flex-1 truncate">
                    {o.label}
                    {o.hint ? <span className="ml-2 font-mono text-[10.5px] text-muted-foreground">{o.hint}</span> : null}
                  </span>
                  <CheckIcon className={cn('size-3.5 text-primary', active ? 'opacity-100' : 'opacity-0')} aria-hidden />
                </Command.Item>
              )
            })}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
