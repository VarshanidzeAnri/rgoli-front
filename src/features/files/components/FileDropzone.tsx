import { CheckCircle2Icon, UploadCloudIcon, XCircleIcon, XIcon } from 'lucide-react'
import { useId, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Field, ProgressBar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetProjectsQuery } from '@/features/projects/api'
import { useGetConfigQuery } from '@/features/workspace/api'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import { useFieldError } from '@/lib/forms'
import { useAppSelector } from '@/store'
import { isApiError } from '@/store/api'
import { selectUploads } from '@/store/uiSlice'

import { useUploadFilesMutation } from '../api'
import { newUploadId, validateFiles } from '../validate'

/** Drag & drop multi-upload with project select, client-side checks and live progress. */
export function FileDropzone({ projectId: initialProjectId, onUploaded }: { projectId?: number; onUploaded?: () => void }) {
  const { t } = useTranslation(['files', 'common'])
  const f = useFormat()
  const fieldError = useFieldError()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: config } = useGetConfigQuery()
  const { data: projects } = useGetProjectsQuery({ per_page: 100 })
  const uploads = useAppSelector(selectUploads)
  const [upload] = useUploadFilesMutation()
  const [projectId, setProjectId] = useState<number | null>(initialProjectId ?? null)
  const [files, setFiles] = useState<File[]>([])
  const [problems, setProblems] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)

  const limits = config?.uploads
  const maxSize = limits ? f.bytes(limits.max_kb * 1024) : ''

  const addFiles = (incoming: File[]) => {
    const issues = validateFiles(incoming, limits)
    const bad = new Set(issues.map((i) => i.name))
    setProblems(issues.map((i) => fieldError(`validation:${i.kind}`, { name: i.name, max: maxSize }) ?? ''))
    const next = [...files, ...incoming.filter((file) => !bad.has(file.name))]
    if (limits && next.length > limits.max_files) {
      setProblems((p) => [...p, t('upload.tooMany', { max: limits.max_files })])
      setFiles(next.slice(0, limits.max_files))
    } else {
      setFiles(next)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const start = async () => {
    if (!projectId) {
      setProblems([t('upload.projectRequired')])
      return
    }
    const result = await upload({ uploadId: newUploadId(), projectId, files })
    if ('error' in result) {
      const messages = isApiError(result.error) ? Object.values(result.error.fieldErrors) : []
      setProblems(messages.length > 0 ? messages : [t('upload.failed')])
      return
    }
    toast.success(t('common:saved'))
    setFiles([])
    setProblems([])
    onUploaded?.()
  }

  const progressRows = Object.entries(uploads)

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('upload.project')}>
        <Select value={projectId ? String(projectId) : ''} onValueChange={(v) => setProjectId(Number(v))}>
          <SelectTrigger>
            <SelectValue placeholder={t('upload.selectProject')} />
          </SelectTrigger>
          <SelectContent>
            {projects?.data.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.key} · {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed px-6 py-8 text-center transition',
          dragging ? 'border-primary bg-primary/10' : 'border-border bg-secondary/20',
        )}
      >
        <UploadCloudIcon className="size-7 text-primary" aria-hidden />
        <p className="text-[13px]">
          {t('upload.drop')} {t('upload.or')}{' '}
          <label htmlFor={inputId} className="cursor-pointer text-primary underline-offset-4 hover:underline">
            {t('upload.browse')}
          </label>
        </p>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          accept={limits?.extensions.map((e) => `.${e}`).join(',')}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
        {limits ? (
          <p className="text-[11px] text-muted-foreground">
            {t('upload.limits', { size: maxSize, count: limits.max_files })}
            <br />
            {t('upload.types', { list: limits.extensions.join(', ') })}
          </p>
        ) : null}
      </div>

      {problems.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11.5px] text-destructive">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="micro-label">{t('upload.selected', { count: files.length })}</p>
          <ul className="flex flex-col gap-1.5">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/30 px-3 py-1.5 text-[12px]">
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="num text-[10.5px] text-muted-foreground">{f.bytes(file.size)}</span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t('upload.remove', { name: file.name })}
                  onClick={() => setFiles((list) => list.filter((_, i) => i !== index))}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="primary" className="self-end" onClick={() => void start()}>
            {t('upload.start')}
          </Button>
        </div>
      ) : null}

      {progressRows.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {progressRows.map(([id, row]) => (
            <li key={id} className="rounded-xl border border-border/60 px-3 py-2">
              <div className="mb-1.5 flex items-center gap-2 text-[11.5px]">
                {row.status === 'done' ? (
                  <CheckCircle2Icon className="size-3.5 text-success" aria-hidden />
                ) : row.status === 'error' ? (
                  <XCircleIcon className="size-3.5 text-destructive" aria-hidden />
                ) : null}
                <span className="min-w-0 flex-1 truncate">{row.name}</span>
                <span className="text-muted-foreground">
                  {row.status === 'done' ? t('upload.done') : row.status === 'error' ? t('upload.failed') : t('upload.uploading', { progress: row.progress })}
                </span>
              </div>
              <ProgressBar
                value={row.progress}
                variant={row.status === 'error' ? 'warning' : row.status === 'done' ? 'success' : 'primary'}
                label={t('upload.progressLabel', { name: row.name })}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
