<script setup lang="ts">
import { track } from '@vercel/analytics'

const route = useRoute()
const name = String(route.params.name ?? '')

const { data: image, error } = await useFetch(`/api/image/${encodeURIComponent(name)}`)

const requestUrl = useRequestURL()
const shareUrl = computed(() => `${requestUrl.origin}/i/${encodeURIComponent(name)}`)

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function onCopy() {
  if (!image.value) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch {}
  track('link_copied', { surface: 'preview' })
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copied.value = false), 1600)
}

const uploadedLabel = computed(() => {
  if (!image.value) return ''
  return new Date(image.value.uploadedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

useSeoMeta({
  title: () => (image.value ? `${image.value.pathname} — GoodImg` : 'Image not found — GoodImg'),
  ogTitle: () => image.value?.pathname ?? 'Image not found',
  ogDescription: 'Fast, free image hosting. No account needed.',
  ogImage: () => image.value?.url,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="page">
    <header class="topbar">
      <NuxtLink to="/" class="brand">
        <div class="logo">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6" fill="#0a0a0a" stroke="none"/><path d="m21 15-5-5L5 21"/></svg>
        </div>
        <span class="brand-name">GoodImg</span>
      </NuxtLink>
      <span class="count">{{ image ? formatBytes(image.size) : '' }}</span>
    </header>

    <main class="stack">
      <!-- FOUND -->
      <div v-if="image" class="card view">
        <div class="preview view-preview">
          <img :src="image.url" :alt="image.pathname" />
        </div>
        <div class="view-body">
          <div class="view-meta">
            <span class="view-name">{{ image.pathname }}</span>
            <span class="view-sub">{{ image.contentType }} · {{ formatBytes(image.size) }} · {{ uploadedLabel }}</span>
          </div>
          <div class="url-row">
            <span class="url-field">{{ shareUrl }}</span>
            <button class="copy-btn" :class="{ copied }" @click="onCopy">
              <svg v-if="copied" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>
          <div class="again-row">
            <NuxtLink to="/" class="again">↑ Upload another</NuxtLink>
          </div>
        </div>
      </div>

      <!-- NOT FOUND -->
      <div v-else class="card missing">
        <div class="missing-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1a1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6" fill="#a1a1a1" stroke="none"/><path d="m21 15-5-5L5 21"/><path d="M3 3l18 18" stroke="#f87171"/></svg>
        </div>
        <div class="missing-title">Image not found</div>
        <div class="missing-sub">{{ error?.statusCode === 404 ? 'This image may have been deleted, or the link is wrong.' : 'Something went wrong loading this image.' }}</div>
        <NuxtLink to="/" class="again">↑ Upload an image</NuxtLink>
      </div>
    </main>
  </div>
</template>

<style>
.card.view { overflow: hidden; animation-duration: 0.3s; }

.view-preview {
  height: auto;
  min-height: 160px;
  max-height: 65vh;
  padding: 12px;
}

.view-preview img { max-height: calc(65vh - 24px); border-radius: 6px; }

.view-body { padding: 18px; }

.view-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 12px;
  min-width: 0;
}

.view-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-sub {
  font-family: 'Geist Mono', monospace;
  font-size: 12px;
  color: #8f8f8f;
}

.card.missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  gap: 6px;
}

.missing-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #161616;
  border: 1px solid #262626;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.missing-title { font-size: 15px; font-weight: 500; letter-spacing: -0.01em; }

.missing-sub { font-size: 13px; color: #8f8f8f; margin-bottom: 10px; }
</style>
