import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'

/** Confirmation for destructive actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description: ReactNode
  confirmLabel?: ReactNode
  onConfirm: () => void
  loading?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" role="alertdialog">
        <DialogHeader title={title ?? t('confirm.title')} />
        <DialogBody>
          <p className="text-[13px] text-muted-foreground">{description}</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {confirmLabel ?? t('confirm.deleteAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
