import { ArchiveIcon, DownloadIcon, FileIcon, FileTextIcon, ImageIcon, PenToolIcon, Trash2Icon, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { useAuthorizedDownload, useAuthorizedObjectUrl } from '@/hooks/useAuthorized'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import { FILE_TYPE_TONE, type FileType } from '@/lib/enums'
import { TONE_CLASS } from '@/lib/tones'
import type { ProjectFile } from '@/types/api'

const ICONS: Record<FileType, LucideIcon> = {
  pdf: FileTextIcon,
  dwg: PenToolIcon,
  image: ImageIcon,
  doc: FileTextIcon,
  zip: ArchiveIcon,
  other: FileIcon,
}

function Preview({ file }: { file: ProjectFile }) {
  const { t } = useTranslation('files')
  const src = useAuthorizedObjectUrl(file.preview_url)
  if (!src) return <div className="h-32 animate-pulse rounded-xl bg-secondary/50" aria-hidden />
  return <img src={src} alt={t('card.preview', { name: file.original_name })} loading="lazy" className="h-32 w-full rounded-xl object-cover" />
}

export function FileCard({ file, onDelete }: { file: ProjectFile; onDelete: (file: ProjectFile) => void }) {
  const { t } = useTranslation(['files', 'enums'])
  const f = useFormat()
  const download = useAuthorizedDownload()
  const Icon = ICONS[file.type]

  return (
    <article className="flex flex-col gap-3 rounded-[22px] border border-border/70 bg-card/60 p-4 backdrop-blur-xl transition hover:border-primary/40">
      {file.type === 'image' && file.preview_url ? <Preview file={file} /> : null}
      <div className="flex items-start gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border', TONE_CLASS[FILE_TYPE_TONE[file.type]])}>
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium" title={file.original_name}>
            {file.original_name}
          </p>
          <p className="truncate text-[11.5px] text-muted-foreground">
            {file.project.key} · {file.project.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {file.uploader ? <UserAvatar user={file.uploader} size="xs" /> : null}
        <span className="truncate">{file.uploader ? t('card.uploadedBy', { name: file.uploader.name }) : t(`enums:file_type.${file.type}`)}</span>
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-border/50 pt-3">
        <span className="num text-[10.5px] text-muted-foreground">
          {f.bytes(file.size_bytes)} · {f.date(file.created_at)}
        </span>
        <span className="ml-auto flex gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('card.download', { name: file.original_name })}
            onClick={() => void download(file.download_url, file.original_name)}
          >
            <DownloadIcon />
          </Button>
          {file.can_delete ? (
            <Button size="icon-sm" variant="ghost" aria-label={t('card.delete', { name: file.original_name })} onClick={() => onDelete(file)}>
              <Trash2Icon />
            </Button>
          ) : null}
        </span>
      </div>
    </article>
  )
}
