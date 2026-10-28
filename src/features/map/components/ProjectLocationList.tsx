import { MapPinIcon, PencilIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Can, DisciplinePill, StatusPill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { Project } from '@/types/api'

import { formatCoord } from '../projection'

export function ProjectLocationList({
  projects,
  selectedId,
  onSelect,
  onEdit,
}: {
  projects: Project[]
  selectedId: number | null
  onSelect: (id: number) => void
  onEdit: (project: Project) => void
}) {
  const { t } = useTranslation('map')
  return (
    <ul className="flex flex-col gap-2">
      {projects.map((project, index) => {
        const active = project.id === selectedId
        const hasCoords = project.lat !== null && project.lng !== null
        return (
          <li
            key={project.id}
            className={cn(
              'rounded-2xl border p-3 transition',
              active ? 'border-primary/50 bg-primary/8' : 'border-border/60 bg-secondary/20 hover:border-primary/30',
            )}
          >
            <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => onSelect(project.id)} aria-pressed={active}>
              <span
                className={cn(
                  'num flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/50 text-primary',
                )}
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{project.name}</span>
                <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{project.address}</span>
                <span className="num mt-1 flex items-center gap-1 text-[10.5px] text-muted-foreground">
                  <MapPinIcon className="size-3" aria-hidden />
                  {hasCoords && project.lat !== null && project.lng !== null
                    ? t('coords', { lat: formatCoord(project.lat), lng: formatCoord(project.lng) })
                    : t('list.noCoords')}
                </span>
              </span>
            </button>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-10">
              <StatusPill status={project.status} />
              <DisciplinePill discipline={project.discipline} />
              <Can permission="locations.update">
                <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => onEdit(project)}>
                  <PencilIcon />
                  {t('list.editLocation')}
                </Button>
              </Can>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
