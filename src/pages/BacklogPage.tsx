import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import { PageHero } from '@/components/kit'
import { BacklogView } from '@/features/backlog'
import { IssueDrawer } from '@/features/issues/components/IssueDrawer'

export default function BacklogPage() {
  const { t } = useTranslation(['backlog', 'nav'])
  const [searchParams, setSearchParams] = useSearchParams()
  const issueParam = Number(searchParams.get('issue'))
  const openIssueId = Number.isInteger(issueParam) && issueParam > 0 ? issueParam : null

  const setIssue = (id: number | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id === null) next.delete('issue')
      else next.set('issue', String(id))
      return next
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHero eyebrow={t('eyebrow')} title={t('nav:backlog')} subtitle={t('subtitle')} />
      <BacklogView onOpen={setIssue} />
      <IssueDrawer issueId={openIssueId} onClose={() => setIssue(null)} />
    </div>
  )
}
