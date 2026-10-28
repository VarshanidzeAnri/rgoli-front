import { FolderXIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can, ConfirmDialog, DisciplinePill, EmptyState, ErrorState, ListSkeleton, PageHero, Panel, Pill, StatusPill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/misc'
import { useDeleteProjectMutation, useGetProjectQuery } from '@/features/projects/api'
import { ActivityTab, FilesTab, TasksTab } from '@/features/projects/components/detail/ListTabs'
import { OverviewTab } from '@/features/projects/components/detail/OverviewTab'
import { PaymentsTab } from '@/features/projects/components/detail/PaymentsTab'
import { PhasesTab } from '@/features/projects/components/detail/PhasesTab'
import { useCan } from '@/hooks/useCan'
import { isApiError } from '@/store/api'
import { useAppDispatch } from '@/store'
import { openDialog } from '@/store/uiSlice'

function NotFound() {
  const { t } = useTranslation('projects')
  return (
    <Panel className="mx-auto mt-6 max-w-xl">
      <EmptyState
        icon={FolderXIcon}
        title={t('notFound.title')}
        text={t('notFound.text')}
        action={
          <Button asChild size="sm" variant="primary">
            <Link to="/projects">{t('notFound.back')}</Link>
          </Button>
        }
      />
    </Panel>
  )
}

export default function ProjectDetailPage() {
  const { t } = useTranslation(['projects', 'common'])
  const { id: rawId } = useParams()
  const id = Number(rawId)
  const valid = Number.isInteger(id) && id > 0
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const canFinance = useCan('finance.view')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: project, isLoading, isError, error, refetch } = useGetProjectQuery(id, { skip: !valid })
  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation()

  if (!valid || (isError && isApiError(error) && (error.status === 404 || error.status === 403))) return <NotFound />
  if (isError) {
    return (
      <Panel>
        <ErrorState onRetry={() => void refetch()} />
      </Panel>
    )
  }
  if (isLoading || !project) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-40 rounded-[28px]" />
        <ListSkeleton rows={5} />
      </div>
    )
  }

  const onDelete = async () => {
    const result = await deleteProject(project.id)
    setConfirmDelete(false)
    if ('error' in result) return
    toast.success(t('common:deleted'))
    void navigate('/projects', { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={project.key}
        title={project.name}
        subtitle={[project.client_name, project.address].filter(Boolean).join(' · ')}
        meta={
          <>
            <StatusPill status={project.status} />
            <DisciplinePill discipline={project.discipline} />
            {project.current_phase ? <Pill tone="muted">{project.current_phase.name}</Pill> : null}
            <Pill tone="primary">{`${project.progress}%`}</Pill>
          </>
        }
        actions={
          <>
            <Can permission="projects.update">
              <Button onClick={() => dispatch(openDialog({ kind: 'project', id: project.id }))}>
                <PencilIcon />
                {t('actions.edit')}
              </Button>
            </Can>
            <Can permission="projects.delete">
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2Icon />
                {t('actions.delete')}
              </Button>
            </Can>
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="phases">{t('tabs.phases')}</TabsTrigger>
          <TabsTrigger value="tasks">{t('tabs.tasks')}</TabsTrigger>
          <TabsTrigger value="files">{t('tabs.files')}</TabsTrigger>
          {canFinance ? <TabsTrigger value="payments">{t('tabs.payments')}</TabsTrigger> : null}
          <TabsTrigger value="activity">{t('tabs.activity')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab project={project} />
        </TabsContent>
        <TabsContent value="phases">
          <PhasesTab project={project} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="files">
          <FilesTab projectId={project.id} />
        </TabsContent>
        {canFinance ? (
          <TabsContent value="payments">
            <PaymentsTab projectId={project.id} />
          </TabsContent>
        ) : null}
        <TabsContent value="activity">
          <ActivityTab projectId={project.id} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        description={t('common:confirm.deleteText', { name: project.name })}
        onConfirm={() => void onDelete()}
        loading={deleting}
      />
    </div>
  )
}
