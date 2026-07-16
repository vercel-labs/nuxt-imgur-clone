import { customAlphabet } from 'nanoid'

export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

// Blob pathnames are always <10 alphanumeric chars>.<ext> — never the original
// filename (which can leak timestamps and context, e.g. screenshot names).
export const IMAGE_NAME_RE = /^[A-Za-z0-9]{10}\.(png|jpg|gif|webp)$/

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  10,
)

export function newImageName(contentType: string): string {
  return `${nanoid()}.${EXTENSIONS[contentType] ?? 'png'}`
}

export function isAllowedImageType(type: string | undefined | null): boolean {
  return !!type && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
