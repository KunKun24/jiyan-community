<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { del, get, post } from '../api'
import { initial, timeAgo } from '../format'
import { decorateHtml } from '../links'
import { store } from '../store'

interface Author {
  id: number
  username: string
}

interface PostData {
  id: number
  title: string
  content: string
  contentHtml?: string
  views: number
  replyCount: number
  createdAt: string
  likeCount: number
  liked: boolean
  bookmarked: boolean
  status: string
  author: Author
  category: { id: number; name: string; slug: string }
}

interface Reply {
  id: number
  content: string
  createdAt: string
  parentId: number | null
  parentUsername: string | null
  likeCount: number
  liked: boolean
  author: Author
}

interface Lightbox {
  srcs: string[]
  idx: number
}

const route = useRoute()
const router = useRouter()

function escapeHtml(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const MENTION_RE = /@([\p{L}\p{N}_-]{2,32})/gu

/** 把正文里的 @用户名 变成可点的链接 */
function linkMentions(html: string) {
  if (!/@[\p{L}\p{N}_-]{2,32}/u.test(html)) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    const parent = node.parentElement
    if (!parent || parent.closest('a, code, pre')) continue
    const text = node.nodeValue || ''
    if (!MENTION_RE.test(text)) continue
    MENTION_RE.lastIndex = 0
    const frag = document.createDocumentFragment()
    let last = 0
    let m: RegExpExecArray | null
    while ((m = MENTION_RE.exec(text))) {
      frag.appendChild(doc.createTextNode(text.slice(last, m.index)))
      const a = doc.createElement('a')
      a.href = `/search?q=${encodeURIComponent(m[1])}&type=users`
      a.className = 'mention-link'
      a.textContent = '@' + m[1]
      frag.appendChild(a)
      last = m.index + m[0].length
    }
    frag.appendChild(doc.createTextNode(text.slice(last)))
    node.replaceWith(frag)
  }
  return doc.body.innerHTML
}

const bodyHtml = computed(() => {
  if (!data.value) return ''
  const raw = data.value.contentHtml
    ? decorateHtml(data.value.contentHtml)
    : escapeHtml(data.value.content || '').replace(/\n/g, '<br />')
  return linkMentions(raw)
})

const lightbox = ref<Lightbox | null>(null)

function onBodyClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.tagName !== 'IMG') return
  const img = t as HTMLImageElement
  if (img.classList.contains('img-spoiler')) {
    img.classList.remove('img-spoiler')
    return
  }
  const imgs = [...document.querySelectorAll('.post-body img')].filter(
    (x) => !x.classList.contains('img-spoiler'),
  ) as HTMLImageElement[]
  const srcs = imgs.map((x) => x.src)
  if (!srcs.length) return
  lightbox.value = { srcs, idx: Math.max(0, srcs.indexOf(img.src)) }
}

function lbStep(d: number) {
  if (!lightbox.value) return
  const n = lightbox.value.srcs.length
  lightbox.value.idx = (lightbox.value.idx + d + n) % n
}

function onKey(e: KeyboardEvent) {
  if (!lightbox.value) return
  if (e.key === 'Escape') lightbox.value = null
  if (e.key === 'ArrowLeft') lbStep(-1)
  if (e.key === 'ArrowRight') lbStep(1)
}

const reportOpen = ref(false)
const reportType = ref<'post' | 'comment'>('post')
const reportIds = ref<number[]>([])
const reportReason = ref('')
const reportContact = ref('')
const reportError = ref('')
const reportSending = ref(false)
const checkedReplies = ref<number[]>([])
const reportDone = ref('')

function openReport(type: 'post' | 'comment', ids: number[]) {
  if (!store.user) {
    router.push('/login')
    return
  }
  reportType.value = type
  reportIds.value = ids
  reportReason.value = ''
  reportContact.value = ''
  reportError.value = ''
  reportDone.value = ''
  reportOpen.value = true
}

function toggleCheck(id: number) {
  const i = checkedReplies.value.indexOf(id)
  if (i >= 0) checkedReplies.value.splice(i, 1)
  else checkedReplies.value.push(id)
}

