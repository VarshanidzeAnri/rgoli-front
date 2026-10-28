import { ExternalLinkIcon, MapIcon } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { EmptyState, ErrorState, ListSkeleton, PageHero, Panel, Pill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { LocationDialog } from '@/features/map/components/LocationDialog'
import { ProjectLocationList } from '@/features/map/components/ProjectLocationList'
import { RadarMap } from '@/features/map/components/RadarMap'
import { googleEmbedUrl, googleMapsUrl, locatedProjects } from '@/features/map/projection'
import { useGetMapProjectsQuery, useUpdateLocationMutation } from '@/features/projects/api'
import { useCan } from '@/hooks/useCan'
import { cn } from '@/lib/cn'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectMap, selectMapProject, setMapMode, type MapMode } from '@/store/uiSlice'
import type { Project } from '@/types/api'

const LeafletMap = lazy(() => import('@/features/map/components/LeafletMap'))

const MODES: MapMode[] = ['offline', 'osm', 'google']

export default function MapPage() {
  const { t } = useTranslation(['map', 'nav'])
  const dispatch = useAppDispatch()
  const { mode, selectedProjectId } = useAppSelector(selectMap)
  const canUpdate = useCan('locations.update')
  const { data: projects = [], isLoading, isError, refetch } = useGetMapProjectsQuery()
  const [updateLocation] = useUpdateLocationMutation()
  const [editing, setEditing] = useState<Project | null>(null)

  const items = locatedProjects(projects)
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null
  const selectedItem = items.find((i) => i.project.id === selectedProjectId) ?? items[0] ?? null
  const select = (id: number) => dispatch(selectMapProject(id))

  const pick = async (lat: number, lng: number) => {
    if (!selectedProject) {
      toast.info(t('selectFirst'))
      return
    }
    const result = await updateLocation({ id: selectedProject.id, lat, lng })
    if (!('error' in result)) toast.success(t('locationSaved'))
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('nav:map')}
        subtitle={t('subtitle')}
        meta={<Pill tone="primary">{t('list.located', { count: items.length })}</Pill>}
        actions={
          selectedItem ? (
            <Button asChild variant="outline">
              <a href={googleMapsUrl(selectedItem.lat, selectedItem.lng)} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon />
                {t('openInGoogle')}
              </a>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Panel title={t('list.title')} bodyClassName="max-h-[640px] overflow-y-auto">
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : projects.length === 0 ? (
            <EmptyState icon={MapIcon} title={t('empty.title')} text={t('empty.text')} />
          ) : (
            <ProjectLocationList projects={projects} selectedId={selectedProjectId} onSelect={select} onEdit={setEditing} />
          )}
        </Panel>

        <Panel
          title={t(`modes.${mode}`)}
          actions={
            <div role="radiogroup" aria-label={t('modes.label')} className="flex rounded-full border border-border/70 bg-secondary/30 p-0.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => dispatch(setMapMode(m))}
                  className={cn(
                    'h-7 rounded-full px-3 text-[11.5px] transition',
                    mode === m ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`modes.${m}`)}
                </button>
              ))}
            </div>
          }
        >
          {mode === 'osm' && canUpdate ? (
            <p className="mb-3 text-[11.5px] text-muted-foreground">
              {selectedProject ? t('clickToSet', { name: selectedProject.name }) : t('selectFirst')}
            </p>
          ) : null}

          {mode === 'offline' ? (
            <div className="mx-auto max-w-[560px]">
              <RadarMap items={items} selectedId={selectedProjectId} onSelect={select} />
            </div>
          ) : null}

          {mode === 'osm' ? (
            <Suspense fallback={<Skeleton className="h-[520px]" />}>
              <LeafletMap
                items={items}
                selectedId={selectedProjectId}
                onSelect={select}
                onPick={canUpdate ? (lat, lng) => void pick(lat, lng) : undefined}
              />
            </Suspense>
          ) : null}

          {mode === 'google' ? (
            selectedItem ? (
              <iframe
                title={t('googleTitle', { name: selectedItem.project.name })}
                src={googleEmbedUrl(selectedItem.lat, selectedItem.lng)}
                className="h-[520px] w-full rounded-[20px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <EmptyState icon={MapIcon} title={t('empty.title')} text={t('empty.text')} />
            )
          ) : null}
        </Panel>
      </div>

      {editing ? <LocationDialog project={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  )
}
