import { FolderSearchIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Can, EmptyState, ErrorState, ListSkeleton, OptionSelect, PageHero, Pagination, Panel, Pill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetProjectsQuery } from '@/features/projects/api'
import { ProjectCards, ProjectTable } from '@/features/projects/components/ProjectList'
import { useDebounced } from '@/hooks/useDebounced'
import { cn } from '@/lib/cn'
import { DISCIPLINES, STATUSES, STATUS_TONE, type Discipline, type Status } from '@/lib/enums'
import { TONE_CLASS } from '@/lib/tones'
import { useAppDispatch } from '@/store'
import { openDialog } from '@/store/uiSlice'

const PER_PAGE = 20

export default function ProjectsPage() {
  const { t } = useTranslation(['projects', 'common', 'enums'])
  const dispatch = useAppDispatch()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Status | ''>('')
  const [discipline, setDiscipline] = useState<Discipline | ''>('')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search.trim(), 300)

  const { data, isLoading, isFetching, isError, refetch } = useGetProjectsQuery({
    search: debounced,
    status,
    discipline,
    page,
    per_page: PER_PAGE,
  })

  const counts = data?.meta.status_counts
  const allCount = counts ? STATUSES.reduce((sum, s) => sum + counts[s], 0) : undefined

  const chip = (value: Status | '', label: string, count: number | undefined) => {
    const active = status === value
    const tone = value === '' ? 'primary' : STATUS_TONE[value]
    return (
      <button
        key={value || 'all'}
        type="button"
        aria-pressed={active}
        onClick={() => {
          setStatus(value)
          setPage(1)
        }}
        className={cn(
          'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] transition',
          active ? TONE_CLASS[tone] : 'border-border/70 bg-secondary/30 text-muted-foreground hover:text-foreground',
        )}
      >
        {label}
        <span className="num text-[10.5px] opacity-80">{count ?? '—'}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        meta={data ? <Pill tone="primary">{t('total', { count: allCount ?? data.meta.total })}</Pill> : null}
        actions={
          <Can permission="projects.create">
            <Button variant="primary" onClick={() => dispatch(openDialog({ kind: 'project' }))}>
              <PlusIcon />
              {t('new')}
            </Button>
          </Can>
        }
      />

      <Panel bodyClassName="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchLabel')}
              className="pl-9"
            />
          </div>
          <OptionSelect
            value={discipline}
            aria-label={t('disciplineFilter')}
            onChange={(v) => {
              setDiscipline((v ?? '') as Discipline | '')
              setPage(1)
            }}
            emptyLabel={t('allDisciplines')}
            options={DISCIPLINES.map((d) => ({ value: d, label: t(`enums:discipline.${d}`) }))}
            className="lg:w-56"
          />
        </div>

        <div role="group" aria-label={t('statusFilter')} className="flex flex-wrap gap-2">
          {chip('', t('common:all'), allCount)}
          {STATUSES.map((s) => chip(s, t(`enums:status.${s}`), counts?.[s]))}
        </div>

        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <ListSkeleton rows={6} />
        ) : data.data.length === 0 ? (
          <EmptyState icon={FolderSearchIcon} title={t('empty.title')} text={t('empty.text')} />
        ) : (
          <div className={cn('transition-opacity', isFetching && 'opacity-60')} aria-busy={isFetching}>
            <ProjectTable projects={data.data} />
            <ProjectCards projects={data.data} />
            <Pagination meta={data.meta} onPage={setPage} />
          </div>
        )}
      </Panel>
    </div>
  )
}
