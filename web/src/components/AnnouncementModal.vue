<template>
  <div v-if="open" class="ann-mask" @click.self="close">
    <div class="ann-card" role="dialog" aria-modal="true">
      <p class="ann-eyebrow">社区公告</p>
      <h2>{{ notice.title }}</h2>
      <p class="ann-time">{{ notice.created_at?.slice(0, 16) }}</p>
      <p class="ann-body">{{ notice.content }}</p>
      <button class="ann-btn" @click="close">知道了</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { get } from '../api'

interface Notice { id: number; title: string; content: string; created_at: string }

const open = ref(false)
const notice = ref<Notice>({ id: 0, title: '', content: '', created_at: '' })

function close() {
  open.value = false
  if (notice.value.id) localStorage.setItem('shequ:notice-seen', String(notice.value.id))
}

onMounted(async () => {
  const me = await get<{ user: unknown }>('/api/auth/me')
  if (!me.ok) return
  const r = await get<{ notices: Notice[] }>('/api/notices')
  if (!r.ok || !r.data?.notices?.length) return
  const latest = r.data.notices[0]
  if (localStorage.getItem('shequ:notice-seen') === String(latest.id)) return
  notice.value = latest
  open.value = true
})
</script>

<style scoped>
.ann-mask {
  position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center;
  background: rgba(38, 34, 28, .28); backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px);
  padding: 20px;
}
.ann-card {
  background: #fff; border-radius: 14px; width: min(440px, 100%); padding: 26px 26px 22px;
  box-shadow: 0 24px 60px rgba(38, 34, 28, .22); border: 1px solid var(--line);
}
.ann-eyebrow { font-size: 11.5px; letter-spacing: .14em; color: var(--accent); text-transform: uppercase; }
.ann-card h2 { font-size: 19px; margin: 8px 0 4px; }
.ann-time { font-size: 12px; color: var(--muted); }
.ann-body { font-size: 14px; line-height: 1.8; color: #3a352d; margin: 14px 0 20px; white-space: pre-wrap; }
.ann-btn { width: 100%; height: 40px; border: 0; border-radius: 8px; background: var(--accent); color: #fff; font-size: 14px; cursor: pointer; }
.ann-btn:hover { background: #334c3e; }
</style>
