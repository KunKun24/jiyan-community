<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '../api'
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
const stats = ref({ posts: 0, replies: 0, likes: 0 })
const posts = ref<HomePost[]>([])

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
