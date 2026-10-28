import { useTranslation } from 'react-i18next'

import { Combobox } from '@/components/kit'
import { useGetProjectsQuery } from '@/features/projects/api'

/** Searchable picker over visible projects. Value is the project id as a string ('' = none), for RHF forms. */
export function ProjectSelect({
  value,
  onChange,
  disabled,
  id,
  invalid,
  describedBy,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  invalid?: boolean
  describedBy?: string
}) {
  const { t } = useTranslation('files')
  const { data } = useGetProjectsQuery({ per_page: 100 })
  const options = (data?.data ?? []).map((p) => ({ value: p.id, label: p.name, hint: p.key }))
  return (
    <Combobox
      id={id}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      value={value ? Number(value) : null}
      onChange={(v) => onChange(v === null ? '' : String(v))}
      options={options}
      placeholder={t('upload.selectProject')}
      disabled={disabled}
    />
  )
}
