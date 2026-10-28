import { useTranslation } from 'react-i18next'

import { PageHero } from '@/components/kit'
import { CalendarView } from '@/features/calendar'

export default function CalendarPage() {
  const { t } = useTranslation(['calendar', 'nav'])
  return (
    <div className="flex flex-col gap-5">
      <PageHero eyebrow={t('eyebrow')} title={t('nav:calendar')} subtitle={t('subtitle')} />
      <CalendarView />
    </div>
  )
}
