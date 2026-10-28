import { lazy, Suspense } from 'react'

import { useAppDispatch, useAppSelector } from '@/store'
import { closeDialog, selectActiveDialog } from '@/store/uiSlice'

const ProjectFormDialog = lazy(() => import('@/features/projects/components/ProjectFormDialog'))
const IssueFormDialog = lazy(() => import('@/features/issues/components/IssueFormDialog'))
const FileUploadDialog = lazy(() => import('@/features/files/components/FileUploadDialog'))
const SalaryRequestDialog = lazy(() => import('@/features/finance/components/SalaryRequestDialog'))

/**
 * Hosts the "quick add" dialogs driven by ui.activeDialog, so any page or the top bar can
 * open them with dispatch(openDialog({ kind, id?, projectId? })).
 */
export function GlobalDialogs() {
  const dispatch = useAppDispatch()
  const dialog = useAppSelector(selectActiveDialog)
  if (!dialog) return null

  const onClose = () => dispatch(closeDialog())
  const common = { open: true, onClose, id: dialog.id, projectId: dialog.projectId }

  return (
    <Suspense fallback={null}>
      {dialog.kind === 'project' ? <ProjectFormDialog {...common} /> : null}
      {dialog.kind === 'issue' ? <IssueFormDialog {...common} /> : null}
      {dialog.kind === 'file' ? <FileUploadDialog {...common} /> : null}
      {dialog.kind === 'salaryRequest' ? <SalaryRequestDialog {...common} /> : null}
    </Suspense>
  )
}

/** Props every globally hosted dialog receives. */
export interface GlobalDialogProps {
  open: boolean
  onClose: () => void
  /** Record to edit (omit to create). */
  id?: number
  /** Pre-selected project. */
  projectId?: number
}
