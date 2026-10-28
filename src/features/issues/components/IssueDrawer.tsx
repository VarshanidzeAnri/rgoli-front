import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can, ConfirmDialog, ErrorState, PriorityPill, StatusPill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input, NativeSelect } from '@/components/ui/input'
import { Label, Skeleton } from '@/components/ui/misc'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useDeleteIssueMutation, useGetIssueQuery, useMoveIssueMutation, useUpdateIssueMutation } from '@/features/issues/api'
import { useCan } from '@/hooks/useCan'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import { isOverdue } from '@/lib/format'
import { PRIORITIES, STATUSES, type Priority, type Status } from '@/lib/enums'

import { AssigneePicker } from './AssigneePicker'
import { IssueComments } from './IssueComments'
import IssueFormDialog from './IssueFormDialog'

/** Points field that saves on blur (1–100); resets to the saved value when invalid. */
function PointsInput({ id, points, disabled, onCommit }: { id: string; points: number; disabled: boolean; onCommit: (points: number) => void }) {
  const [value, setValue] = useState(String(points))
  return (
    <Input
      id={id}
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
  const ids = { status: useId(), priority: useId(), due: useId(), points: useId(), assignees: useId() }
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={ids.status}>{t('issue.moveTo')}</Label>
                <NativeSelect
                  id={ids.status}
                  value={issue.status}
                  disabled={!canMove}
                  onChange={(e) => {
                    if (isStatus(e.target.value)) void moveIssue({ id: issue.id, status: e.target.value, after_id: null })
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`enums:status.${s}`)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={ids.priority}>{t('common:fields.priority')}</Label>
                <NativeSelect
                  id={ids.priority}
                  value={issue.priority}
                  disabled={!canUpdate}
                  onChange={(e) => {
                    if (isPriority(e.target.value)) void quickEdit({ id: issue.id, priority: e.target.value })
                  }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`enums:priority.${p}`)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={ids.due}>{t('common:fields.dueDate')}</Label>
                <div className="relative">
                  <Input
                    id={ids.due}
                    type="date"
                    value={issue.due_date ?? ''}
                    disabled={!canUpdate}
                    className={cn(isOverdue(issue.due_date) && issue.status !== 'done' && 'text-destructive')}
                    onChange={(e) => void quickEdit({ id: issue.id, due_date: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={ids.points}>{t('common:fields.points')}</Label>
                <PointsInput
                  key={`${issue.id}:${issue.points}`}
                  id={ids.points}
                  points={issue.points}
                  disabled={!canUpdate}
                  onCommit={(points) => void quickEdit({ id: issue.id, points })}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label id={ids.assignees}>{t('common:fields.assignees')}</Label>
                <AssigneePicker
                  labelledBy={ids.assignees}
                  disabled={!canUpdate}
                  value={issue.assignees?.map((a) => a.id) ?? []}
                  onChange={(assignee_ids) => void quickEdit({ id: issue.id, assignee_ids })}
                />
              </div>
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
          </