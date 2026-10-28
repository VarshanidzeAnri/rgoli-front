import { useTranslation } from 'react-i18next'

import { PageHero } from '@/components/kit'

export default function TimelinePage() {
  const { t } = useTranslation('nav')
  return <PageHero title={t('timeline')} />
}
