<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, post } from '../api'
import { store } from '../store'
import { fmtNum, timeAgo, initial } from '../format'

interface HomeUser {
  id: number
  username: string
  avatar: string | null
  bio: string
  location: string
  website: string
  contact: string
  createdAt: string
  isMe: boolean
  isFollowing: boolean
  level: { level: number; name: string; growth: number; nextName: string | null; nextAt: number | null; progress: number }
}
interface HomePost {
  id: number
  title: string
  views: number
  replyCount: number
  likeCount: number
  createdAt: string
  category: { name: string; slug: string }
  cover: string | null
  imageCount: number
}

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const user = ref<HomeUser | null>(null)
const stats = ref({ posts: 0, replies: 0, likes: 0, followers: 0, following: 0 })
const followBusy = ref(false)
const posts = ref<HomePost[]>([])
const reportOpen = ref(false)
const reportReason = ref('')
const reportContact = ref('')
const reportErr = ref('')
const reportSending = ref(false)

async function submitReport() {
  if (!user.value) return
  reportErr.value = ''
  if (reportReason.value.trim().length < 5) { reportErr.value = '请把原因写清楚一点（至少 5 个字）'; return }
  reportSending.value = true
  const r = await post('/api/reports', {
    targetType: 'user',
    targetId: user.value.id,
    reason: reportReason.value.trim(),
    contact: reportContact.value.trim(),
  })
  reportSending.value = false
  if (!r.ok) { reportErr.value = r.msg; return }
  reportOpen.value = false
  reportReason.value = ''
  reportContact.value = ''
  alert('已收到，管理员会看')
}

async function toggleFollow() {
  if (!user.value || followBusy.value) return
  followBusy.value = true
  const r = await post<{ following: boolean }>(`/api/follows/${user.value.id}`, {})
  followBusy.value = false
  if (!r.ok || !r.data) return
  user.value.isFollowing = r.data.following
  stats.value.followers += r.data.following ? 1 : -1
}

async function openChat() {
  if (!user.value) return
  const r = await post<{ conversationId: number }>('/api/conversations', { userId: user.value.id })
  if (!r.ok || !r.data) return
  router.push(`/messages?c=${r.data.conversationId}`)
}

