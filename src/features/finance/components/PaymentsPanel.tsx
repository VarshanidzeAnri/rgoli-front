import { PencilIcon, PlusIcon, ReceiptIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can, ConfirmDialog, EmptyState, ErrorState, ListSkeleton, Pagination, Panel } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/hooks/useFormat'
import type { ClientPayment } from '@/types/api'

import { useDeletePaymentMutation, useGetPaymentsQuery } from '../api'
import { PaymentDialog } from './PaymentDialog'

/** Client payments list (finance.view) with CRUD behind client_payments.manage. */
export function PaymentsPanel() {
  const { t } = useTranslation(['finance', 'enums', 'common'])
  const f = useFormat()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<ClientPayment | 'new' | null>(null)
  const [deleting, setDeleting] = useState<ClientPayment | null>(null)
  const { data, isLoading, isError, refetch } = useGetPaymentsQuery({ page })
  const [remove, { isLoading: removing }] = useDeletePaymentMutation()

  const confirmDelete = async () => {
    if (!deleting) return
    const result = await remove({ id: deleting.id, projectId: deleting.project_id })
    if (!('error' in result)) toast.success(t('common:deleted'))
    setDeleting(null)
  }

  return (
    <Panel
      title={t('payments.title')}
      actions={
        <Can permission="client_payments.manage">
          <Button size="sm" variant="primary" onClick={() => setEditing('new')}>
            <PlusIcon />
            {t('payments.add')}
          </Button>
        </Can>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={ReceiptIcon} title={t('payments.empty')} text="" />
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-border/50">
            {data.data.map((p) => {
              const label = `${p.project?.key ?? ''} ${f.money(p.amount)}`
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{p.project ? `${p.project.key} · ${p.project.name}` : ''}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {f.date(p.paid_at)} · {t(`enums:payment_method.${p.method}`)}
                      {p.recorder ? ` · ${t('payments.recordedBy', { name: p.recorder.name })}` : ''}
                    </p>
                    {p.note ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{p.note}</p> : null}
                  </div>
                  <span className="num text-[13px] font-semibold text-success">{f.money(p.amount)}</span>
                  <Can permission="client_payments.manage">
                    <Button size="icon-sm" variant="ghost" aria-label={t('payments.edit', { name: label })} onClick={() => setEditing(p)}>
                      <PencilIcon />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label={t('payments.delete', { name: label })} onClick={() => setDeleting(p)}>
                      <Trash2Icon />
                    </Button>
                  </Can>
                </li>
              )
            })}
          </ul>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}

      {editing ? <PaymentDialog payment={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        description={deleting ? t('payments.deleteConfirm', { amount: f.money(deleting.amount), date: f.date(deleting.paid_at) }) : ''}
        onConfirm={() => void confirmDelete()}
        loading={removing}
      />
    </Panel>
  )
}
