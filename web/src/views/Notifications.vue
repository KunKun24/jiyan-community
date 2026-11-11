<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../api'
import { timeAgo, initial } from '../format'

interface Notice {
  id: number; type: string; body: string; read: boolean; createdAt: string
  postId: number | null; postTitle: string | null; replyId: number | null
  actor: { id: number; username: string; avatar: string | null } | null
}

const router = useRouter()
const items = ref<Notice[]>([])
const unread = ref(0)
const loading = ref(true)

const LABEL: Record<string, string> = {
  reply: '回复了你',
  mention: '提到了你',
  like: '赞了你的帖子',
  reply_like: '赞了你的评论',
}

const loadError = ref('')
let loadTimer: number | undefined

async function load() {
  loading.value = true
  loadError.value = ''
  window.clearTimeout(loadTimer)
  loadTimer = window.setTimeout(() => {
    if (loading.value) { loading.value = false; loadError.value = '加载时间有点长，网络可能不稳定。' }
  }, 8000)
  try {
    const r = await get<{ items: Notice[]; unread: number }>('/api/notifications?size=50')
    if (r.ok && r.data) {
      items.value = r.data.items
      unread.value = r.data.unread
    } else {
      loadError.value = r.msg || '通知加载失败'
    }
  } catch {
    loadError.value = '加载失败，请检查网络后重试。'
  } finally {
    window.clearTimeout(loadTimer)
    loading.value = false
  }
}

async function markAll() {
  await post('/api/notifications/read', { all: true })
  unread.value = 0
  items.value = items.value.map((n) => ({ ...n, read: true }))
}

async function open(n: Notice) {
  if (!n.read) {
    n.read = true
    unread.value = Math.max(0, unread.value - 1)
    post('/api/notifications/read', { ids: [n.id] })
  }
  if (n.postId) router.push(`/post/${n.postId}${n.replyId ? '#r' + n.replyId : ''}`)
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>消息 <em v-if="unread">{{ unread }} 条未读</em></h1>
      <button v-if="unread" class="mark" type="button" @click="markAll">全部标为已读</button>
    </div>

    <SkeletonList v-if="loading" :rows="5" compact />
    <LoadError v-else-if="loadError" :message="loadError" @retry="load" />
    <div v-else-if="!items.length" class="hint">还没有消息。有人回复你或赞你的时候，会出现在这里。</div>

    <button
      v-for="n in items"
      :key="n.id"
      class="item"
      :class="{ unread: !n.read }"
      type="button"
      @click="open(n)"
    >
      <img v-if="n.actor?.avatar" class="avatar" :src="n.actor.avatar" alt="" />
      <span v-else class="avatar letter">{{ initial(n.actor?.username || '极') }}</span>
      <div class="main">
        <div class="line">
          <b>{{ n.actor?.username || '有人' }}</b>
          <span class="type">{{ LABEL[n.type] || n.type }}</span>
          <span v-if="!n.read" class="dot"></span>
        </div>
        <div v-if="n.body && n.type === 'mention'" class="body">{{ n.body }}</div>
        <div v-if="n.postTitle" class="post">《{{ n.postTitle }}》</div>
      </div>
      <span class="time">{{ timeAgo(n.createdAt) }}</span>
    </button>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; padding: 26px 18px 60px; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.head h1 { margin: 0; font-size: 19px; }
.head h1 em { font-style: normal; font-size: 12px; color: #b4432f; margin-left: 8px; }
.mark { border: 1px solid var(--line); background: #fff; border-radius: 7px; height: 30px; padding: 0 11px; font: inherit; font-size: 12.5px; color: var(--muted); cursor: pointer; }
.hint { padding: 50px 0; text-align: center; color: var(--muted); font-size: 13.5px; }
.item {
  width: 100%; display: flex; align-items: center; gap: 12px; text-align: left;
  padding: 13px 12px; border: 0; border-bottom: 1px solid #efeae1; background: transparent;
  font: inherit; cursor: pointer; border-radius: 8px;
}
.item:hover { background: #faf8f4; }
.item.unread { background: #fbfaf6; }
.avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex: none; }
.avatar.letter { display: grid; place-items: center; background: #e8eee9; color: #3e5c4b; font-weight: 700; }
.main { flex: 1; min-width: 0; }
.line { display: flex; align-items: center; gap: 6px; font-size: 13.5px; }
.line b { font-weight: 600; }
.type { color: var(--muted); }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #b4483f; }
.body { margin-top: 3px; font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.post { margin-top: 3px; font-size: 12.5px; color: #8b8478; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time { font-size: 11.5px; color: #b3aca0; flex: none; }
</style>
