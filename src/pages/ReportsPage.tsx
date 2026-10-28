import { CheckCircle2Icon, DownloadIcon, GaugeIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Can, CardsSkeleton, DatePicker, ErrorState, Field, KpiCard, PageHero, Panel, ProgressBar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { reportExportUrl, useGetReportSummaryQuery } from '@/features/reports/api'
import { PlannedVsPaidChart } from '@/features/reports/components/PlannedVsPaidChart'
import { StatusDonut } from '@/features/reports/components/StatusDonut'
import { WorkloadCards } from '@/features/reports/components/WorkloadCards'
import { useAuthorizedDownload } from '@/hooks/useAuthorized'
import { useFormat } from '@/hooks/useFormat'

export default function ReportsPage() {
  const { t } = useTranslation(['reports', 'nav', 'common'])
  const f = useFormat()
  const download = useAuthorizedDownload()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data, isLoading, isError, refetch } = useGetReportSummaryQuery({ from, to })

  const done = data?.task_status.done ?? 0
  const total = data ? Object.values(data.task_status).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('nav:reports')}
        subtitle={t('subtitle')}
        actions={
          <Can permission="reports.export">
            <Button variant="outline" onClick={() => void download(reportExportUrl('tasks'), 'rgoli-tasks.csv')}>
              <DownloadIcon />
              {t('export.tasks')}
            </Button>
            <Button variant="outline" onClick={() => void download(reportExportUrl('projects'), 'rgoli-projects.csv')}>
              <DownloadIcon />
              {t('export.projects')}
            </Button>
          </Can>
        }
      />

      <div className="glass flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <Field label={t('range.from')} className="sm:w-48">
          <DatePicker value={from} onChange={(v) => setFrom(v ?? '')} />
        </Field>
        <Field label={t('range.to')} className="sm:w-48">
          <DatePicker value={to} min={from || null} onChange={(v) => setTo(v ?? '')} />
        </Field>
        {from || to ? (
          <Button
            variant="ghost"
            onClick={() => {
              setFrom('')
              setTo('')
            }}
          >
            {t('common:actions.clear')}
          </Button>
        ) : null}
      </div>

      {isError ? (
        <Panel>
          <ErrorState onRetry={() => void refetch()} />
        </Panel>
      ) : isLoading || !data ? (
        <>
          <CardsSkeleton count={3} className="lg:grid-cols-3" />
          <Skeleton className="h-72 rounded-[26px]" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <KpiCard
              label={t('kpi.completion')}
              value={`${data.task_completion_percent}%`}
              hint={t('kpi.completionHint', { done, total })}
              icon={CheckCircle2Icon}
              tone="success"
              footer={<ProgressBar value={data.task_completion_percent} variant="success" label={t('kpi.completion')} />}
            />
            <KpiCard
              label={t('kpi.progress')}
              value={`${data.average_progress}%`}
              hint={t('kpi.progressHint')}
              icon={GaugeIcon}
              footer={<ProgressBar value={data.average_progress} label={t('kpi.progress')} />}
            />
            {data.outstanding_budget !== null ? (
              <KpiCard label={t('kpi.outstanding')} value={f.money(data.outstanding_budget)} hint={t('kpi.outstandingHint')} icon={WalletIcon} tone="warning" />
            ) : null}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <StatusDonut counts={data.task_status} />
            {data.planned_vs_paid.length > 0 ? <PlannedVsPaidChart rows={data.planned_vs_paid} /> : null}
          </div>

          <WorkloadCards rows={data.workload} />
        </>
      )}
    </div>
  )
}
