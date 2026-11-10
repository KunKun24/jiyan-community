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
    <aside class="side">
      <p class="side-title">板块</p>
      <RouterLink class="side-item" :class="{ active: !currentSlug }" to="/forum">
        <span>全部</span>
        <em>{{ total }}</em>
      </RouterLink>
      <RouterLink
        v-for="c in categories"
        :key="c.id"
        class="side-item"
        :class="{ active: currentSlug === c.slug }"
        :to="`/forum?category=${c.slug}`"
      >
        <span>{{ c.name }}</span>
        <em>{{ c.post_count }}</em>
      </RouterLink>
    </aside>

    <section class="feed">
      <header class="feed-head">
        <h1>{{ heading }}</h1>
        <p>{{ subheading }}</p>
      </header>

      <div v-if="loading" class="empty">加载中…</div>
      <div v-else-if="!posts.length" class="empty">
        这里还空着。发第一条帖子，给大家开个头。
      </div>

      <article v-for="p in posts" :key="p.id" class="row">
        <RouterLink class="row-title" :to="`/post/${p.id}`">{{ p.title }}</RouterLink>
        <p v-if="p.excerpt" class="row-excerpt">{{ p.excerpt }}</p>
        <div class="row-meta">
          <span class="tag">{{ p.category.name }}</span>
          <span>{{ p.author.username }}</span>
          <span>{{ timeAgo(p.createdAt) }}</span>
          <span class="dot">·</span>
          <span>{{ p.replyCount }} 回复</span>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.forum {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 30px;
  align-items: start;
}

.side {
  position: sticky;
  top: 88px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.side-title {
  margin: 0 0 8px;
  padding: 0 10px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.side-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 14.5px;
  color: #4b463d;
  transition: background 0.15s ease, color 0.15s ease;
}

.side-item em {
  font-style: normal;
  font-size: 12.5px;
  color: #a8a196;
}

.side-item:hover {
  background: #efece5;
}

.side-item.active {
  background: #e9e5db;
  color: var(--ink);
  font-weight: 600;
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

@media (max-width: 860px) {
  .forum {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .side {
    position: static;
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 4px;
  }
  .side-title {
    display: none;
  }
  .side-item {
    flex: none;
    gap: 8px;
    border: 1px solid var(--line);
    background: #fff;
  }
  .side-item em {
    font-size: 12px;
  }
}
</style>
