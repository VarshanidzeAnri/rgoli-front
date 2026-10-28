import {
  BanknoteIcon,
  CalendarIcon,
  FolderKanbanIcon,
  FolderPlusIcon,
  HourglassIcon,
  ListChecksIcon,
  SquarePlusIcon,
  UploadIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { CardsSkeleton, EmptyState, ErrorState, KpiCard, ListSkeleton, PageHero, Panel, Pill, ProgressBar, StatusPill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { ActivityList, IssueRow, StatusDistribution, WorkloadList } from '@/features/dashboard'
import { useGetDashboardQuery } from '@/features/workspace/api'
import { useCan } from '@/hooks/useCan'
import { useFormat } from '@/hooks/useFormat'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectUser } from '@/store/authSlice'
import { openDialog, type DialogKind } from '@/store/uiSlice'

function QuickActions() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const actions: { kind: DialogKind; label: string; icon: typeof FolderPlusIcon; allowed: boolean }[] = [
    { kind: 'project', label: t('quickAdd.project'), icon: FolderPlusIcon, allowed: useCan('projects.create') },
    { kind: 'issue', label: t('quickAdd.issue'), icon: SquarePlusIcon, allowed: useCan('issues.create') },
    { kind: 'file', label: t('quickAdd.file'), icon: UploadIcon, allowed: useCan('files.upload') },
    { kind: 'salaryRequest', label: t('quickAdd.salaryRequest'), icon: BanknoteIcon, allowed: useCan('salary.request') },
  ]
  return (
    <>
      {actions
        .filter((a) => a.allowed)
        .map(({ kind, label, icon: Icon }, index) => (
          <Button key={kind} size="sm" variant={index === 0 ? 'primary' : 'outline'} onClick={() => dispatch(openDialog({ kind }))}>
            <Icon />
            {label}
          </Button>
        ))}
    </>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common'])
  const f = useFormat()
  const user = useAppSelector(selectUser)
  const { data, isLoading, isError, refetch } = useGetDashboardQuery()

  const budget = data?.kpis.budget ?? null
  const paidPercent = budget && Number(budget.total) > 0 ? (Number(budget.paid) / Number(budget.total)) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('greeting', { name: user?.name ?? '' })}
        subtitle={t('subtitle')}
        meta={
          <>
            <Pill tone="primary">
              <CalendarIcon className="size-3" aria-hidden />
              {f.longDate(new Date())}
            </Pill>
            {data ? (
              <>
                <Pill tone="info">
                  <UsersIcon className="size-3" aria-hidden />
                  {t('meta.team', { count: data.team_size })}
                </Pill>
                <Pill tone="muted">{t('meta.myTasks', { count: data.my_tasks_this_week.length })}</Pill>
              </>
            ) : null}
          </>
        }
        actions={<QuickActions />}
      />

      {isError ? (
        <Panel>
          <ErrorState onRetry={() => void refetch()} />
        </Panel>
      ) : isLoading || !data ? (
        <>
          <CardsSkeleton />
          <ListSkeleton rows={6} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label={t('kpi.activeProjects')}
              value={f.number(data.kpis.active_projects)}
              hint={t('kpi.activeProjectsHint')}
              icon={FolderKanbanIcon}
            />
            <KpiCard
              label={t('kpi.openTasks')}
              value={f.number(data.kpis.open_tasks)}
              hint={<span className={data.kpis.critical_tasks > 0 ? 'text-danger' : undefined}>{t('kpi.critical', { count: data.kpis.critical_tasks })}</span>}
              icon={ListChecksIcon}
              tone="info"
            />
            {budget ? (
              <KpiCard
                label={t('kpi.budget')}
                value={f.money(budget.total)}
                hint={t('kpi.budgetHint', { paid: f.money(budget.paid), remaining: f.money(budget.remaining) })}
                icon={WalletIcon}
                tone="success"
                footer={<ProgressBar value={paidPercent} variant="success" label={t('kpi.paidShare')} />}
              />
            ) : null}
            <KpiCard
              label={t('kpi.pendingSalary')}
              value={f.number(data.kpis.pending_salary_requests)}
              hint={t('kpi.pendingSalaryHint')}
              icon={HourglassIcon}
              tone="warning"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <Panel
              eyebrow={t('projects.eyebrow')}
              title={t('projects.title')}
              actions={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/projects">{t('common:actions.viewAll')}</Link>
                </Button>
              }
            >
              <StatusDistribution counts={data.project_status_distribution} />
              {data.projects.length === 0 ? (
                <EmptyState title={t('projects.empty')} text="" />
              ) : (
                <ul className="mt-5 flex flex-col gap-2">
                  {data.projects.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/projects/${p.id}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-2xl border border-border/50 bg-secondary/20 px-4 py-3 transition hover:border-primary/40 sm:grid-cols-[1fr_auto_8rem]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{p.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            <span className="num">{p.key}</span> · {p.current_phase?.name ?? t('projects.noPhase')}
                          </span>
                        </span>
                        <StatusPill status={p.status} />
                        <span className="col-span-2 flex items-center gap-2 sm:col-span-1">
                          <ProgressBar value={p.progress} label={p.name} />
                          <span className="num w-9 text-right text-[11px] text-muted-foreground">{p.progress}%</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel eyebrow={t('activity.eyebrow')} title={t('activity.title')}>
              {data.activity.length === 0 ? <EmptyState title={t('activity.empty')} text="" /> : <ActivityList items={data.activity} />}
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel eyebrow={t('myWeek.eyebrow')} title={t('myWeek.title')}>
              {data.my_tasks_this_week.length === 0 ? (
                <EmptyState title={t('myWeek.empty')} text="" />
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.my_tasks_this_week.map((issue) => (
                    <li key={issue.id}>
                      <IssueRow issue={issue} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel eyebrow={t('workload.eyebrow')} title={t('workload.title')}>
              {data.workload.length === 0 ? <EmptyState title={t('workload.empty')} text="" /> : <WorkloadList rows={data.workload} />}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
