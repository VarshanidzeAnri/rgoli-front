import { CheckIcon, PencilIcon, PlusIcon, Undo2Icon, WalletIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can, ConfirmDialog, OptionSelect, EmptyState, ErrorState, ListSkeleton, Pagination, Panel, PaymentPill, UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { useCan } from '@/hooks/useCan'
import { useFormat } from '@/hooks/useFormat'
import { PAYMENT_STATUSES, type PaymentStatus } from '@/lib/enums'
import { useAppDispatch } from '@/store'
import { openDialog } from '@/store/uiSlice'
import type { SalaryRequest } from '@/types/api'

import { useDecideSalaryRequestMutation, useDeleteSalaryRequestMutation, useGetSalaryRequestsQuery } from '../api'


/** Salary requests: everyone sees their own; finance.view sees all. Approve/reject with salary.approve. */
export function SalaryRequestsPanel() {
  const { t } = useTranslation(['finance', 'enums', 'common'])
  const f = useFormat()
  const dispatch = useAppDispatch()
  const seesAll = useCan('finance.view')
  const [status, setStatus] = useState<PaymentStatus | ''>('')
  const [page, setPage] = useState(1)
  const [withdrawing, setWithdrawing] = useState<SalaryRequest | null>(null)
  const { data, isLoading, isError, refetch } = useGetSalaryRequestsQuery({ status, page })
  const [decide] = useDecideSalaryRequestMutation()
  const [remove, { isLoading: removing }] = useDeleteSalaryRequestMutation()

  const withdraw = async () => {
    if (!withdrawing) return
    const result = await remove(withdrawing.id)
    if (!('error' in result)) toast.success(t('salary.withdrawn'))
    setWithdrawing(null)
  }

  return (
    <Panel
      title={seesAll ? t('salary.title') : t('salary.mine')}
      actions={
        <>
          <OptionSelect
            className="h-8 w-40 text-xs"
            aria-label={t('salary.filterStatus')}
            value={status}
            emptyLabel={t('common:all')}
            onChange={(v) => {
              setStatus((v ?? '') as PaymentStatus | '')
              setPage(1)
            }}
            options={PAYMENT_STATUSES.map((s) => ({ value: s, label: t(`enums:payment_status.${s}`) }))}
          />
          <Can permission="salary.request">
            <Button size="sm" variant="primary" onClick={() => dispatch(openDialog({ kind: 'salaryRequest' }))}>
              <PlusIcon />
              {t('salary.new')}
            </Button>
          </Can>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={WalletIcon} title={t('salary.empty')} text="" />
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-border/50">
            {data.data.map((row) => (
              <li key={row.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {row.user ? <UserAvatar user={row.user} size="sm" /> : null}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{row.title}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      {row.project.key} · {row.project.name}
                      {row.user ? ` · ${row.user.name}` : ''}
                    </p>
                    {row.decider && row.decided_at ? (
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                        {t('salary.decided', { name: row.decider.name, date: f.date(row.decided_at) })}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="num text-[13px] font-semibold">{f.money(row.amount)}</span>
                  <PaymentPill status={row.status} />
                  {row.can.decide ? (
                    <>
                      <Button size="sm" variant="outline" className="text-success" onClick={() => void decide({ id: row.id, decision: 'approve' })}>
                        <CheckIcon />
                        {t('salary.approve')}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => void decide({ id: row.id, decision: 'reject' })}>
                        <XIcon />
                        {t('salary.reject')}
                      </Button>
                    </>
                  ) : null}
                  {row.can.update ? (
                    <>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t('salary.edit')}
                        onClick={() => dispatch(openDialog({ kind: 'salaryRequest', id: row.id }))}
                      >
                        <PencilIcon />
                      </Button>
                      <Button size="icon-sm" variant="ghost" aria-label={t('salary.withdraw')} onClick={() => setWithdrawing(row)}>
                        <Undo2Icon />
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}

      <ConfirmDialog
        open={withdrawing !== null}
        onOpenChange={(o) => !o && setWithdrawing(null)}
        description={t('salary.withdrawConfirm', { name: withdrawing?.title ?? '' })}
        confirmLabel={t('salary.withdraw')}
        onConfirm={() => void withdraw()}
        loading={removing}
      />
    </Panel>
  )
}