async function submitReport() {
  reportError.value = ''
  if (reportReason.value.trim().length < 5) {
    reportError.value = '请把原因写清楚一点（至少 5 个字）'
    return
  }
  reportSending.value = true
  const r = await post<{ count: number }>('/api/reports', {
    targetType: reportType.value,
    targetIds: reportIds.value,
    postId: data.value?.id,
    reason: reportReason.value.trim(),
    contact: reportContact.value.trim(),
  })
  reportSending.value = false
  if (!r.ok) {
    reportError.value = r.msg
    return
  }
  reportDone.value = '已收到，管理员会看。谢谢你把它指出来。'
  checkedReplies.value = []
  setTimeout(() => {
    reportOpen.value = false
    reportDone.value = ''
  }, 1400)
}

async function toggleReplyLike(rp: Reply) {
  if (!store.user) {
    router.push('/login')
    return
  }
  if (rp.author.id === store.user.id) return
  const r = await post<{ liked: boolean; likeCount: number }>(`/api/replies/${rp.id}/like`, {})
  if (r.ok && r.data) {
    rp.liked = r.data.liked
    rp.likeCount = r.data.likeCount
  }
}

const data = ref<PostData | null>(null)
const replies = ref<Reply[]>([])
const loading = ref(true)
const errorMsg = ref('')

const replyText = ref('')
const replyTo = ref<{ id: number; username: string } | null>(null)
const replyBox = ref<HTMLTextAreaElement | null>(null)

function startReply(rp: Reply) {
  if (!store.user) {
    router.push('/login')
    return
  }
  replyTo.value = { id: rp.id, username: rp.author.username }
  replyBox.value?.focus()
}

function cancelReply() {
  replyTo.value = null
}
const sending = ref(false)
const replyError = ref('')
const shareMsg = ref('')
const showDelete = ref(false)
const deleting = ref(false)

async function toggleBookmark() {
  if (!store.user) {
    router.push('/login')
    return
  }
  const r = await post<{ bookmarked: boolean }>(`/api/posts/${route.params.id}/bookmark`, {})
  if (r.ok && data.value && r.data) {
    data.value.bookmarked = r.data.bookmarked
    shareMsg.value = r.data.bookmarked ? '已收藏' : '已取消收藏'
    setTimeout(() => (shareMsg.value = ''), 1800)
  } else if (!r.ok) {
    shareMsg.value = r.msg
    setTimeout(() => (shareMsg.value = ''), 2200)
  }
}

async function confirmDelete() {
  deleting.value = true
  const r = await del(`/api/posts/${route.params.id}`)
  deleting.value = false
  if (!r.ok) {
    shareMsg.value = r.msg
    showDelete.value = false
    return
  }
  router.push('/forum')
}

const isOwn = computed(() => !!store.user && !!data.value && store.user.id === data.value.author.id)

function copyText(text: string): boolean {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 继续走兼容方案 */
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.top = '-1000px'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(ta)
  return ok
}

async function toggleLike() {
  if (!store.user) {
    router.push('/login')
    return
  }
  const r = await post<{ liked: boolean; likeCount: number }>(`/api/posts/${route.params.id}/like`, {})
  if (r.ok && data.value && r.data) {
    data.value.liked = r.data.liked
    data.value.likeCount = r.data.likeCount
  } else if (!r.ok) {
    shareMsg.value = r.msg
    setTimeout(() => (shareMsg.value = ''), 2200)
  }
}

async function share() {
  if (!store.user) {
    router.push('/login')
    return
  }
  shareMsg.value = copyText(location.href) ? '链接已复制' : '复制失败，请手动复制地址栏'
  await post(`/api/posts/${route.params.id}/share`, {})
  setTimeout(() => (shareMsg.value = ''), 2200)
}

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
  const r = await post(`/api/posts/${route.params.id}/replies`, {
    content,
    parentId: replyTo.value?.id || null,
  })
  sending.value = false
  if (!r.ok) {
    replyError.value = r.msg
    return
  }
  replyText.value = ''
  replyTo.value = null
  await load()
}

onMounted(load)
</script>

