<script setup lang="ts">
import { upload } from '@vercel/blob/client'
import { track } from '@vercel/analytics'

type Status = 'idle' | 'drag' | 'uploading' | 'done'
type UploadMethod = 'paste' | 'drop' | 'browse'

interface GalleryItem {
  src: string
  href: string
}

const status = ref<Status>('idle')
const progress = ref(0)
const fileName = ref('')
const previewSrc = ref('')
const pageUrl = ref('')
const copied = ref(false)
const errorMsg = ref('')
const gallery = ref<GalleryItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const countLabel = computed(() => {
  const n = gallery.value.length
  return n === 0 ? 'No uploads yet' : `${n} ${n === 1 ? 'upload' : 'uploads'}`
})
const dragging = computed(() => status.value === 'drag')
const dropTitle = computed(() =>
  dragging.value ? 'Release to upload' : 'Drag & drop your image here',
)

async function handleFile(file: File | null | undefined, method: UploadMethod) {
  if (!file) return
  if (!isAllowedImageType(file.type)) {
    errorMsg.value = 'Only PNG, JPG, WebP, and GIF images are supported.'
    track('upload_rejected', { reason: 'unsupported_type', type: file.type || 'unknown' })
    return
  }
  if (file.size > MAX_IMAGE_SIZE) {
    errorMsg.value = 'That image is over 10MB.'
    track('upload_rejected', { reason: 'too_large', sizeKb: Math.round(file.size / 1024) })
    return
  }
  errorMsg.value = ''
  fileName.value = file.name || 'pasted-image.png'
  previewSrc.value = URL.createObjectURL(file)
  progress.value = 0
  status.value = 'uploading'
  copied.value = false

  try {
    const blob = await upload(newImageName(file.type), file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      onUploadProgress: ({ percentage }) => {
        progress.value = percentage
      },
    })
    pageUrl.value = `${window.location.origin}/i/${encodeURIComponent(blob.pathname)}`
    gallery.value = [{ src: previewSrc.value, href: pageUrl.value }, ...gallery.value].slice(0, 8)
    status.value = 'done'
    track('image_uploaded', {
      method,
      type: file.type,
      sizeKb: Math.round(file.size / 1024),
    })
  } catch (error) {
    errorMsg.value = error instanceof Error ? error.message : 'Upload failed. Try again.'
    status.value = 'idle'
    track('upload_failed', { method, type: file.type })
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (status.value === 'idle' || status.value === 'drag') status.value = 'drag'
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  if (status.value === 'drag') status.value = 'idle'
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  if (status.value === 'drag') status.value = 'idle'
  handleFile(e.dataTransfer?.files?.[0], 'drop')
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  handleFile(input.files?.[0], 'browse')
  input.value = ''
}

function onPaste(e: ClipboardEvent) {
  const file = e.clipboardData?.files?.[0]
  if (file) {
    e.preventDefault()
    handleFile(file, 'paste')
  }
}

async function onCopy() {
  try {
    await navigator.clipboard.writeText(pageUrl.value)
  } catch {}
  track('link_copied', { surface: 'uploader' })
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copied.value = false), 1600)
}

function onReset() {
  status.value = 'idle'
  progress.value = 0
  previewSrc.value = ''
  fileName.value = ''
  pageUrl.value = ''
  copied.value = false
  errorMsg.value = ''
}

