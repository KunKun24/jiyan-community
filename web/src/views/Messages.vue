<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, post } from '../api'
import { store } from '../store'
import { timeAgo, initial } from '../format'
import { connectRealtime, onRealtime } from '../realtime'

interface Conv {
  id: number
  otherId: number
  otherName: string
  otherAvatar: string | null
  lastText: string
  lastAt: string
  unread: number
}
interface Msg {
  id: number
  senderId: number
  content: string
  createdAt: string
}

const route = useRoute()
const router = useRouter()
const convs = ref<Conv[]>([])
const activeId = ref(0)
const messages = ref<Msg[]>([])
const draft = ref('')
const sending = ref(false)
const loadingMsgs = ref(false)
const scrollBox = ref<HTMLElement | null>(null)
let offRealtime: (() => void) | null = null

const activeConv = computed(() => convs.value.find((c) => c.id === activeId.value) || null)
const myId = computed(() => store.user?.id || 0)

async function loadConvs() {
  const r = await get<{ items: Conv[] }>('/api/conversations')
  if (r.ok && r.data) convs.value = r.data.items
}

async function loadMessages(id: number) {
  if (!id) return
  loadingMsgs.value = true
  const r = await get<{ items: Msg[]; otherId: number }>(`/api/conversations/${id}/messages`)
  loadingMsgs.value = false
  if (!r.ok || !r.data) return
  messages.value = r.data.items
  const c = convs.value.find((x) => x.id === id)
  if (c) c.unread = 0
  await nextTick()
  scrollBottom()
}

function scrollBottom() {
  const el = scrollBox.value
  if (el) el.scrollTop = el.scrollHeight
}

async function openConv(id: number) {
  activeId.value = id
  router.replace({ query: { c: String(id) } })
  await loadMessages(id)
}

async function send() {
  const text = draft.value.trim()
  if (!text || !activeId.value || sending.value) return
  sending.value = true
  const r = await post<{ id: number }>(`/api/conversations/${activeId.value}/messages`, { content: text })
  sending.value = false
  if (!r.ok) { alert(r.msg); return }
  draft.value = ''
  messages.value.push({ id: r.data!.id, senderId: myId.value, content: text, createdAt: new Date().toISOString() })
  const c = convs.value.find((x) => x.id === activeId.value)
  if (c) { c.lastText = text; c.lastAt = new Date().toISOString() }
  await nextTick()
  scrollBottom()
}

function connect() {
  connectRealtime()
  offRealtime = onRealtime((d) => {
    if (d.type !== 'message') return
    const m = d.message
    if (d.conversationId === activeId.value) {
      if (!messages.value.some((x) => x.id === m.id)) {
        messages.value.push({ id: m.id, senderId: m.senderId, content: m.content, createdAt: m.createdAt })
        nextTick(scrollBottom)
      }
    }
    const c = convs.value.find((x) => x.id === d.conversationId)
    if (c) {
      c.lastText = m.content
      c.lastAt = new Date().toISOString()
      if (d.conversationId !== activeId.value) c.unread++
      convs.value = [c, ...convs.value.filter((x) => x.id !== c.id)]
    } else {
      loadConvs()
    }
  })
}

onMounted(async () => {
  if (!store.user) { router.push('/login?redirect=/messages'); return }
  await loadConvs()
  const id = Number(route.query.c || 0)
  if (id) await openConv(id)
  connect()
})

onBeforeUnmount(() => { offRealtime?.() })

watch(() => route.query.c, (v) => {
  const id = Number(v || 0)
  if (id && id !== activeId.value) openConv(id)
})
</script>

