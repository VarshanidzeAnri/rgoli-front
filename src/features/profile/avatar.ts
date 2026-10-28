export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Client-side avatar check (the API validates again). Returns a profile i18n key or null. */
export function avatarError(file: Pick<File, 'type' | 'size'>): 'avatar.wrongType' | 'avatar.tooLarge' | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return 'avatar.wrongType'
  if (file.size > AVATAR_MAX_BYTES) return 'avatar.tooLarge'
  return null
}
