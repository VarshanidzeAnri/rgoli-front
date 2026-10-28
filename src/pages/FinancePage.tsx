import { BanknoteIcon, ClockIcon, HandCoinsIcon, WalletIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Can, CardsSkeleton, KpiCard, PageHero, Pill, ProgressBar } from '@/components/kit'
import { useGetFinanceSummaryQuery } from '@/features/finance/api'
import { BudgetTable } from '@/features/finance/components/BudgetTable'
import { PaymentsPanel } from '@/features/finance/components/PaymentsPanel'
import { SalaryRequestsPanel } from '@/features/finance/components/SalaryRequestsPanel'
import { useCan } from '@/hooks/useCan'
import { useFormat } from '@/hooks/useFormat'

export default function FinancePage() {
  const { t } = useTranslation(['finance', 'nav'])
  const f = useFormat()
  const canFinance = useCan('finance.view')
  const { data: summary, isLoading } = useGetFinanceSummaryQuery(undefined, { skip: !canFinance })

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('nav:finance')}
        subtitle={t('subtitle')}
        meta={summary ? <Pill tone="success">{t('kpi.paidHint', { percent: summary.paid_percent })}</Pill> : null}
      />

      <Can permission="finance.view">
        {isLoading || !summary ? (
          <CardsSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label={t('kpi.totalBudget')} value={f.money(summary.total_budget)} hint={t('kpi.totalHint')} icon={WalletIcon} />
            <KpiCard
              label={t('kpi.paid')}
              value={f.money(summary.paid_by_clients)}
              hint={t('kpi.paidHint', { percent: summary.paid_percent })}
              icon={HandCoinsIcon}
              tone="success"
              footer={<ProgressBar value={summary.paid_percent} variant="success" label={t('kpi.paid')} />}
            />
            <KpiCard label={t('kpi.approved')} value={f.money(summary.approved_salaries)} hint={t('kpi.approvedHint')} icon={BanknoteIcon} tone="info" />
            <KpiCard
              label={t('kpi.pending')}
              value={summary.pending_requests}
              hint={t('kpi.pendingHint', { amount: f.money(summary.pending_amount) })}
              icon={ClockIcon}
              tone="warning"
            />
          </div>
        )}
      </Can>

      <div className="grid gap-5 2xl:grid-cols-2">
        <SalaryRequestsPanel />
        {canFinance ? <PaymentsPanel /> : null}
      </div>

      {canFinance && summary ? <BudgetTable summary={summary} /> : null}
    </div>
  )
}
