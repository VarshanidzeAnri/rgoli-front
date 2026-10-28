import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can, ConfirmDialog, DatePicker, ErrorState, Field, OptionSelect, PriorityPill, StatusPill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useDeleteIssueMutation, useGetIssueQuery, useMoveIssueMutation, useUpdateIssueMutation } from '@/features/issues/api'
import { useCan } from '@/hooks/useCan'
import { useFormat } from '@/hooks/useFormat'
import { isOverdue } from '@/lib/format'
import { PRIORITIES, STATUSES, type Priority, type Status } from '@/lib/enums'

import { AssigneePicker } from './AssigneePicker'
import { IssueComments } from './IssueComments'
import IssueFormDialog from './IssueFormDialog'

/** Points field that saves on blur (1–100); resets to the saved value when invalid. */
function PointsInput({ points, disabled, onCommit }: { points: number; disabled: boolean; onCommit: (points: number) => void }) {
  const [value, setValue] = useState(String(points))
  return (
    <Input
      type="number"
      min={1}
      max={100}
      value={value}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const next = Number(value)
        if (Number.isInteger(next) && next >= 1 && next <= 100 && next !== points) onCommit(next)
        else setValue(String(points))
      }}
    />
  )
}

const isStatus = (v: string): v is Status => (STATUSES as readonly string[]).includes(v)
const isPriority = (v: string): v is Priority => (PRIORITIES as readonly string[]).includes(v)

/**
 * Task details in a side sheet: quick edits (priority, due date, points, assignees),
 * status change, full edit dialog, delete and comments.
 */
export function IssueDrawer({ issueId, onClose }: { issueId: number | null; onClose: () => void }) {
  const { t } = useTranslation(['board', 'common', 'enums'])
  const f = useFormat()
  const statusOptions = useMemo(() => STATUSES.map((s) => ({ value: s, label: t(`enums:status.${s}`) })), [t])
  const priorityOptions = useMemo(() => PRIORITIES.map((p) => ({ value: p, label: t(`enums:priority.${p}`) })), [t])
  const canUpdate = useCan('issues.update')
  const canMove = useCan('issues.move')
  const { data: issue, isLoading, isError, refetch } = useGetIssueQuery(issueId ?? 0, { skip: issueId === null })
  const [updateIssue] = useUpdateIssueMutation()
  const [moveIssue] = useMoveIssueMutation()
  const [deleteIssue, deleteState] = useDeleteIssueMutation()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const quickEdit = async (patch: Parameters<typeof updateIssue>[0]) => {
    const result = await updateIssue(patch)
    if (!('error' in result)) toast.success(t('issue.saved'))
  }

  return (
    <Sheet open={issueId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[min(100vw,34rem)] overflow-y-auto">
        {isLoading || !issue ? (
          <div className="flex flex-col gap-3 p-6">
            <SheetTitle className="sr-only">{t('issue.eyebrow')}</SheetTitle>
            <SheetDescription className="sr-only">{t('issue.details')}</SheetDescription>
            {isError ? <ErrorState message={t('issue.notFound')} onRetry={() => void refetch()} /> : <Skeleton className="h-40" />}
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6">
            <header className="pr-8">
              <p className="micro-label flex items-center gap-2">
                <span className="text-primary">{issue.key}</span>
                <span aria-hidden>·</span>
                <Link to={`/projects/${issue.project.id}`} className="hover:text-primary">
                  {issue.project.name}
                </Link>
              </p>
              <SheetTitle className="mt-2 text-lg font-semibold">{issue.title}</SheetTitle>
              <SheetDescription className="sr-only">{t('issue.details')}</SheetDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill status={issue.status} />
                <PriorityPill priority={issue.priority} />
              </div>
            </header>

            {issue.description ? <p className="text-[13px] whitespace-pre-wrap text-muted-foreground">{issue.description}</p> : null}

            <section className="grid gap-4 sm:grid-cols-2" aria-label={t('issue.details')}>
              <Field label={t('issue.moveTo')}>
                <OptionSelect
                  value={issue.status}
                  disabled={!canMove}
                  options={statusOptions}
                  onChange={(v) => {
                    if (v && isStatus(v) && v !== issue.status) void moveIssue({ id: issue.id, status: v, after_id: null })
                  }}
                />
              </Field>
              <Field label={t('common:fields.priority')}>
                <OptionSelect
                  value={issue.priority}
                  disabled={!canUpdate}
                  options={priorityOptions}
                  onChange={(v) => {
                    if (v && isPriority(v) && v !== issue.priority) void quickEdit({ id: issue.id, priority: v })
                  }}
                />
              </Field>
              <Field label={t('common:fields.dueDate')} hint={isOverdue(issue.due_date) && issue.status !== 'done' ? t('common:overdue') : undefined}>
                <DatePicker
                  value={issue.due_date}
                  disabled={!canUpdate}
                  clearable
                  onChange={(due_date) => void quickEdit({ id: issue.id, due_date })}
                />
              </Field>
              <Field label={t('common:fields.points')}>
                <PointsInput
                  key={`${issue.id}:${issue.points}`}
                  points={issue.points}
                  disabled={!canUpdate}
                  onCommit={(points) => void quickEdit({ id: issue.id, points })}
                />
              </Field>
              <Field label={t('common:fields.assignees')} className="sm:col-span-2">
                <AssigneePicker
                  disabled={!canUpdate}
                  value={issue.assignees?.map((a) => a.id) ?? []}
                  onChange={(assignee_ids) => void quickEdit({ id: issue.id, assignee_ids })}
                />
              </Field>
            </section>

            {issue.created_at ? <p className="text-[11px] text-muted-foreground">{t('issue.created_at', { date: f.date(issue.created_at) })}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Can permission="issues.update">
                <Button size="sm" onClick={() => setEditOpen(true)}>
                  <PencilIcon />
                  {t('issue.edit')}
                </Button>
              </Can>
              <Can permission="issues.delete">
                <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
                  <Trash2Icon />
                  {t('common:actions.delete')}
                </Button>
              </Can>
            </div>

            <IssueComments issueId={issue.id} />

            {editOpen ? <IssueFormDialog open id={issue.id} onClose={() => setEditOpen(false)} /> : null}
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              description={t('common:confirm.deleteText', { name: issue.title })}
              loading={deleteState.isLoading}
              onConfirm={() =>
                void deleteIssue(issue.id).then((r) => {
                  if (!('error' in r)) {
                    toast.success(t('issue.deleted'))
                    setConfirmOpen(false)
                    onClose()
                  }
                })
              }
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
