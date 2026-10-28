import { MapPinIcon, UsersIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Can, Panel, ProgressBar, UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { useFormat } from '@/hooks/useFormat'
import type { Project } from '@/types/api'

import { MembersDialog } from './MembersDialog'

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/20 p-3.5">
      <dt className="micro-label">{label}</dt>
      <dd className={`num mt-1.5 text-[17px] font-semibold ${tone ?? ''}`}>{value}</dd>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="micro-label w-36 shrink-0 pt-0.5">{label}</dt>
      <dd className="min-w-0 text-[13px] break-words">{children}</dd>
    </div>
  )
}

export function OverviewTab({ project }: { project: Project }) {
  const { t } = useTranslation('projects')
  const f = useFormat()
  const [membersOpen, setMembersOpen] = useState(false)
  const finance = project.finance
  const tasks = project.tasks ?? { total: 0, done: 0 }
  const paidPercent = finance && Number(finance.agreed_price) > 0 ? (Number(finance.paid) / Number(finance.agreed_price)) * 100 : 0
  const members = project.members ?? []

  return (
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-5">
        {finance ? (
          <Panel title={t('overview.finance')}>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label={t('overview.budget')} value={f.money(finance.budget)} />
              <Stat label={t('overview.discount')} value={finance.discount_price ? f.money(finance.discount_price) : '—'} />
              <Stat label={t('overview.paid')} value={f.money(finance.paid)} tone="text-success" />
              <Stat label={t('overview.remaining')} value={f.money(finance.remaining)} tone="text-warning" />
            </dl>
            <div className="mt-4">
              <ProgressBar value={paidPercent} variant="success" label={t('overview.paid')} />
              <p className="num mt-1.5 text-[11px] text-muted-foreground">{t('overview.paidShare', { value: Math.round(paidPercent) })}</p>
            </div>
          </Panel>
        ) : null}

        <Panel title={t('overview.progress')}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="micro-label">{t('overview.progress')}</p>
              <p className="num mt-1.5 text-2xl font-semibold">{project.progress}%</p>
              <ProgressBar value={project.progress} className="mt-2" label={t('overview.progress')} />
            </div>
            <div>
              <p className="micro-label">{t('overview.tasks')}</p>
              <p className="num mt-1.5 text-2xl font-semibold">{t('overview.tasksDone', { done: tasks.done, total: tasks.total })}</p>
              <ProgressBar value={tasks.total ? (tasks.done / tasks.total) * 100 : 0} variant="success" className="mt-2" label={t('overview.tasks')} />
            </div>
          </div>
        </Panel>

        <Panel title={t('overview.description')}>
          <p className="text-[13px] leading-relaxed whitespace-pre-line text-muted-foreground">
            {project.description ?? t('overview.noDescription')}
          </p>
        </Panel>
      </div>

      <div className="flex flex-col gap-5">
        <Panel title={t('overview.details')}>
          <dl className="divide-y divide-border/40">
            <Row label={t('overview.client')}>{project.client_name}</Row>
            {project.client_phone ? (
              <Row label={t('overview.phone')}>
                <a href={`tel:${project.client_phone}`} className="hover:text-primary">
                  {project.client_phone}
                </a>
              </Row>
            ) : null}
            {project.client_email ? (
              <Row label={t('overview.email')}>
                <a href={`mailto:${project.client_email}`} className="hover:text-primary">
                  {project.client_email}
                </a>
              </Row>
            ) : null}
            <Row label={t('overview.address')}>{project.address ?? '—'}</Row>
            <Row label={t('overview.currentPhase')}>{project.current_phase?.name ?? t('noPhase')}</Row>
            <Row label={t('overview.dates')}>
              <span className="num">
                {f.date(project.start_date)} — {f.date(project.end_date)}
              </span>
            </Row>
            <Row label={t('overview.coordinates')}>
              {project.lat !== null && project.lng !== null ? (
                <span className="num inline-flex items-center gap-1.5">
                  <MapPinIcon className="size-3.5 text-primary" aria-hidden />
                  {project.lat.toFixed(4)}, {project.lng.toFixed(4)}
                </span>
              ) : (
                <span className="text-muted-foreground">{t('overview.noCoordinates')}</span>
              )}
            </Row>
          </dl>
        </Panel>

        <Panel
          title={t('overview.members')}
          actions={
            <Can permission="projects.manage_members">
              <Button size="sm" onClick={() => setMembersOpen(true)}>
                <UsersIcon />
                {t('overview.manageMembers')}
              </Button>
            </Can>
          }
        >
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('overview.noMembers')}</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <UserAvatar user={m} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{m.name}</span>
                    {m.job_title ? <span className="block truncate text-[11px] text-muted-foreground">{m.job_title}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {membersOpen ? <MembersDialog project={project} onClose={() => setMembersOpen(false)} /> : null}
    </div>
  )
}
