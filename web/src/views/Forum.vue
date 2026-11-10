<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '../api'
import { timeAgo } from '../format'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  post_count: number
}

interface PostItem {
  id: number
  title: string
  excerpt: string
  cover?: string | null
  imageCount?: number
  views: number
  replyCount: number
  createdAt: string
  lastReplyAt: string | null
  author: { id: number; username: string }
  category: { id: number; name: string; slug: string }
}

const route = useRoute()
const categories = ref<Category[]>([])
const posts = ref<PostItem[]>([])
const total = ref(0)
const loading = ref(true)

const currentSlug = computed(() => String(route.query.category || ''))
const currentCategory = computed(() => categories.value.find((c) => c.slug === currentSlug.value))
const heading = computed(() => currentCategory.value?.name || '最新讨论')
const subheading = computed(
  () => currentCategory.value?.description || '这里只有帖子、回复，和认真说话的人。',
)

async function loadCategories() {
  const r = await get<{ categories: Category[] }>('/api/categories')
  if (r.ok) categories.value = r.data?.categories ?? []
}

async function loadPosts() {
  loading.value = true
  const qs = currentSlug.value ? `?category=${encodeURIComponent(currentSlug.value)}` : ''
  const r = await get<{ posts: PostItem[]; total: number }>(`/api/posts${qs}`)
  if (r.ok) {
    posts.value = r.data?.posts ?? []
    total.value = r.data?.total ?? 0
  }
  loading.value = false
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadPosts()])
})

watch(
  () => route.query.category,
  () => loadPosts(),
)
</script>

<template>
  <div class="forum">
    <header class="feed-head">
      <h1>{{ heading }}</h1>
      <p>{{ subheading }}</p>
    </header>

    <nav class="chips" aria-label="板块分类">
      <RouterLink class="chip" :class="{ active: !currentSlug }" to="/forum">
        全部 <em>{{ total }}</em>
      </RouterLink>
      <RouterLink
        v-for="c in categories"
        :key="c.id"
        class="chip"
        :class="{ active: currentSlug === c.slug }"
        :to="`/forum?category=${c.slug}`"
      >
        {{ c.name }} <em>{{ c.post_count }}</em>
      </RouterLink>
    </nav>

    <section class="feed">
      <div v-if="loading" class="empty">加载中…</div>
      <div v-else-if="!posts.length" class="empty">
        这里还空着。发第一条帖子，给大家开个头。
      </div>

      <article v-for="p in posts" :key="p.id" class="row" :class="{ 'has-thumb': p.cover }">
        <RouterLink v-if="p.cover" class="row-thumb" :to="`/post/${p.id}`">
          <img :src="p.cover" alt="" loading="lazy" />
          <span v-if="(p.imageCount || 0) > 1" class="thumb-more">+{{ (p.imageCount || 1) - 1 }}</span>
        </RouterLink>
        <RouterLink class="row-title" :to="`/post/${p.id}`">{{ p.title }}</RouterLink>
        <p v-if="p.excerpt" class="row-excerpt">{{ p.excerpt }}</p>
        <div class="row-meta">
          <span class="tag">{{ p.category.name }}</span>
          <RouterLink class="author-name" :to="`/u/${p.author.id}`">{{ p.author.username }}</RouterLink>
          <span>{{ timeAgo(p.createdAt) }}</span>
          <span class="dot">·</span>
          <span>{{ p.replyCount }} 回复</span>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.author-name { color: #a8a196; }
.author-name:hover { color: var(--accent); }
.forum {
  display: flex;
  flex-direction: column;
}

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 0 18px;
  margin-bottom: 6px;
  scrollbar-width: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  font-size: 13.5px;
  color: #4b463d;
  white-space: nowrap;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.chip em {
  font-style: normal;
  font-size: 11.5px;
  opacity: 0.55;
}

.chip:hover {
  border-color: #d9d3c7;
}

.chip.active {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}







.feed-head {
  padding: 4px 2px 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 6px;
}

.feed-head h1 {
  margin: 0;
  font-size: 27px;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.feed-head p {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--muted);
}

.empty {
  padding: 60px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}

.row {
  padding: 18px 2px;
  border-bottom: 1px solid var(--line);
}

.row-title {
  display: block;
  font-size: 16.5px;
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: -0.01em;
}

.row-title:hover {
  color: var(--accent);
}

.row-excerpt {
  margin: 6px 0 0;
  font-size: 13.8px;
  color: var(--muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: #918a7d;
}

.tag {
  padding: 2px 8px;
  border-radius: 5px;
  background: #f0ede6;
  color: #6b6457;
}

.dot {
  color: #c9c3b7;
}

@media (max-width: 700px) {
  .chips {
    padding-bottom: 14px;
  }
}

.row.has-thumb {
  display: grid;
  grid-template-columns: 96px 1fr;
  grid-template-areas: 'thumb title' 'thumb excerpt' 'thumb meta';
  column-gap: 14px;
}
.row.has-thumb .row-title { grid-area: title; }
.row.has-thumb .row-excerpt { grid-area: excerpt; }
.row.has-thumb .row-meta { grid-area: meta; }
.row-thumb {
  grid-area: thumb;
  position: relative;
  align-self: start;
  width: 96px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1ede5;
  display: block;
}
.row-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-more {
  position: absolute;
  right: 4px;
  bottom: 4px;
  background: rgba(22, 21, 15, 0.72);
  color: #fff;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 10px;
}
</style>
