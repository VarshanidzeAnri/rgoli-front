import { XIcon } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/input'
import { Label, Switch } from '@/components/ui/misc'
import { useGetProjectsQuery } from '@/features/projects/api'
import { useGetPeopleQuery } from '@/features/workspace/api'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectBoardFilters, setBoardFilters } from '@/store/uiSlice'

/** Project / assignee / only-mine filters, kept in ui.board. */
export function BoardFilters() {
  const { t } = useTranslation('board')
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectBoardFilters)
  const { data: projects } = useGetProjectsQuery({ per_page: 100, sort: 'name' })
  const { data: people = [] } = useGetPeopleQuery()
  const ids = { project: useId(), assignee: useId(), mine: useId() }
  const active = filters.projectId !== null || filters.assigneeId !== null || filters.onlyMine

  return (
    <div role="group" aria-label={t('filters.label')} className="flex flex-wrap items-end gap-3">
      <div className="flex w-full flex-col gap-1.5 sm:w-56">
        <Label htmlFor={ids.project}>{t('filters.project')}</Label>
        <NativeSelect
          id={ids.project}
          value={filters.projectId ?? ''}
          onChange={(e) => dispatch(setBoardFilters({ projectId: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">{t('filters.allProjects')}</option>
          {projects?.data.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} · {p.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-52">
        <Label htmlFor={ids.assignee}>{t('filters.assignee')}</Label>
        <NativeSelect
          id={ids.assignee}
          value={filters.assigneeId ?? ''}
          disabled={filters.onlyMine}
          onChange={(e) => dispatch(setBoardFilters({ assigneeId: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">{t('filters.allAssignees')}</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex h-10 items-center gap-2.5">
        <Switch id={ids.mine} checked={filters.onlyMine} onCheckedChange={(onlyMine) => dispatch(setBoardFilters({ onlyMine }))} />
        <label htmlFor={ids.mine} className="text-[12.5px]">
          {t('filters.onlyMine')}
        </label>
      </div>
      {active ? (
        <Button size="sm" variant="ghost" className="h-10" onClick={() => dispatch(setBoardFilters({ projectId: null, assigneeId: null, onlyMine: false }))}>
          <XIcon />
          {t('filters.clear')}
        </Button>
      ) : null}
    </div>
  )
}