<template>
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
        <RouterLink class="author-link" :to="`/u/${data.author.id}`">
          <span class="avatar">{{ initial(data.author.username) }}</span>
          <span>{{ data.author.username }}</span>
        </RouterLink>
        <span class="dot">·</span>
        <span>{{ timeAgo(data.createdAt) }}</span>
        <span class="dot">·</span>
        <span>{{ data.views }} 次浏览</span>
      </div>
      <div class="post-body" v-html="bodyHtml" @click="onBodyClick"></div>

      <div class="post-actions">
        <button
          class="act"
          :class="{ on: data.liked }"
          type="button"
          :disabled="isOwn"
          :title="isOwn ? '不能给自己的帖子点赞' : ''"
          @click="toggleLike"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path
              d="M12 21s-7.5-4.7-9.3-9.2C1.3 8.3 3.2 5 6.6 5c2 0 3.4 1.1 4.2 2.3l1.2 1.6 1.2-1.6C14 6.1 15.4 5 17.4 5c3.4 0 5.3 3.3 3.9 6.8C19.5 16.3 12 21 12 21z"
              :fill="data.liked ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="1.6"
            />
          </svg>
          {{ data.likeCount }}
        </button>
        <button class="act" type="button" @click="share">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M8 7l4-4 4 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          分享
        </button>
        <button
          class="act"
          :class="{ on: data.bookmarked }"
          type="button"
          @click="toggleBookmark"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.6L5 21V4a1 1 0 0 1 1-1z"
              :fill="data.bookmarked ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
          {{ data.bookmarked ? '已收藏' : '收藏' }}
        </button>
        <RouterLink v-if="isOwn" class="act" :to="`/post/${data.id}/edit`">编辑</RouterLink>
        <button v-if="!isOwn" class="act" type="button" @click="openReport('post', [data.id])">举报</button>
        <button v-if="isOwn" class="act danger" type="button" @click="showDelete = true">删除</button>
        <span v-if="shareMsg" class="act-msg">{{ shareMsg }}</span>
      </div>
    </article>

    <section class="replies">
      <h2 class="replies-title">{{ replies.length }} 条回复</h2>

      <div v-if="!replies.length" class="state small">还没有人回复，说点什么吧。</div>

      <article v-for="(rp, i) in replies" :id="'r' + rp.id" :key="rp.id" class="reply">
        <label v-if="store.user" class="reply-check">
          <input type="checkbox" :checked="checkedReplies.includes(rp.id)" @change="toggleCheck(rp.id)" />
        </label>
        <div class="reply-head">
          <RouterLink class="author-link" :to="`/u/${rp.author.id}`">
            <span class="avatar sm">{{ initial(rp.author.username) }}</span>
            <span class="reply-name">{{ rp.author.username }}</span>
          </RouterLink>
          <span class="reply-floor">#{{ i + 1 }}</span>
          <span class="reply-time">{{ timeAgo(rp.createdAt) }}</span>
          <button class="reply-btn" type="button" @click="startReply(rp)">回复</button>
          <button
            class="reply-like"
            :class="{ on: rp.liked }"
            type="button"
            :disabled="store.user?.id === rp.author.id"
            @click="toggleReplyLike(rp)"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
              <path
                d="M12 21s-7.5-4.7-9.3-9.2C1.3 8.3 3.2 5 6.6 5c2 0 3.4 1.1 4.2 2.3l1.2 1.6 1.2-1.6C14 6.1 15.4 5 17.4 5c3.4 0 5.3 3.3 3.9 6.8C19.5 16.3 12 21 12 21z"
                :fill="rp.liked ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.6"
              />
            </svg>
            {{ rp.likeCount || '' }}
          </button>
          <button v-if="store.user && store.user.id !== rp.author.id" class="reply-btn" type="button" @click="openReport('comment', [rp.id])">举报</button>
        </div>
        <div class="reply-body">
          <span v-if="rp.parentUsername" class="reply-at">回复 @{{ rp.parentUsername }}：</span>{{ rp.content }}
        </div>
      </article>

      <div v-if="checkedReplies.length" class="bulk-bar">
        <span>已选 {{ checkedReplies.length }} 条评论</span>
        <button type="button" @click="openReport('comment', checkedReplies)">举报给管理员</button>
        <button type="button" class="ghost" @click="checkedReplies = []">取消</button>
      </div>

      <div class="reply-box">
        <template v-if="store.user">
          <div v-if="replyTo" class="reply-target">
            回复 @{{ replyTo.username }}
            <button type="button" @click="cancelReply">取消</button>
          </div>
          <textarea
            ref="replyBox"
            v-model="replyText"
            class="reply-input"
            rows="4"
            maxlength="5000"
            :placeholder="replyTo ? `回复 @${replyTo.username}…` : '写下你的回复…'"
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

    <div v-if="lightbox" class="lb" @click.self="lightbox = null">
      <button class="lb-close" type="button" @click="lightbox = null">×</button>
      <button v-if="lightbox.srcs.length > 1" class="lb-nav prev" type="button" @click.stop="lbStep(-1)">‹</button>
      <img class="lb-img" :src="lightbox.srcs[lightbox.idx]" alt="" />
      <button v-if="lightbox.srcs.length > 1" class="lb-nav next" type="button" @click.stop="lbStep(1)">›</button>
      <span class="lb-count">{{ lightbox.idx + 1 }} / {{ lightbox.srcs.length }}</span>
    </div>

    <div v-if="reportOpen" class="modal-mask" @click.self="reportOpen = false">
      <div class="modal">
        <h3>举报{{ reportType === 'post' ? '帖子' : ` ${reportIds.length} 条评论` }}</h3>
        <p class="report-tip">管理员会看到原因和联系方式，不会告诉对方是谁举报的。</p>
        <textarea v-model="reportReason" class="report-input" rows="4" maxlength="500" placeholder="发生了什么？写清楚一点，比如：广告、人身攻击、灌水…"></textarea>
        <input v-model="reportContact" class="report-input one" maxlength="120" placeholder="联系方式（选填，方便管理员找你核实）" />
        <p v-if="reportError" class="report-err">{{ reportError }}</p>
        <p v-if="reportDone" class="report-done">{{ reportDone }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" type="button" @click="reportOpen = false">取消</button>
          <button class="btn-danger" type="button" :disabled="reportSending" @click="submitReport">
            {{ reportSending ? '提交中…' : '提交举报' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDelete" class="modal-mask" @click.self="showDelete = false">
      <div class="modal">
        <h3>删除这个帖子？</h3>
        <p>帖子、下面的回复、点赞和收藏记录都会从数据库里一起删掉，删了找不回来。</p>
        <div class="modal-actions">
          <button class="btn-cancel" type="button" @click="showDelete = false">再想想</button>
          <button class="btn-danger" type="button" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.state {
  padding: 70px 0;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}
.post-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: #6b655a;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.act:hover {
  border-color: #d9d3c7;
  color: var(--ink);
}

.act:disabled {
  opacity: 0.55;
  cursor: default;
}

.act.on {
  color: #b4483f;
  border-color: #e8cfcb;
  background: #fbf3f1;
}

.act.danger {
  color: #b4483f;
  border-color: #e8cfcb;
}

.act.danger:hover {
  background: #fbf3f1;
}

.author-link { display: inline-flex; align-items: center; gap: 7px; color: inherit; }
.author-link:hover { color: var(--accent); }
.reply-check { float: left; margin: 2px 8px 0 0; }
.reply-like {
  display: inline-flex; align-items: center; gap: 3px; border: 0; background: transparent;
  color: #a8a196; font: inherit; font-size: 12px; cursor: pointer; padding: 0 2px;
}
.reply-like.on { color: #b4483f; }
.reply-like:disabled { opacity: 0.4; cursor: default; }
.bulk-bar {
  position: sticky; bottom: 12px; z-index: 20; display: flex; align-items: center; gap: 10px;
  margin: 14px 0 0; padding: 10px 13px; border-radius: 11px;
  background: #26221c; color: #fff; font-size: 13px;
  box-shadow: 0 10px 26px rgba(30, 26, 20, 0.24);
}
.bulk-bar button {
  border: 0; background: rgba(255, 255, 255, 0.16); color: #fff; height: 28px;
  padding: 0 11px; border-radius: 6px; font: inherit; font-size: 12.5px; cursor: pointer;
}
.bulk-bar button.ghost { background: transparent; color: #cfc8bb; }
.lb {
  position: fixed; inset: 0; z-index: 80; background: rgba(18, 16, 12, 0.9);
  display: grid; place-items: center; padding: 40px;
}
.lb-img { max-width: 92vw; max-height: 86vh; object-fit: contain; border-radius: 6px; }
.lb-close {
  position: absolute; top: 14px; right: 18px; border: 0; background: transparent;
  color: #e8e2d6; font-size: 30px; line-height: 1; cursor: pointer;
}
.lb-nav {
  position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px;
  border-radius: 50%; border: 0; background: rgba(255, 255, 255, 0.14); color: #fff;
  font-size: 26px; line-height: 1; cursor: pointer;
}
.lb-nav.prev { left: 18px; }
.lb-nav.next { right: 18px; }
.lb-count { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); color: #cfc8bb; font-size: 12px; }
.report-tip { font-size: 12.5px; color: var(--muted); margin: 0 0 12px; }
.report-input {
  width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 8px;
  padding: 9px 11px; font: inherit; font-size: 13px; outline: 0; resize: vertical;
}
.report-input.one { margin-top: 9px; height: 36px; resize: none; }
.report-err { color: #b4432f; font-size: 12.5px; }
.report-done { color: #3e5c4b; font-size: 12.5px; }
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(38, 34, 28, 0.34);
  backdrop-filter: blur(2px);
}

.modal {
  width: min(400px, 100%);
  background: #fff;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 24px 60px rgba(20, 18, 14, 0.22);
}

.modal h3 {
  margin: 0 0 8px;
  font-size: 17px;
}

.modal p {
  margin: 0 0 18px;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

.btn-cancel {
  height: 36px;
  padding: 0 15px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.btn-danger {
  height: 36px;
  padding: 0 15px;
  border: 0;
  border-radius: 8px;
  background: #b4483f;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.6;
}

.act-msg {
  font-size: 12.5px;
  color: var(--accent);
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
  word-break: break-word;
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
.post-body :deep(img[src^="/emoji/"]) {
  display: inline-block;
  width: 22px;
  height: 22px;
  margin: 0 1px;
  vertical-align: -4px;
  border-radius: 0;
}
.post-body :deep(.mention-link) {
  color: #3b5bdb;
  background: #eef1fc;
  padding: 0 3px;
  border-radius: 4px;
  font-weight: 500;
}
.post-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  display: block;
  margin: 12px 0;
}
.post-body :deep(img[data-width]) {
  max-width: none;
}
.post-body :deep(img.img-spoiler) {
  filter: blur(16px);
  cursor: zoom-in;
  transition: filter 0.18s ease;
}
.post-body :deep(video) {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
  background: #000;
  display: block;
}
.post-body :deep(a) {
  color: #2b5cad;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.post-body :deep(.lnk-ico) {
  display: inline-flex;
  vertical-align: -2px;
  margin-right: 3px;
}
.post-body :deep(.lnk-txt) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  margin-right: 4px;
  vertical-align: -2px;
}
.post-body :deep(h2) {
  font-size: 21px;
  margin: 20px 0 10px;
}
.post-body :deep(h3) {
  font-size: 17px;
  margin: 16px 0 8px;
}
.post-body :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 12px;
  color: var(--muted);
  margin: 12px 0;
}
.post-body :deep(ul),
.post-body :deep(ol) {
  padding-left: 22px;
  margin: 10px 0;
}
.post-body :deep(pre) {
  background: #f4f1ea;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  font-size: 13px;
}
.reply-btn {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 12.5px;
  cursor: pointer;
  padding: 2px 4px;
}
.reply-btn:hover {
  color: var(--accent);
}
.reply-at {
  color: var(--accent);
  font-size: 13.5px;
}
.reply-target {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 8px;
}
.reply-target button {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  color: var(--muted);
}
</style>
