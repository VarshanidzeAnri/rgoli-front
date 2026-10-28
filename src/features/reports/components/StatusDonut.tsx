import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { EmptyState, Panel } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { STATUS_TONE, STATUSES, type Status } from '@/lib/enums'
import { TONE_DOT } from '@/lib/tones'
import type { StatusCounts } from '@/types/api'

import { useChartColors } from '../useChartColors'

/** Donut of task statuses with a legend (labels + counts, never color alone) and a table view. */
export function StatusDonut({ counts }: { counts: StatusCounts }) {
  const { t } = useTranslation(['reports', 'enums'])
  const colors = useChartColors()
  const [asTable, setAsTable] = useState(false)

  const rows = STATUSES.map((status) => ({ status, label: t(`enums:status.${status}`), value: counts[status] }))
  const total = rows.reduce((sum, r) => sum + r.value, 0)
  const summary = rows.map((r) => `${r.label}: ${r.value}`).join(', ')

  return (
    <Panel
      title={t('charts.statusTitle')}
      actions={
        <Button size="sm" variant="ghost" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? t('charts.showChart') : t('charts.showTable')}
        </Button>
      }
    >
      {total === 0 ? (
        <EmptyState title={t('charts.noData')} text="" />
      ) : asTable ? (
        <StatusTable rows={rows} />
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-[220px_1fr]">
          <figure className="relative h-[220px]" aria-label={t('charts.statusDescription', { summary })}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows.filter((r) => r.value > 0).map((r) => ({ ...r, fill: colors.tone[STATUS_TONE[r.status]] }))}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke={colors.surface}
                  strokeWidth={2}
                  isAnimationActive={false}
                 />
                <Tooltip
                  contentStyle={{ background: colors.surface, border: `1px solid ${colors.grid}`, borderRadius: 12, color: colors.text, fontSize: 12 }}
                  itemStyle={{ color: colors.text }}
                />
              </PieChart>
            </ResponsiveContainer>
            <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-2xl font-semibold">{total}</span>
              <span className="micro-label">{t('charts.total')}</span>
            </figcaption>
          </figure>
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.status} className="flex items-center gap-2.5 text-[12.5px]">
                <span aria-hidden className={`size-2.5 rounded-full ${TONE_DOT[STATUS_TONE[r.status]]}`} />
                <span className="flex-1">{r.label}</span>
                <span className="num text-muted-foreground">{r.value}</span>
                <span className="num w-10 text-right text-[11px] text-muted-foreground">{Math.round((r.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

function StatusTable({ rows }: { rows: { status: Status; label: string; value: number }[] }) {
  const { t } = useTranslation('reports')
  return (
    <table className="w-full text-[12.5px]">
      <thead>
        <tr className="border-b border-border/60 text-left">
          <th scope="col" className="micro-label py-2 font-normal">
            {t('charts.statusTitle')}
          </th>
          <th scope="col" className="micro-label py-2 text-right font-normal">
            {t('charts.count')}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.status} className="border-b border-border/40 last:border-0">
            <td className="py-2">{r.label}</td>
            <td className="num py-2 text-right">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
