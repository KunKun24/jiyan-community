<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { get } from '../api'

interface Notice {
  id: number
  title: string
  content: string
  created_at: string
}

const notices = ref<Notice[]>([])
const loading = ref(true)

onMounted(async () => {
  const r = await get<{ notices: Notice[] }>('/api/notices')
  if (r.ok) notices.value = r.data?.notices ?? []
  loading.value = false
})
</script>

<template>
  <div class="notices">
    <header class="head">
      <h1>公告</h1>
      <p>站点的重要通知，都放在这里。</p>
    </header>

    <div v-if="loading" class="state">加载中…</div>
    <div v-else-if="!notices.length" class="state">还没有公告。</div>

    <article v-for="n in notices" :key="n.id" class="card">
      <h2>{{ n.title }}</h2>
      <p class="time">{{ n.created_at.slice(0, 16) }}</p>
      <p class="content">{{ n.content }}</p>
    </article>
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

.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 22px 24px;
  margin-bottom: 14px;
}

.card h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.time {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: #a8a196;
}

.content {
  margin: 14px 0 0;
  font-size: 14.5px;
  line-height: 1.8;
  color: #3a362e;
  white-space: pre-wrap;
  word-break: break-word;
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
  .card {
    padding: 18px 16px;
  }
}
</style>
