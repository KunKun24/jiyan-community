<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ForumLayout from '../components/ForumLayout.vue'
import { get, post } from '../api'
import { initial, timeAgo } from '../format'
import { store } from '../store'

interface Author {
  id: number
  username: string
}

interface PostData {
  id: number
  title: string
  content: string
  views: number
  replyCount: number
  createdAt: string
  author: Author
  category: { id: number; name: string; slug: string }
}

interface Reply {
  id: number
  content: string
  createdAt: string
  author: Author
}

const route = useRoute()
const router = useRouter()

const data = ref<PostData | null>(null)
const replies = ref<Reply[]>([])
const loading = ref(true)
const errorMsg = ref('')

const replyText = ref('')
const sending = ref(false)
const replyError = ref('')

async function load() {
  loading.value = true
  const r = await get<{ post: PostData; replies: Reply[] }>(`/api/posts/${route.params.id}`)
  if (r.ok) {
    data.value = r.data?.post ?? null
    replies.value = r.data?.replies ?? []
  } else {
    errorMsg.value = r.msg
  }
  loading.value = false
}

async function submitReply() {
  if (!store.user) {
    router.push('/login')
    return
  }
  replyError.value = ''
  const content = replyText.value.trim()
  if (!content) return
  sending.value = true
  const r = await post(`/api/posts/${route.params.id}/replies`, { content })
  sending.value = false
  if (!r.ok) {
    replyError.value = r.msg
    return
  }
  replyText.value = ''
  await load()
}

onMounted(load)
</script>

<template>
  <ForumLayout>
    <div v-if="loading" class="state">加载中…</div>
    <div v-else-if="errorMsg" class="state">{{ errorMsg }}</div>

    <template v-else-if="data">
      <nav class="crumbs">
        <RouterLink to="/forum">社区</RouterLink>
        <span>/</span>
        <RouterLink :to="`/forum?category=${data.category.slug}`">{{ data.category.name }}</RouterLink>
      </nav>

      <article class="post">
        <h1 class="post-title">{{ data.title }}</h1>
        <div class="post-meta">
          <span class="avatar">{{ initial(data.author.username) }}</span>
          <span>{{ data.author.username }}</span>
          <span class="dot">·</span>
          <span>{{ timeAgo(data.createdAt) }}</span>
          <span class="dot">·</span>
          <span>{{ data.views }} 次浏览</span>
        </div>
        <div class="post-body">{{ data.content }}</div>
      </article>

      <section class="replies">
        <h2 class="replies-title">{{ replies.length }} 条回复</h2>

        <div v-if="!replies.length" class="state small">还没有人回复，说点什么吧。</div>

        <article v-for="(rp, i) in replies" :key="rp.id" class="reply">
          <div class="reply-head">
            <span class="avatar sm">{{ initial(rp.author.username) }}</span>
            <span class="reply-name">{{ rp.author.username }}</span>
            <span class="reply-floor">#{{ i + 1 }}</span>
            <span class="reply-time">{{ timeAgo(rp.createdAt) }}</span>
          </div>
          <div class="reply-body">{{ rp.content }}</div>
        </article>

        <div class="reply-box">
          <template v-if="store.user">
            <textarea
              v-model="replyText"
              class="reply-input"
              rows="4"
              maxlength="5000"
              placeholder="写下你的回复…"
            ></textarea>
            <p v-if="replyError" class="reply-error">{{ replyError }}</p>
            <div class="reply-actions">
              <button class="btn-send" type="button" :disabled="sending" @click="submitReply">
                {{ sending ? '发送中…' : '发表回复' }}
              </button>
            </div>
          </template>
          <template v-else>
            <p class="login-hint">
              <RouterLink to="/login">登录</RouterLink> 后可以回复。
            </p>
          </template>
        </div>
      </section>
    </template>
  </ForumLayout>
</template>

<style scoped>
.state {
  padding: 70px 0;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}
.state.small {
  padding: 30px 0;
}

.crumbs {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 16px;
}
.crumbs a:hover {
  color: var(--ink);
}

.post {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 30px 32px;
  box-shadow: 0 6px 20px rgba(38, 34, 28, 0.04);
}

.post-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.35;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.post-meta {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: #918a7d;
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e8e4db;
  color: #4a453a;
  font-size: 12px;
  font-weight: 600;
  display: grid;
  place-items: center;
  flex: none;
}
.avatar.sm {
  width: 24px;
  height: 24px;
  font-size: 11px;
}

.dot {
  color: #c9c3b7;
}

.post-body {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  font-size: 15.5px;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
  color: #2f2a22;
}

.replies {
  margin-top: 34px;
}

.replies-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
}

.reply {
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}

.reply-head {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: #918a7d;
}

.reply-name {
  color: var(--ink);
  font-weight: 600;
  font-size: 13.5px;
}

.reply-floor {
  color: #b3ac9f;
}

.reply-time {
  margin-left: auto;
  font-size: 12.5px;
}

.reply-body {
  margin-top: 8px;
  padding-left: 33px;
  font-size: 14.8px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
  color: #332e26;
}

.reply-box {
  margin-top: 26px;
}

.reply-input {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
  font-family: inherit;
  font-size: 14.5px;
  line-height: 1.7;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.reply-input:focus {
  border-color: #b9c9bf;
  box-shadow: 0 0 0 3px rgba(62, 92, 75, 0.1);
}

.reply-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.btn-send {
  height: 40px;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.btn-send:disabled {
  opacity: 0.6;
  cursor: default;
}

.reply-error {
  margin: 8px 0 0;
  font-size: 13px;
  color: #b4492f;
}

.login-hint {
  margin: 0;
  padding: 18px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}
.login-hint a {
  color: var(--accent);
  font-weight: 600;
}

@media (max-width: 640px) {
  .post {
    padding: 22px 18px;
    border-radius: 12px;
  }
  .post-title {
    font-size: 22px;
  }
  .reply-body {
    padding-left: 0;
  }
}
</style>
