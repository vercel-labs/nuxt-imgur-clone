<template>
  <NuxtPage />
</template>

<style>
* { box-sizing: border-box; }
body { margin: 0; }
::selection { background: rgba(255, 255, 255, 0.15); }

@keyframes gi-spin { to { transform: rotate(360deg); } }
@keyframes gi-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

input[type='file'] { display: none; }

.page {
  min-height: 100vh;
  background: #0a0a0a;
  color: #ededed;
  font-family: 'Geist', -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px 80px;
}

.topbar {
  width: 100%;
  max-width: 960px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 1px solid #1f1f1f;
  margin-bottom: 56px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  color: inherit;
  text-decoration: none;
}

.logo {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #ededed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name { font-size: 15px; font-weight: 600; letter-spacing: -0.02em; }

.count { font-family: 'Geist Mono', monospace; font-size: 12px; color: #8f8f8f; }

.stack {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.card {
  border: 1px solid #262626;
  border-radius: 14px;
  background: #0f0f0f;
  animation: gi-in 0.25s ease;
}

.preview {
  width: 100%;
  height: 260px;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1f1f1f;
}

.preview img { max-width: 100%; max-height: 100%; object-fit: contain; }

.url-row { display: flex; gap: 8px; }

.url-field {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #262626;
  border-radius: 8px;
  background: #0a0a0a;
  font-family: 'Geist Mono', monospace;
  font-size: 13px;
  color: #d4d4d4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  line-height: 38px;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  background: #ededed;
  color: #0a0a0a;
  font-family: 'Geist', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: background 0.15s ease;
}

.copy-btn.copied { background: #4ade80; }

.again {
  display: inline-block;
  background: none;
  border: none;
  color: #8f8f8f;
  font-family: 'Geist', sans-serif;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
  letter-spacing: -0.01em;
  text-decoration: none;
}
</style>
