import type { AppConfig } from '@/types/api'

export interface FileProblem {
  name: string
  kind: 'fileTooLarge' | 'fileType'
}

/** Client-side mirror of the API rules (size per file, allowed extensions). The API still validates. */
export function validateFiles(files: File[], uploads: AppConfig['uploads'] | undefined): FileProblem[] {
  if (!uploads) return []
  const allowed = new Set(uploads.extensions.map((e) => e.toLowerCase()))
  const problems: FileProblem[] = []
  for (const file of files) {
    const ext = file.name.includes('.') ? (file.name.split('.').pop() ?? '').toLowerCase() : ''
    if (!allowed.has(ext)) problems.push({ name: file.name, kind: 'fileType' })
    else if (file.size > uploads.max_kb * 1024) problems.push({ name: file.name, kind: 'fileTooLarge' })
  }
  return problems
}

let counter = 0
export function newUploadId(): string {
  counter += 1
  return `up-${Date.now()}-${counter}`
}