onMounted(() => window.addEventListener('paste', onPaste))
onBeforeUnmount(() => window.removeEventListener('paste', onPaste))
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
      <span class="count">{{ countLabel }}</span>
    </header>

    <main class="stack">
      <div class="hero">
        <h1>Drop an image, get a link</h1>
        <p>Fast, free image hosting. No account needed.</p>
      </div>

      <!-- IDLE / DRAG dropzone -->
      <label
        v-if="status === 'idle' || status === 'drag'"
        for="gi-file"
        class="dropzone"
        :class="{ dragging }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div class="drop-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1a1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg>
        </div>
        <div class="drop-title">{{ dropTitle }}</div>
        <div class="drop-sub">or click to browse — PNG, JPG, WebP, GIF up to 10MB</div>
      </label>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <!-- UPLOADING -->
      <div v-if="status === 'uploading'" class="card uploading">
        <div class="upload-row">
          <div class="thumb-sm"><img :src="previewSrc" alt="" /></div>
          <div class="upload-meta">
            <div class="file-name">{{ fileName }}</div>
            <div class="progress-label">Uploading… {{ Math.round(progress) }}%</div>
          </div>
          <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8f8f8f" stroke-width="2.4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
        <div class="track">
          <div class="bar" :style="{ width: Math.round(progress) + '%' }"></div>
        </div>
      </div>

      <!-- SUCCESS -->
      <div v-if="status === 'done'" class="card done">
        <a class="preview" :href="pageUrl">
          <img :src="previewSrc" :alt="fileName" />
        </a>
        <div class="done-body">
          <div class="uploaded-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Uploaded</span>
          </div>
          <div class="url-row">
            <a class="url-field" :href="pageUrl">{{ pageUrl }}</a>
            <button class="copy-btn" :class="{ copied }" @click="onCopy">
              <svg v-if="copied" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>
          <div class="again-row">
            <button class="again" @click="onReset">↑ Upload another</button>
          </div>
        </div>
      </div>

      <input
        id="gi-file"
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp"
        @change="onPick"
      />

      <!-- GALLERY -->
      <div v-if="gallery.length" class="gallery">
        <div class="gallery-head">
          <span>Recent uploads</span>
        </div>
        <div class="grid">
          <a v-for="g in gallery" :key="g.href" class="cell" :href="g.href">
            <img :src="g.src" alt="" />
          </a>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
.hero { text-align: center; }

.hero h1 {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.035em;
  margin: 0 0 8px;
}

.hero p {
  font-size: 15px;
  color: #8f8f8f;
  margin: 0;
  letter-spacing: -0.01em;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  border-radius: 14px;
  cursor: pointer;
  border: 1.5px dashed #2e2e2e;
  background: #0d0d0d;
  transition: border-color 0.15s ease, background 0.15s ease;
  animation: gi-in 0.25s ease;
}

.dropzone.dragging {
  border-color: #ededed;
  background: #131313;
}

.drop-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #161616;
  border: 1px solid #262626;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.drop-title { font-size: 15px; font-weight: 500; letter-spacing: -0.01em; }

.drop-sub { font-size: 13px; color: #8f8f8f; margin-top: 5px; }

.error { font-size: 13px; color: #f87171; margin: -16px 0 0; text-align: center; }

.card.uploading {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-row { display: flex; align-items: center; gap: 14px; }

.thumb-sm {
  width: 44px;
  height: 44px;
  border-radius: 9px;
  background: #161616;
  border: 1px solid #262626;
  overflow: hidden;
  flex-shrink: 0;
}

.thumb-sm img { width: 100%; height: 100%; object-fit: cover; display: block; }

.upload-meta { flex: 1; min-width: 0; }

.file-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-label {
  font-family: 'Geist Mono', monospace;
  font-size: 12px;
  color: #8f8f8f;
  margin-top: 2px;
}

.spinner { animation: gi-spin 0.8s linear infinite; flex-shrink: 0; }

.track {
  height: 6px;
  border-radius: 99px;
  background: #1f1f1f;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 99px;
  background: #ededed;
  transition: width 0.18s ease;
}

.card.done { overflow: hidden; animation-duration: 0.3s; }

.done-body { padding: 18px; }

.uploaded-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
}

.uploaded-badge span { font-size: 13px; font-weight: 500; color: #4ade80; }

.again-row { margin-top: 12px; }

.gallery { margin-top: 8px; }

.gallery-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.gallery-head span {
  font-size: 13px;
  font-weight: 500;
  color: #a1a1a1;
  letter-spacing: -0.01em;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.cell {
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #1f1f1f;
  background: #0f0f0f;
  cursor: pointer;
  position: relative;
  display: block;
}

.cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
