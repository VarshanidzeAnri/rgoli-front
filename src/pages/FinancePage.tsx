import { useTranslation } from 'react-i18next'

import { PageHero } from '@/components/kit'

export default function FinancePage() {
  const { t } = useTranslation('nav')
  return <PageHero title={t('finance')} />
}
