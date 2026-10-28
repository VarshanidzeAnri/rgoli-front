import { useTranslation } from 'react-i18next'

import { PageHero } from '@/components/kit'

export default function BacklogPage() {
  const { t } = useTranslation('nav')
  return <PageHero title={t('backlog')} />
}
