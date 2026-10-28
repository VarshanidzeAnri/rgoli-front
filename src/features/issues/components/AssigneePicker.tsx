import { useTranslation } from 'react-i18next'

import { UserAvatar } from '@/components/kit'
import { Checkbox } from '@/components/ui/misc'
import { useGetPeopleQuery } from '@/features/workspace/api'
import { cn } from '@/lib/cn'

/** Multi-select list of active people (checkboxes). */
export function AssigneePicker({
  value,
  onChange,
  disabled = false,
  className,
  labelledBy,
}: {
  value: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
  className?: string
  labelledBy?: string
}) {
  const { t } = useTranslation('board')
  const { data: people = [] } = useGetPeopleQuery()

  if (people.length === 0) return <p className="text-xs text-muted-foreground">{t('issue.noAssignees')}</p>

  return (
    <div role="group" aria-labelledby={labelledBy} className={cn('flex max-h-44 flex-col gap-1 overflow-y-auto rounded-xl border border-input bg-secondary/20 p-1.5', className)}>
      {people.map((person) => {
        const checked = value.includes(person.id)
        const id = `assignee-${person.id}`
        return (
          <label key={person.id} htmlFor={id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary/50">
            <Checkbox
              id={id}
              checked={checked}
              disabled={disabled}
              onCheckedChange={(c) => onChange(c === true ? [...value, person.id] : value.filter((v) => v !== person.id))}
            />
            <UserAvatar user={person} size="xs" />
            <span className="truncate text-[12.5px]">{person.name}</span>
          </label>
        )
      })}
    </div>
  )
}
