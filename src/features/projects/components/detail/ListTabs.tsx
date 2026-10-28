import { DownloadIcon, PlusIcon, UploadIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Can, EmptyState, ErrorState, ListSkeleton, Panel, Pill, UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { ActivityList, IssueRow } from '@/features/dashboard'
import { useGetFilesQuery } from '@/features/files/api'
import { useGetIssuesQuery } from '@/features/issues/api'
import { useAuthorizedDownload } from '@/hooks/useAuthorized'
import { useFormat } from '@/hooks/useFormat'
import { FILE_TYPE_TONE } from '@/lib/enums'
import { useAppDispatch } from '@/store'
import { openDialog } from '@/store/uiSlice'

import { useGetProjectActivityQuery } from '../../api'

export function TasksTab({ projectId }: { projectId: number }) {
  const { t } = useTranslation('projects')
  const dispatch = useAppDispatch()
  const { data, isLoading, isError, refetch } = useGetIssuesQuery({ project_id: projectId, per_page: 100, sort: 'position' })

  return (
    <Panel
      title={t('tasks.title')}
      actions={
        <Can permission="issues.create">
          <Button size="sm" variant="primary" onClick={() => dispatch(openDialog({ kind: 'issue', projectId }))}>
            <PlusIcon />
            {t('tasks.add')}
          </Button>
        </Can>
      }
    >
      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('tasks.empty')} text="" />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.data.map((issue) => (
            <li key={issue.id}>
              <IssueRow issue={issue} showProject={false} showStatus />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function FilesTab({ projectId }: { projectId: number }) {
  const { t } = useTranslation(['projects', 'enums'])
  const f = useFormat()
  const dispatch = useAppDispatch()
  const download = useAuthorizedDownload()
  const { data, isLoading, isError, refetch } = useGetFilesQuery({ project_id: projectId })

  return (
    <Panel
      title={t('files.title')}
      actions={
        <Can permission="files.upload">
          <Button size="sm" variant="primary" onClick={() => dispatch(openDialog({ kind: 'file', projectId }))}>
            <UploadIcon />
            {t('files.upload')}
          </Button>
        </Can>
      }
    >
      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('files.empty')} text="" />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.data.map((file) => (
            <li key={file.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/50 bg-secondary/20 px-3.5 py-2.5">
              <Pill tone={FILE_TYPE_TONE[file.type]}>{t(`enums:file_type.${file.type}`)}</Pill>
              <span className="min-w-0 flex-1 truncate text-[13px]">{file.original_name}</span>
              {file.uploader ? <UserAvatar user={file.uploader} size="xs" /> : null}
              <span className="num text-[11px] text-muted-foreground">{f.bytes(file.size_bytes)}</span>
              <span className="num text-[11px] text-muted-foreground">{f.date(file.created_at)}</span>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => void download(file.download_url, file.original_name)}
                aria-label={t('files.download', { name: file.original_name })}
              >
                <DownloadIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function ActivityTab({ projectId }: { projectId: number }) {
  const { t } = useTranslation('projects')
  const { data, isLoading, isError, refetch } = useGetProjectActivityQuery({ id: projectId })
  return (
    <Panel title={t('activity.title')}>
      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('activity.empty')} text="" />
      ) : (
        <ActivityList items={data.data} showProject={false} />
      )}
    </Panel>
  )
}