<template>
  <div class="page">
    <div class="inbox">
      <aside class="conv-list">
        <div class="cl-head">私信</div>
        <div v-if="!convs.length" class="cl-empty">还没有私信。去看看别人的主页，打个招呼。</div>
        <button
          v-for="c in convs"
          :key="c.id"
          class="conv"
          :class="{ on: c.id === activeId }"
          type="button"
          @click="openConv(c.id)"
        >
          <img v-if="c.otherAvatar" class="c-avatar" :src="c.otherAvatar" alt="" />
          <span v-else class="c-avatar letter">{{ initial(c.otherName) }}</span>
          <span class="c-main">
            <span class="c-top"><b>{{ c.otherName }}</b><i>{{ timeAgo(c.lastAt) }}</i></span>
            <span class="c-last">{{ c.lastText }}</span>
          </span>
          <span v-if="c.unread" class="c-badge">{{ c.unread > 99 ? '99+' : c.unread }}</span>
        </button>
      </aside>

      <section class="chat">
        <template v-if="activeConv">
          <header class="chat-head">
            <RouterLink :to="`/u/${activeConv.otherId}`" class="chat-name">{{ activeConv.otherName }}</RouterLink>
          </header>
          <div ref="scrollBox" class="chat-body">
            <div v-if="loadingMsgs" class="chat-empty">加载中…</div>
            <div v-else-if="!messages.length" class="chat-empty">还没有消息，说第一句吧。</div>
            <div v-for="m in messages" :key="m.id" class="bubble-row" :class="{ me: m.senderId === myId }">
              <div class="bubble">{{ m.content }}</div>
            </div>
          </div>
          <footer class="chat-input">
            <textarea v-model="draft" rows="1" placeholder="写点什么，Enter 发送" @keydown.enter.exact.prevent="send"></textarea>
            <button type="button" :disabled="sending || !draft.trim()" @click="send">{{ sending ? '…' : '发送' }}</button>
          </footer>
        </template>
        <div v-else class="chat-empty big">选择左边一条会话，或者去用户主页点「私信」。</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1020px; margin: 0 auto; padding: 22px 16px 60px; }
.inbox { display: flex; gap: 14px; height: calc(100vh - 150px); min-height: 420px; }
.conv-list, .chat {
  background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden;
  display: flex; flex-direction: column;
}
.conv-list { width: 280px; flex-shrink: 0; }
.cl-head { padding: 14px 16px; font-size: 13px; font-weight: 700; border-bottom: 1px solid var(--line); }
.cl-empty { padding: 18px 16px; font-size: 12.5px; color: var(--muted); line-height: 1.7; }
.conv {
  display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
  padding: 11px 14px; background: #fff; border: 0; border-bottom: 1px solid #f2efe9; cursor: pointer;
}
.conv:hover { background: #faf8f4; }
.conv.on { background: #f1f6f2; }
.c-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.c-avatar.letter { display: grid; place-items: center; background: #e8eee9; color: #3e5c4b; font-weight: 700; font-size: 14px; }
.c-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.c-top { display: flex; justify-content: space-between; gap: 8px; }
.c-top b { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c-top i { font-style: normal; font-size: 11px; color: var(--muted); flex-shrink: 0; }
.c-last { font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c-badge { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #b4553f; color: #fff; font-size: 11px; display: grid; place-items: center; }
.chat { flex: 1; min-width: 0; }
.chat-head { padding: 13px 18px; border-bottom: 1px solid var(--line); }
.chat-name { font-size: 14px; font-weight: 700; }
.chat-body { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; background: #fbfaf7; }
.chat-empty { text-align: center; color: var(--muted); font-size: 13px; padding: 30px 0; }
.chat-empty.big { flex: 1; display: grid; place-items: center; background: #fbfaf7; }
.bubble-row { display: flex; }
.bubble-row.me { justify-content: flex-end; }
.bubble {
  max-width: 72%; padding: 9px 13px; border-radius: 12px; font-size: 13.5px; line-height: 1.6;
  background: #fff; border: 1px solid var(--line); white-space: pre-wrap; word-break: break-word;
}
.bubble-row.me .bubble { background: #3e5c4b; border-color: #3e5c4b; color: #fff; }
.chat-input { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--line); }
.chat-input textarea {
  flex: 1; resize: none; border: 1px solid var(--line); border-radius: 9px; padding: 9px 11px;
  font: inherit; font-size: 13.5px; outline: none; max-height: 120px;
}
.chat-input textarea:focus { border-color: var(--accent); }
.chat-input button {
  height: 38px; padding: 0 18px; border-radius: 9px; border: 0; background: var(--accent); color: #fff;
  font-size: 13px; cursor: pointer;
}
.chat-input button:disabled { opacity: 0.45; cursor: default; }
@media (max-width: 720px) {
  .inbox { height: auto; flex-direction: column; }
  .conv-list { width: 100%; max-height: 42vh; }
  .chat { height: 58vh; }
}
</style>
