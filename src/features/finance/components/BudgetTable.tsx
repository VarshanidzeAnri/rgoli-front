import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState, Panel, StatusPill } from '@/components/kit'
import { useFormat } from '@/hooks/useFormat'
import type { FinanceSummary } from '@/types/api'

/** Per-project agreed / paid / remaining with a totals row (finance.view only). */
export function BudgetTable({ summary }: { summary: FinanceSummary }) {
  const { t } = useTranslation('finance')
  const f = useFormat()

  return (
    <Panel title={t('budget.title')} bodyClassName="p-0">
      {summary.projects.length === 0 ? (
        <EmptyState title={t('budget.empty')} text="" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[12.5px]">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th scope="col" className="micro-label px-5 py-3 font-normal">
                  {t('budget.project')}
                </th>
                <th scope="col" className="micro-label px-3 py-3 text-right font-normal">
                  {t('budget.budget')}
                </th>
                <th scope="col" className="micro-label px-3 py-3 text-right font-normal">
                  {t('budget.agreed')}
                </th>
                <th scope="col" className="micro-label px-3 py-3 text-right font-normal">
                  {t('budget.paid')}
                </th>
                <th scope="col" className="micro-label px-5 py-3 text-right font-normal">
                  {t('budget.remaining')}
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.projects.map((row) => (
                <tr key={row.project.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/20">
                  <td className="px-5 py-3">
                    <Link to={`/projects/${row.project.id}`} className="flex items-center gap-2 hover:text-primary">
                      <span className="font-mono text-[10.5px] text-muted-foreground">{row.project.key}</span>
                      <span className="truncate">{row.project.name}</span>
                    </Link>
                    <StatusPill status={row.project.status} className="mt-1" />
                  </td>
                  <td className="num px-3 py-3 text-right text-muted-foreground">{f.money(row.budget)}</td>
                  <td className="num px-3 py-3 text-right">{f.money(row.agreed_price)}</td>
                  <td className="num px-3 py-3 text-right text-success">{f.money(row.paid)}</td>
                  <td className="num px-5 py-3 text-right font-semibold">{f.money(row.remaining)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/70 bg-secondary/20 font-semibold">
                <th scope="row" className="px-5 py-3 text-left">
                  {t('budget.total')}
                </th>
                <td />
                <td className="num px-3 py-3 text-right">{f.money(summary.total_budget)}</td>
                <td className="num px-3 py-3 text-right text-success">{f.money(summary.paid_by_clients)}</td>
                <td className="num px-5 py-3 text-right">{f.money(summary.remaining)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Panel>
  )
}
