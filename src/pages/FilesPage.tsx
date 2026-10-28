import { FolderOpenIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can, CardsSkeleton, ConfirmDialog, EmptyState, ErrorState, PageHero, Pagination, Panel, Pill } from '@/components/kit'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDeleteFileMutation, useGetFilesQuery } from '@/features/files/api'
import { FileCard } from '@/features/files/components/FileCard'
import { FileDropzone } from '@/features/files/components/FileDropzone'
import { useGetProjectsQuery } from '@/features/projects/api'
import { useDebounced } from '@/hooks/useDebounced'
import { FILE_TYPES, type FileType } from '@/lib/enums'
import type { ProjectFile } from '@/types/api'

const ALL = 'all'

export default function FilesPage() {
  const { t } = useTranslation(['files', 'nav', 'enums', 'common'])
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [type, setType] = useState<FileType | ''>('')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<ProjectFile | null>(null)
  const debounced = useDebounced(search.trim(), 300)

  const { data, isLoading, isError, refetch } = useGetFilesQuery({ search: debounced, type, project_id: projectId, page })
  const { data: projects } = useGetProjectsQuery({ per_page: 100 })
  const [remove, { isLoading: removing }] = useDeleteFileMutation()

  const confirmDelete = async () => {
    if (!deleting) return
    const result = await remove(deleting.id)
    if (!('error' in result)) toast.success(t('deleted'))
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('nav:files')}
        subtitle={t('subtitle')}
        meta={data ? <Pill tone="primary">{t('common:counts.files', { count: data.meta.total })}</Pill> : null}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                  if (params.has('search')) setParams({}, { replace: true })
                }}
                placeholder={t('filters.search')}
                aria-label={t('filters.search')}
                className="pl-9"
              />
            </div>
            <Select
              value={type || ALL}
              onValueChange={(v) => {
                setType(v === ALL ? '' : (v as FileType))
                setPage(1)
              }}
            >
              <SelectTrigger className="sm:w-44" aria-label={t('filters.type')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('filters.allTypes')}</SelectItem>
                {FILE_TYPES.map((ft) => (
                  <SelectItem key={ft} value={ft}>
                    {t(`enums:file_type.${ft}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={projectId ? String(projectId) : ALL}
              onValueChange={(v) => {
                setProjectId(v === ALL ? null : Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="sm:w-56" aria-label={t('filters.project')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('filters.allProjects')}</SelectItem>
                {projects?.data.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.key} · {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <CardsSkeleton count={6} className="sm:grid-cols-2 lg:grid-cols-3" />
          ) : isError ? (
            <Panel>
              <ErrorState onRetry={() => void refetch()} />
            </Panel>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.data.map((file) => (
                  <FileCard key={file.id} file={file} onDelete={setDeleting} />
                ))}
              </div>
              <Pagination meta={data.meta} onPage={setPage} />
            </>
          ) : (
            <Panel>
              <EmptyState icon={FolderOpenIcon} title={t('empty.title')} text={t('empty.text')} />
            </Panel>
          )}
        </div>

        <Can permission="files.upload">
          <Panel title={t('upload.title')} className="h-fit xl:sticky xl:top-[80px]">
            <FileDropzone projectId={projectId ?? undefined} />
          </Panel>
        </Can>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        description={t('common:confirm.deleteText', { name: deleting?.original_name ?? '' })}
        onConfirm={() => void confirmDelete()}
        loading={removing}
      />
    </div>
  )
}