async function load() {
  loading.value = true
  error.value = ''
  const id = Number(route.params.id)
  if (!id) {
    error.value = '用户不存在'
    loading.value = false
    return
  }
  const r = await get<{ user: HomeUser; stats: typeof stats.value; posts: HomePost[] }>(`/api/users/${id}`)
  loading.value = false
  if (!r.ok || !r.data) {
    error.value = r.msg || '用户不存在'
    return
  }
  user.value = r.data.user
  stats.value = r.data.stats
  posts.value = r.data.posts
  document.title = `${r.data.user.username} · 极验社区`
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="page">
    <div v-if="loading" class="empty">加载中…</div>
    <div v-else-if="error" class="empty">{{ error }}</div>

    <template v-else-if="user">
      <section class="hero-card">
        <div class="hero-top">
          <img v-if="user.avatar" class="big-avatar" :src="user.avatar" alt="" />
          <span v-else class="big-avatar letter">{{ initial(user.username) }}</span>
          <div class="ident">
            <h1>
              {{ user.username }}
              <span class="lv" :title="`成就值 ${user.level.growth}`">Lv{{ user.level.level }} {{ user.level.name }}</span>
            </h1>
            <p class="meta">
              <span>加入于 {{ user.createdAt.slice(0, 10) }}</span>
              <span v-if="user.location">· {{ user.location }}</span>
            </p>
          </div>
          <RouterLink v-if="user.isMe" class="btn-ghost" to="/me">这是我的主页 · 去改资料</RouterLink>
          <template v-else-if="store.user">
            <button
              class="btn-follow"
              :class="{ on: user.isFollowing }"
              type="button"
              :disabled="followBusy"
              @click="toggleFollow"
            >{{ followBusy ? '…' : user.isFollowing ? '已关注' : '关注' }}</button>
            <button class="btn-ghost" type="button" @click="openChat">私信</button>
            <button class="btn-ghost" type="button" @click="reportOpen = true">举报</button>
          </template>
        </div>

        <p v-if="user.bio" class="bio">{{ user.bio }}</p>
        <p v-else class="bio muted">{{ user.isMe ? '还没写个人简介，去个人资料补一句。' : '这个人很安静，什么都没写。' }}</p>

        <div class="links">
          <a v-if="user.website" :href="user.website" target="_blank" rel="noopener noreferrer" class="link-chip">网站</a>
          <span v-if="user.contact" class="link-chip">联系：{{ user.contact }}</span>
        </div>

        <div class="stats">
          <div class="stat"><b>{{ fmtNum(stats.posts) }}</b><span>帖子</span></div>
          <div class="stat"><b>{{ fmtNum(stats.replies) }}</b><span>回复</span></div>
          <div class="stat"><b>{{ fmtNum(stats.likes) }}</b><span>获赞</span></div>
          <div class="stat"><b>{{ fmtNum(stats.followers) }}</b><span>粉丝</span></div>
          <div class="stat"><b>{{ fmtNum(stats.following) }}</b><span>关注</span></div>
        </div>

        <div class="progress">
          <div class="bar"><i :style="{ width: user.level.progress + '%' }"></i></div>
          <span v-if="user.level.nextName">距 {{ user.level.nextName }} 还差 {{ user.level.nextAt! - user.level.growth }}</span>
          <span v-else>已到最高等级</span>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">TA 的帖子 <em>{{ posts.length }}</em></h2>
        <div v-if="!posts.length" class="empty">还没有公开的帖子。</div>
        <RouterLink v-for="p in posts" :key="p.id" class="row" :to="`/post/${p.id}`">
          <div class="thumb-wrap">
            <img v-if="p.cover" :src="p.cover" class="thumb" alt="" />
            <span v-if="p.imageCount > 1" class="plus">+{{ p.imageCount - 1 }}</span>
          </div>
          <div class="row-main">
            <div class="row-title">{{ p.title }}</div>
            <div class="row-meta">
              {{ p.category.name }} · {{ timeAgo(p.createdAt) }}
              <span class="views">{{ fmtNum(p.views) }} 浏览</span>
            </div>
          </div>
          <span class="arrow">→</span>
        </RouterLink>
      </section>
    </template>

    <div v-if="reportOpen && user" class="rp-mask" @click.self="reportOpen = false">
      <div class="rp-card">
        <h3>举报 {{ user.username }}</h3>
        <textarea v-model="reportReason" rows="4" placeholder="发生了什么？至少 5 个字"></textarea>
        <input v-model="reportContact" placeholder="联系方式（选填，方便管理员联系你）" />
        <p v-if="reportErr" class="rp-err">{{ reportErr }}</p>
        <div class="rp-acts">
          <button class="btn-ghost" type="button" @click="reportOpen = false">取消</button>
          <button class="rp-primary" type="button" :disabled="reportSending" @click="submitReport">{{ reportSending ? '提交中…' : '提交举报' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 860px; margin: 0 auto; padding: 26px 18px 60px; }
.empty { padding: 40px 0; text-align: center; color: var(--muted); font-size: 14px; }
.hero-card, .card {
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 6px 20px rgba(38, 34, 28, 0.05); padding: 22px;
}
.card { margin-top: 16px; }
.hero-top { display: flex; align-items: center; gap: 14px; }
.big-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.big-avatar.letter {
  display: grid; place-items: center; background: #e8eee9; color: #3e5c4b;
  font-size: 24px; font-weight: 700;
}
.ident { flex: 1; min-width: 0; }
.ident h1 { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 20px; }
.lv { font-size: 11px; font-weight: 600; color: #3e5c4b; background: #edf3ee; padding: 2px 7px; border-radius: 5px; }
.meta { margin: 4px 0 0; font-size: 12.5px; color: var(--muted); display: flex; gap: 6px; }
.btn-follow {
  height: 32px; padding: 0 14px; border-radius: 8px; font-size: 12.5px;
  border: 1px solid var(--accent); background: var(--accent); color: #fff;
}
.btn-follow.on { background: #fff; color: var(--accent); }
.btn-ghost {
  height: 32px; padding: 0 12px; display: inline-flex; align-items: center;
  border: 1px solid var(--line); border-radius: 8px; font-size: 12.5px; color: var(--ink);
}
.bio { margin: 14px 0 0; font-size: 14px; line-height: 1.7; }
.bio.muted { color: #a8a196; }
.links { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.link-chip { font-size: 12px; color: var(--muted); background: #f6f3ee; padding: 3px 8px; border-radius: 5px; }
.stats { display: flex; gap: 28px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #f0ece4; }
.stat b { display: block; font-size: 17px; }
.stat span { font-size: 12px; color: var(--muted); }
.progress { margin-top: 14px; display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--muted); }
.bar { flex: 1; height: 5px; border-radius: 3px; background: #efeae1; overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--accent); border-radius: 3px; }
.card-title { margin: 0 0 14px; font-size: 15px; }
.card-title em { font-style: normal; font-size: 12px; color: var(--muted); margin-left: 6px; }
.row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0ece4; }
.row:last-child { border-bottom: 0; }
.thumb-wrap { position: relative; flex: none; }
.thumb { width: 76px; height: 56px; border-radius: 8px; object-fit: cover; display: block; }
.plus {
  position: absolute; right: 4px; bottom: 4px; background: rgba(20, 18, 14, 0.62);
  color: #fff; font-size: 10px; padding: 1px 4px; border-radius: 4px;
}
.row-main { flex: 1; min-width: 0; }
.row-title { font-size: 14px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-meta { margin-top: 4px; font-size: 12px; color: #a8a196; }
.views { margin-left: 8px; }
.arrow { color: #c3bcb0; font-size: 13px; }
@media (max-width: 600px) {
  .hero-top { flex-wrap: wrap; }
  .stats { gap: 18px; }
}
</style>
<style scoped>
.rp-mask { position: fixed; inset: 0; z-index: 90; background: rgba(38,34,28,.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.rp-card { background: #fff; border-radius: 14px; width: min(440px, 100%); padding: 22px; border: 1px solid var(--line); box-shadow: 0 20px 50px rgba(38,34,28,.2); }
.rp-card h3 { font-size: 16px; margin-bottom: 12px; }
.rp-card textarea, .rp-card input { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit; outline: none; margin-bottom: 10px; }
.rp-card textarea:focus, .rp-card input:focus { border-color: var(--accent); }
.rp-err { color: #b4432f; font-size: 13px; margin-bottom: 8px; }
.rp-acts { display: flex; justify-content: flex-end; gap: 8px; }
.rp-primary { height: 36px; padding: 0 16px; border: 0; border-radius: 8px; background: var(--accent); color: #fff; font-size: 13.5px; cursor: pointer; }
.rp-primary:disabled { opacity: .6; }
</style>
