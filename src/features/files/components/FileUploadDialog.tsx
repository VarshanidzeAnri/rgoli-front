import { useTranslation } from 'react-i18next'

import { Dialog, DialogBody, DialogContent, DialogHeader } from '@/components/ui/dialog'
import type { GlobalDialogProps } from '@/features/dialogs/GlobalDialogs'

import { FileDropzone } from './FileDropzone'

/** Quick-add upload dialog (hosted by GlobalDialogs). `projectId` pre-selects the project. */
export default function FileUploadDialog({ open, onClose, projectId }: GlobalDialogProps) {
  const { t } = useTranslation('files')
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader title={t('upload.title')} />
        <DialogBody>
          <FileDropzone projectId={projectId} onUploaded={onClose} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
