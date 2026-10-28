import { PlusIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Can, PageHero, Panel } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { BoardFilters, BoardView } from '@/features/board'
import type { IssueListParams } from '@/features/issues/api'
import { IssueDrawer } from '@/features/issues/components/IssueDrawer'
import { useAppDispatch, useAppSelector } from '@/store'
import { openDialog, selectBoardFilters } from '@/store/uiSlice'

export default function BoardPage() {
  const { t } = useTranslation(['board', 'nav', 'common'])
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectBoardFilters)
  const [searchParams, setSearchParams] = useSearchParams()
  const issueParam = Number(searchParams.get('issue'))
  const openIssueId = Number.isInteger(issueParam) && issueParam > 0 ? issueParam : null

  const params = useMemo<IssueListParams>(
    () => ({
      project_id: filters.projectId,
      assignee: filters.onlyMine ? null : filters.assigneeId,
      mine: filters.onlyMine,
    }),
    [filters],
  )

  const setIssue = (id: number | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (id === null) next.delete('issue')
        else next.set('issue', String(id))
        return next
      },
      { replace: id === null },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('nav:board')}
        subtitle={t('subtitle')}
        actions={
          <Can permission="issues.create">
            <Button variant="primary" onClick={() => dispatch(openDialog({ kind: 'issue', projectId: filters.projectId ?? undefined }))}>
              <PlusIcon />
              {t('common:quickAdd.issue')}
            </Button>
          </Can>
        }
      />
      <Panel bodyClassName="py-4">
        <BoardFilters />
      </Panel>
      <BoardView params={params} onOpen={setIssue} />
      <IssueDrawer issueId={openIssueId} onClose={() => setIssue(null)} />
    </div>
  )
}
