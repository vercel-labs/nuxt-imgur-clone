import { head, BlobNotFoundError } from '@vercel/blob'

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'name') ?? ''
  const name = decodeURIComponent(raw)
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing image name' })
  }

  try {
    const blob = await head(name)
    if (!isAllowedImageType(blob.contentType)) {
      throw createError({ statusCode: 404, statusMessage: 'Image not found' })
    }
    // Blob metadata is immutable (random-suffixed pathnames are never rewritten),
    // so let Vercel's CDN cache it for a day and serve stale while revalidating.
    setResponseHeader(
      event,
      'Cache-Control',
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    )
    return {
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      contentType: blob.contentType,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      throw createError({ statusCode: 404, statusMessage: 'Image not found' })
    }
    throw error
  }
})
