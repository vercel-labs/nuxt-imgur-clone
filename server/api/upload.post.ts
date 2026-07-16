import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { track } from '@vercel/analytics/server'
import { toWebRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as HandleUploadBody

  try {
    return await handleUpload({
      body,
      request: toWebRequest(event),
      onBeforeGenerateToken: async (pathname) => {
        if (!IMAGE_NAME_RE.test(pathname)) {
          throw new Error('Invalid image name')
        }
        return {
          allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          // Names are random and never reused, so blob URLs are immutable — let
          // the Blob CDN and browsers cache them for a full year (default is one month).
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        // Called by Vercel Blob after the upload lands (not reachable on localhost).
        await track('image_upload_completed', {
          contentType: blob.contentType ?? 'unknown',
        })
      },
    })
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Upload failed',
    })
  }
})
