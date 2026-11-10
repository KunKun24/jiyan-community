<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { get } from '../api'
import { timeAgo } from '../format'

interface PostItem {
  id: number
  title: string
  views: number
  replyCount: number
  createdAt: string
  author: { username: string }
  category: { name: string }
}

const posts = ref<PostItem[]>([])
const loading = ref(true)

onMounted(async () => {
  const r = await get<{ posts: PostItem[] }>('/api/posts?sort=hot&size=30')
  if (r.ok) posts.value = r.data?.posts ?? []
  loading.value = false
})
</script>

<template>
  <div class="hot">
    <header class="head">
      <h1>热门</h1>
      <p>按被看过的次数排，看的人越多越靠前。</p>
    </header>

    <div v-if="loading" class="state">加载中…</div>
    <div v-else-if="!posts.length" class="state">还没有帖子。等有人来看，这里就会热起来。</div>

    <ol v-else class="list">
      <li v-for="(p, i) in posts" :key="p.id" class="item">
        <span class="rank" :class="{ top: i < 3 }">{{ i + 1 }}</span>
        <div class="body">
          <RouterLink class="title" :to="`/post/${p.id}`">{{ p.title }}</RouterLink>
          <p class="meta">
            <span class="tag">{{ p.category.name }}</span>
            {{ p.author.username }} · {{ timeAgo(p.createdAt) }}
          </p>
        </div>
        <span class="views">{{ p.views }} 浏览</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.head {
  padding: 2px 0 22px;
}

.head h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: -0.02em;
}

.head p {
  margin: 7px 0 0;
  font-size: 14px;
  color: var(--muted);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}

.item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0ece4;
}

.item:last-child {
  border-bottom: 0;
}

.rank {
  flex: none;
  width: 26px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #b3aca0;
  font-variant-numeric: tabular-nums;
}

.rank.top {
  color: var(--accent);
}

.body {
  min-width: 0;
  flex: 1;
}

.title {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title:hover {
  color: var(--accent);
}

.meta {
  margin: 5px 0 0;
  font-size: 12.5px;
  color: var(--muted);
}

.tag {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 7px;
  border-radius: 5px;
  background: #f4f1ec;
  font-size: 11.5px;
}

.views {
  flex: none;
  font-size: 12.5px;
  color: var(--muted);
}

.state {
  padding: 60px 0;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

@media (max-width: 700px) {
  .head h1 {
    font-size: 22px;
  }
  .item {
    padding: 14px;
    gap: 11px;
  }
  .views {
    display: none;
  }
}
</style>
