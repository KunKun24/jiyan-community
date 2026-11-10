<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '../api'
import { fmtNum, timeAgo, initial } from '../format'

interface PostHit {
  id: number; title: string; excerpt: string; views: number; replyCount: number
  likeCount: number; createdAt: string
  author: { username: string; avatar: string | null }
  category: { name: string; slug: string }
}
interface UserHit { id: number; username: string; avatar: string | null; bio: string | null; post_count: number }

const route = useRoute()
const router = useRouter()
const keyword = ref(String(route.query.q || ''))
const type = ref<'posts' | 'users'>(route.query.type === 'users' ? 'users' : 'posts')
const loading = ref(false)
const posts = ref<PostHit[]>([])
const users = ref<UserHit[]>([])
const searched = ref(false)

let timer: number | undefined
async function run() {
  const q = keyword.value.trim()
  router.replace({ path: '/search', query: q ? { q, type: type.value } : {} })
  if (!q) {
    posts.value = []
    users.value = []
    searched.value = false
    return
  }
  loading.value = true
  const r = await get<{ items: PostHit[] | UserHit[] }>(
    `/api/search?q=${encodeURIComponent(q)}&type=${type.value}`,
  )
  loading.value = false
  searched.value = true
  if (type.value === 'posts') posts.value = (r.data?.items as PostHit[]) || []
  else users.value = (r.data?.items as UserHit[]) || []
}

function onInput() {
  window.clearTimeout(timer)
  timer = window.setTimeout(run, 320)
}

function switchType(t: 'posts' | 'users') {
  type.value = t
  run()
}

onMounted(run)
watch(() => route.query.q, (v) => {
  if (String(v || '') !== keyword.value) {
    keyword.value = String(v || '')
    run()
  }
})
</script>

<template>
  <div class="page">
    <div class="search-box">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
      </svg>
      <input v-model="keyword" placeholder="搜帖子、搜人" @input="onInput" @keyup.enter="run" />
    </div>

    <div class="seg">
      <button :class="{ on: type === 'posts' }" type="button" @click="switchType('posts')">帖子</button>
      <button :class="{ on: type === 'users' }" type="button" @click="switchType('users')">用户</button>
    </div>

    <div v-if="loading" class="hint">搜索中…</div>
    <div v-else-if="!searched" class="hint">输入关键词开始搜索。</div>

    <template v-else-if="type === 'posts'">
      <div v-if="!posts.length" class="hint">没找到相关帖子。</div>
      <RouterLink v-for="p in posts" :key="p.id" class="hit" :to="`/post/${p.id}`">
        <div class="hit-title">{{ p.title }}</div>
        <p class="hit-excerpt">{{ p.excerpt }}</p>
        <div class="hit-meta">
          <span>{{ p.category.name }}</span>
          <span>{{ p.author.username }}</span>
          <span>{{ timeAgo(p.createdAt) }}</span>
          <span>{{ fmtNum(p.views) }} 浏览</span>
        </div>
      </RouterLink>
    </template>

    <template v-else>
      <div v-if="!users.length" class="hint">没找到这个用户。</div>
      <RouterLink v-for="u in users" :key="u.id" class="user-hit" :to="`/u/${u.id}`">
        <img v-if="u.avatar" class="avatar" :src="u.avatar" alt="" />
        <span v-else class="avatar letter">{{ initial(u.username) }}</span>
        <div class="u-main">
          <div class="u-name">{{ u.username }}</div>
          <div class="u-bio">{{ u.bio || '这个人很安静，什么都没写。' }}</div>
        </div>
        <span class="u-count">{{ u.post_count }} 帖</span>
      </RouterLink>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 760px; margin: 0 auto; padding: 26px 18px 60px; }
.search-box {
  display: flex; align-items: center; gap: 9px; padding: 0 14px;
  height: 46px; background: #fff; border: 1px solid var(--line);
  border-radius: 12px; color: #a8a196;
}
.search-box input { flex: 1; border: 0; outline: 0; font: inherit; font-size: 14.5px; background: transparent; color: var(--ink); }
.seg { display: flex; gap: 6px; margin: 14px 0 6px; }
.seg button {
  height: 30px; padding: 0 14px; border-radius: 7px; border: 1px solid var(--line);
  background: #fff; font: inherit; font-size: 13px; color: var(--muted); cursor: pointer;
}
.seg button.on { background: var(--accent); border-color: var(--accent); color: #fff; }
.hint { padding: 40px 0; text-align: center; color: var(--muted); font-size: 13.5px; }
.hit { display: block; padding: 14px 2px; border-bottom: 1px solid #efeae1; }
.hit-title { font-size: 15px; font-weight: 600; }
.hit-excerpt { margin: 5px 0 6px; font-size: 13px; color: var(--muted); line-height: 1.6; }
.hit-meta { display: flex; gap: 12px; font-size: 12px; color: #a8a196; }
.user-hit { display: flex; align-items: center; gap: 12px; padding: 13px 2px; border-bottom: 1px solid #efeae1; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex: none; }
.avatar.letter { display: grid; place-items: center; background: #e8eee9; color: #3e5c4b; font-weight: 700; }
.u-main { flex: 1; min-width: 0; }
.u-name { font-size: 14px; font-weight: 600; }
.u-bio { font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.u-count { font-size: 12px; color: #a8a196; }
</style>
