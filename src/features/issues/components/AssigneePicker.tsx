import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Combobox, UserAvatar, type ComboOption } from '@/components/kit'
import { useGetPeopleQuery } from '@/features/workspace/api'

/** Searchable multi-select of active people (assignees). */
export function AssigneePicker({
  value,
  onChange,
  disabled = false,
  className,
  id,
  ariaLabel,
}: {
  value: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
  className?: string
  id?: string
  ariaLabel?: string
}) {
  const { t } = useTranslation(['board', 'common'])
  const { data: people = [] } = useGetPeopleQuery()
  const options = useMemo<ComboOption[]>(
    () =>
      people.map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.job_title ?? undefined,
        icon: <UserAvatar user={p} size="xs" />,
      })),
    [people],
  )

  return (
    <Combobox
      multiple
      id={id}
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={t('issue.noAssignees')}
      searchPlaceholder={t('common:actions.search')}
    />
  )
}
