<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '../api'
import { fmtNum, timeAgo } from '../format'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  post_count: number
}

interface Tag {
  name: string
  count: number
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
  tags: string | null
  author: { username: string }
}

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const category = ref<Category | null>(null)
const tags = ref<Tag[]>([])
const posts = ref<PostItem[]>([])
const loading = ref(true)
const notFound = ref(false)

const tag = ref('')
const sort = ref<'new' | 'hot'>('new')

async function loadMeta() {
  const r = await get<{ category: Category; tags: Tag[] }>(`/api/categories/${encodeURIComponent(slug.value)}`)
  if (!r.ok) {
    notFound.value = true
    return
  }
  category.value = r.data?.category ?? null
  tags.value = r.data?.tags ?? []
}

async function loadPosts() {
  loading.value = true
  const qs = new URLSearchParams({ category: slug.value, sort: sort.value })
  if (tag.value) qs.set('tag', tag.value)
  const r = await get<{ posts: PostItem[] }>(`/api/posts?${qs.toString()}`)
  if (r.ok) posts.value = r.data?.posts ?? []
  loading.value = false
}

onMounted(async () => {
  await loadMeta()
  if (!notFound.value) await loadPosts()
  else loading.value = false
})

watch([tag, sort], loadPosts)
watch(slug, async () => {
  loading.value = true
  await loadMeta()
  await loadPosts()
})
</script>

<template>
  <div v-if="notFound" class="state">
    这个板块不存在。<RouterLink class="link" to="/categories">回板块列表</RouterLink>
  </div>

  <div v-else class="cat">
    <header class="head">
      <p class="crumb">
        <RouterLink to="/categories">← 全部板块</RouterLink>
      </p>
      <h1>{{ category?.name }}</h1>
      <p class="desc">{{ category?.description || '这个板块还没有简介。' }}</p>
    </header>

    <nav v-if="tags.length" class="chips" aria-label="板块内标签">
      <button class="chip" :class="{ active: !tag }" type="button" @click="tag = ''">全部</button>
      <button
        v-for="t in tags"
        :key="t.name"
        class="chip"
        :class="{ active: tag === t.name }"
        type="button"
        @click="tag = t.name"
      >
        {{ t.name }} <em>{{ t.count }}</em>
      </button>
    </nav>

    <div class="toolbar">
      <span class="count">
        {{ tag ? `「${tag}」` : '' }}{{ category?.post_count ?? 0 }} 个帖子
      </span>
      <div class="sort">
        <button type="button" :class="{ active: sort === 'new' }" @click="sort = 'new'">最新</button>
        <button type="button" :class="{ active: sort === 'hot' }" @click="sort = 'hot'">最热</button>
      </div>
    </div>

    <div v-if="loading" class="state">加载中…</div>
    <div v-else-if="!posts.length" class="state">
      这里还没有帖子。{{ tag ? '换个标签看看，或者' : '' }}发第一条，给大家开个头。
    </div>

    <div v-else class="feed">
      <article v-for="p in posts" :key="p.id" class="row" :class="{ 'has-thumb': p.cover }">
        <RouterLink v-if="p.cover" class="row-thumb" :to="`/post/${p.id}`">
          <img :src="p.cover" alt="" loading="lazy" />
          <span v-if="(p.imageCount || 0) > 1" class="thumb-more">+{{ (p.imageCount || 1) - 1 }}</span>
        </RouterLink>
        <RouterLink class="row-title" :to="`/post/${p.id}`">{{ p.title }}</RouterLink>
        <p v-if="p.excerpt" class="row-excerpt">{{ p.excerpt }}</p>
        <div class="row-meta">
          <span v-for="name in (p.tags || '').split(',').filter(Boolean)" :key="name" class="tag">{{ name }}</span>
          <span>{{ p.author.username }}</span>
          <span>{{ timeAgo(p.createdAt) }}</span>
          <span class="dot">·</span>
          <span>{{ p.replyCount }} 回复</span>
          <span class="dot">·</span>
          <span class="eye-wrap"><svg class="eye" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>{{ fmtNum(p.views) }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.head {
  padding: 2px 0 18px;
}

.crumb {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--muted);
}

.crumb a {
  color: var(--muted);
}

.crumb a:hover {
  color: var(--ink);
}

.head h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.025em;
}

.desc {
  margin: 9px 0 0;
  font-size: 14px;
  color: var(--muted);
}

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 14px;
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
  height: 33px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: #4b463d;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.chip em {
  font-style: normal;
  font-size: 11px;
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

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0 8px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 4px;
}

.count {
  font-size: 12.5px;
  color: var(--muted);
}

.sort {
  display: flex;
  gap: 4px;
  background: #f0ece4;
  border-radius: 8px;
  padding: 3px;
}

.sort button {
  border: 0;
  background: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12.5px;
  font-family: inherit;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.sort button.active {
  background: #fff;
  color: var(--ink);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(38, 34, 28, 0.08);
}

.feed {
  display: flex;
  flex-direction: column;
}

.row {
  padding: 17px 2px;
  border-bottom: 1px solid #efeae1;
}

.row:hover .row-title {
  color: var(--accent);
}

.row-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--ink);
  transition: color 0.15s ease;
}

.row-excerpt {
  margin: 6px 0 0;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-meta {
  margin-top: 9px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  font-size: 12.5px;
  color: #a09a8e;
}

.tag {
  padding: 2px 7px;
  border-radius: 5px;
  background: #f4f1ec;
  color: #6b655a;
  font-size: 11.5px;
}

.eye {
  vertical-align: -1px;
  margin-right: 3px;
  opacity: 0.65;
}

.eye-wrap {
  display: inline-flex;
  align-items: center;
}

.dot {
  color: #cfc8bb;
}

.state {
  padding: 60px 0;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.link {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 700px) {
  .head h1 {
    font-size: 23px;
  }
  .row-title {
    font-size: 15px;
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
