<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { get } from '../api'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  post_count: number
}

const cats = ref<Category[]>([])
const loading = ref(true)

onMounted(async () => {
  const r = await get<{ categories: Category[] }>('/api/categories')
  if (r.ok) cats.value = r.data?.categories ?? []
  loading.value = false
})
</script>

<template>
  <div class="cats">
    <header class="head">
      <h1>板块</h1>
      <p>按兴趣逛，每个板块下都是同类话题。</p>
    </header>

    <div v-if="loading" class="state">加载中…</div>

    <div v-else class="grid">
      <RouterLink
        v-for="c in cats"
        :key="c.id"
        class="card"
        :to="{ path: '/forum', query: { category: c.slug } }"
      >
        <div class="card-top">
          <h2>{{ c.name }}</h2>
          <span class="count">{{ c.post_count }} 帖</span>
        </div>
        <p>{{ c.description || '这个板块还没有简介。' }}</p>
        <span class="go">进去看看 →</span>
      </RouterLink>
    </div>

    <p v-if="!loading && !cats.length" class="state">还没有板块。</p>
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

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 13px;
  color: inherit;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.card:hover {
  border-color: #d9d3c7;
  box-shadow: 0 6px 20px rgba(38, 34, 28, 0.06);
  transform: translateY(-1px);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.count {
  flex: none;
  font-size: 12px;
  color: var(--muted);
  background: #f4f1ec;
  border-radius: 6px;
  padding: 3px 8px;
}

.card p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--muted);
}

.go {
  margin-top: auto;
  font-size: 12.5px;
  color: var(--accent);
  font-weight: 600;
}

.state {
  padding: 60px 0;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .head h1 {
    font-size: 22px;
  }
  .card {
    padding: 17px;
  }
}
</style>
