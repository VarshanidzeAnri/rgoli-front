import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can, UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetCommentsQuery,
  useUpdateCommentMutation,
} from '@/features/issues/api'
import { useFormat } from '@/hooks/useFormat'
import type { Comment } from '@/types/api'

function CommentItem({ comment, issueId }: { comment: Comment; issueId: number }) {
  const { t } = useTranslation(['board', 'common'])
  const f = useFormat()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(comment.body)
  const [update, updateState] = useUpdateCommentMutation()
  const [remove] = useDeleteCommentMutation()

  const save = async () => {
    if (!body.trim()) return
    const result = await update({ id: comment.id, issueId, body: body.trim() })
    if (!('error' in result)) {
      setEditing(false)
      toast.success(t('common:saved'))
    }
  }

  return (
    <li className="flex gap-3">
      {comment.user ? <UserAvatar user={comment.user} size="sm" /> : null}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="text-[12.5px] font-medium">{comment.user?.name}</span>
          {comment.created_at ? <span className="text-[10.5px] text-muted-foreground">{f.relative(comment.created_at)}</span> : null}
        </p>
        {editing ? (
          <div className="mt-1.5 flex flex-col gap-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} aria-label={t('comments.editLabel')} />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                {t('common:actions.cancel')}
              </Button>
              <Button size="sm" variant="primary" disabled={updateState.isLoading} onClick={() => void save()}>
                {t('common:actions.save')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-[13px] whitespace-pre-wrap">{comment.body}</p>
        )}
      </div>
      {comment.can_edit && !editing ? (
        <div className="flex shrink-0 gap-0.5">
          <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)} aria-label={t('comments.edit')}>
            <PencilIcon />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('comments.delete')}
            onClick={() =>
              void remove({ id: comment.id, issueId }).then((r) => {
                if (!('error' in r)) toast.success(t('comments.deleted'))
              })
            }
          >
            <Trash2Icon />
          </Button>
        </div>
      ) : null}
    </li>
  )
}

export function IssueComments({ issueId }: { issueId: number }) {
  const { t } = useTranslation(['board', 'common'])
  const { data, isLoading } = useGetCommentsQuery(issueId)
  const [add, addState] = useAddCommentMutation()
  const [body, setBody] = useState('')

  const submit = async () => {
    if (!body.trim()) return
    const result = await add({ issueId, body: body.trim() })
    if (!('error' in result)) {
      setBody('')
      toast.success(t('comments.added'))
    }
  }

  return (
    <section aria-label={t('comments.title')} className="flex flex-col gap-4">
      <h3 className="micro-label">{t('comments.title')}</h3>
      <Can permission="issues.comment">
        <div className="flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('comments.placeholder')}
            aria-label={t('comments.label')}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void submit()
            }}
          />
          <Button size="sm" variant="primary" className="self-end" disabled={addState.isLoading || !body.trim()} onClick={() => void submit()}>
            {t('comments.add')}
          </Button>
        </div>
      </Can>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">{t('common:loading')}</p>
      ) : data && data.data.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {data.data.map((c) => (
            <CommentItem key={c.id} comment={c} issueId={issueId} />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{t('comments.empty')}</p>
      )}
    </section>
  )
}
