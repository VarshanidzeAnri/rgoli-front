import { ShieldOffIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState, Panel } from '@/components/kit'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  const { t } = useTranslation()
  return (
    <Panel className="mx-auto mt-10 max-w-xl">
      <EmptyState
        icon={ShieldOffIcon}
        title={t('errors.forbiddenTitle')}
        text={t('errors.forbiddenText')}
        action={
          <Button asChild variant="primary" size="sm">
            <Link to="/dashboard">{t('errors.goHome')}</Link>
          </Button>
        }
      />
    </Panel>
  )
}
