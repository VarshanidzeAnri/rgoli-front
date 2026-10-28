import { FileIcon, FolderKanbanIcon, SearchIcon, SquareCheckIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import { StatusPill } from '@/components/kit'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useSearchQuery } from '@/features/workspace/api'
import { useDebounced } from '@/hooks/useDebounced'
import { cn } from '@/lib/cn'
import type { Status } from '@/lib/enums'
import { useAppDispatch, useAppSelector } from '@/store'
import { setCommandPaletteOpen } from '@/store/uiSlice'

interface ResultItem {
  key: string
  group: 'projects' | 'issues' | 'files'
  title: string
  subtitle: string
  to: string
  status?: Status
}

const ICONS = { projects: FolderKanbanIcon, issues: SquareCheckIcon, files: FileIcon }

/** Global search (Ctrl/⌘+K). Server search over visible projects, tasks and files. */
export function CommandPalette() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const open = useAppSelector((s) => s.ui.commandPaletteOpen)
  const [term, setTerm] = useState('')
  const [active, setActive] = useState(0)
  const debounced = useDebounced(term.trim(), 250)
  const { data, isFetching } = useSearchQuery(debounced, { skip: !open || debounced.length < 2 })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        dispatch(setCommandPaletteOpen(true))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const items = useMemo<ResultItem[]>(() => {
    if (!data || debounced.length < 2) return []
    return [
      ...data.projects.map((p) => ({ key: `p${p.id}`, group: 'projects' as const, title: p.name, subtitle: `${p.key} · ${p.client_name}`, to: `/projects/${p.id}`, status: p.status })),
      ...data.issues.map((i) => ({ key: `i${i.id}`, group: 'issues' as const, title: i.title, subtitle: `${i.key} · ${i.project}`, to: `/board?issue=${i.id}`, status: i.status })),
      ...data.files.map((f) => ({ key: `f${f.id}`, group: 'files' as const, title: f.name, subtitle: f.project, to: `/files?search=${encodeURIComponent(f.name)}` })),
    ]
  }, [data, debounced])

  const close = () => {
    dispatch(setCommandPaletteOpen(false))
    setTerm('')
    setActive(0)
  }

  const go = (item: ResultItem | undefined) => {
    if (!item) return
    close()
    void navigate(item.to)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? dispatch(setCommandPaletteOpen(true)) : close())}>
      <DialogContent size="lg" className="top-[12vh] translate-y-0" aria-label={t('search.label')} aria-describedby={undefined}>
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4 pr-12">
          <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
          <input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, items.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter') {
                go(items[active])
              }
            }}
            placeholder={t('search.placeholder')}
            aria-label={t('search.label')}
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="command-results"
            className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <div id="command-results" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {debounced.length < 2 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">{t('search.hint')}</p>
          ) : !isFetching && items.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">{t('noResults')}</p>
          ) : (
            (['projects', 'issues', 'files'] as const).map((group) => {
              const groupItems = items.filter((i) => i.group === group)
              if (groupItems.length === 0) return null
              const Icon = ICONS[group]
              return (
                <div key={group} className="mb-2">
                  <p className="micro-label px-3 py-1.5">{t(`search.groups.${group}`)}</p>
                  {groupItems.map((item) => {
                    const index = items.indexOf(item)
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="option"
                        aria-selected={index === active}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(item)}
                        className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left', index === active && 'bg-secondary/70')}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px]">{item.title}</span>
                          <span className="block truncate font-mono text-[10.5px] text-muted-foreground">{item.subtitle}</span>
                        </span>
                        {item.status ? <StatusPill status={item.status} /> : null}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
