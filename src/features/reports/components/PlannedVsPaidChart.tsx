import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Panel } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/hooks/useFormat'
import type { ReportSummary } from '@/types/api'

import { useChartColors } from '../useChartColors'

/** Grouped bars per project: planned (agreed) vs paid. One axis, legend, money tooltips, table view. */
export function PlannedVsPaidChart({ rows }: { rows: ReportSummary['planned_vs_paid'] }) {
  const { t } = useTranslation('reports')
  const f = useFormat()
  const colors = useChartColors()
  const [asTable, setAsTable] = useState(false)

  const data = rows.map((r) => ({ project: r.project, name: r.name, planned: Number(r.planned), paid: Number(r.paid) }))
  const plannedLabel = t('charts.planned')
  const paidLabel = t('charts.paid')

  return (
    <Panel
      title={t('charts.plannedTitle')}
      actions={
        <Button size="sm" variant="ghost" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? t('charts.showChart') : t('charts.showTable')}
        </Button>
      }
    >
      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-[12.5px]">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th scope="col" className="micro-label py-2 font-normal">
                  {t('charts.project')}
                </th>
                <th scope="col" className="micro-label py-2 text-right font-normal">
                  {plannedLabel}
                </th>
                <th scope="col" className="micro-label py-2 text-right font-normal">
                  {paidLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.project} className="border-b border-border/40 last:border-0">
                  <td className="py-2">
                    <span className="mr-2 font-mono text-[10.5px] text-muted-foreground">{r.project}</span>
                    {r.name}
                  </td>
                  <td className="num py-2 text-right">{f.money(r.planned)}</td>
                  <td className="num py-2 text-right">{f.money(r.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <figure className="h-[280px]" aria-label={t('charts.plannedDescription')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.grid} strokeOpacity={0.5} />
              <XAxis dataKey="project" tickLine={false} axisLine={false} tick={{ fill: colors.axis, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tick={{ fill: colors.axis, fontSize: 10.5, fontFamily: 'JetBrains Mono' }}
                tickFormatter={(v: number) => f.money(v)}
              />
              <Tooltip
                cursor={{ fill: colors.grid, fillOpacity: 0.25 }}
                formatter={(value) => f.money(Number(value))}
                labelFormatter={(label, payload) => {
                  const name = (payload[0]?.payload as { name?: string } | undefined)?.name
                  const key = typeof label === 'string' ? label : ''
                  return name ? `${key} · ${name}` : key
                }}
                contentStyle={{ background: colors.surface, border: `1px solid ${colors.grid}`, borderRadius: 12, color: colors.text, fontSize: 12 }}
                itemStyle={{ color: colors.text }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.axis }} iconType="circle" />
              <Bar dataKey="planned" name={plannedLabel} fill={colors.tone.primary} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              <Bar dataKey="paid" name={paidLabel} fill={colors.tone.violet} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </figure>
      )}
    </Panel>
  )
}
