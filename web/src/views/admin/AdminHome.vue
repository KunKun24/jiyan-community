<template>
  <div>
    <div class="admin-page-head">
      <div><h1>总览</h1><p>今天社区的情况</p></div>
      <button class="admin-btn ghost" @click="load">刷新</button>
    </div>
    <div class="admin-grid">
      <div class="admin-stat"><b>{{ s.users ?? '—' }}</b><span>注册用户 · 今日 +{{ s.todayUsers ?? 0 }}</span></div>
      <div class="admin-stat"><b>{{ s.posts ?? '—' }}</b><span>帖子总数 · 今日 +{{ s.todayPosts ?? 0 }}</span></div>
      <div class="admin-stat"><b>{{ s.publicPosts ?? '—' }}</b><span>公开帖子</span></div>
      <div class="admin-stat"><b>{{ s.replies ?? '—' }}</b><span>回复总数</span></div>
      <div class="admin-stat"><b>{{ s.pendingReports ?? '—' }}</b><span>待处理举报</span></div>
    </div>

    <div class="admin-card" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h2 style="font-size:15px">近 14 天趋势</h2>
        <div class="legend">
          <span><i style="background:#3e5c4b"></i>注册</span>
          <span><i style="background:#b98b4a"></i>发帖</span>
          <span><i style="background:#7d9bb5"></i>回复</span>
        </div>
      </div>
      <svg class="trend" viewBox="0 0 760 220" preserveAspectRatio="none">
        <line v-for="i in 4" :key="i" x1="34" :y1="20 + (i - 1) * 50" x2="750" :y2="20 + (i - 1) * 50" stroke="#efeae1" stroke-width="1" />
        <text v-for="(t, i) in yTicks" :key="'y' + i" x="4" :y="24 + i * 50" class="axis">{{ t }}</text>
        <polyline v-for="sr in series" :key="sr.key" :points="sr.points" fill="none" :stroke="sr.color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <text v-for="(d, i) in labels" :key="'x' + i" :x="34 + i * (716 / 13)" y="212" class="axis" text-anchor="middle">{{ d }}</text>
      </svg>
    </div>

    <div class="admin-card" style="margin-top:16px">
      <h2 style="font-size:15px;margin-bottom:10px">最近的帖子</h2>
      <table class="admin-table">
        <thead><tr><th>标题</th><th>作者</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>
          <tr v-for="p in recent" :key="p.id">
            <td><RouterLink :to="`/post/${p.id}`" style="color:var(--ink)">{{ p.title }}</RouterLink></td>
            <td>{{ p.username }}</td>
            <td><span class="admin-badge" :class="p.status === 'public' ? 'ok' : ''">{{ p.status === 'public' ? '公开' : '私密' }}</span></td>
            <td style="color:var(--muted)">{{ p.created_at.slice(5, 16) }}</td>
          </tr>
          <tr v-if="!recent.length"><td colspan="4" class="admin-empty">还没有帖子</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { get } from '../../api'

interface Trend { day: string; users: number; posts: number; replies: number }
const s = ref<Record<string, number>>({})
const recent = ref<Array<Record<string, string>>>([])
const trends = ref<Trend[]>([])

const series = computed(() => {
  const max = Math.max(1, ...trends.value.flatMap((t) => [t.users, t.posts, t.replies]))
  const n = trends.value.length || 1
  const step = n > 1 ? 716 / (n - 1) : 0
  const pts = (pick: (t: Trend) => number) =>
    trends.value.map((t, i) => `${34 + i * step},${190 - (pick(t) / max) * 170}`).join(' ')
  return [
    { key: 'users', color: '#3e5c4b', points: pts((t) => t.users) },
    { key: 'posts', color: '#b98b4a', points: pts((t) => t.posts) },
    { key: 'replies', color: '#7d9bb5', points: pts((t) => t.replies) },
  ]
})
const labels = computed(() => trends.value.map((t) => t.day.slice(5).replace('-', '/')))
const yTicks = computed(() => {
  const max = Math.max(1, ...trends.value.flatMap((t) => [t.users, t.posts, t.replies]))
  return [max, Math.round(max * 0.66), Math.round(max * 0.33), 0]
})

async function load() {
  const r = await get<Record<string, number> & { recent: Array<Record<string, string>> }>('/api/admin/stats')
  if (r.ok && r.data) {
    const { recent: list, ...rest } = r.data
    s.value = rest
    recent.value = list || []
  }
  const t = await get<{ items: Trend[] }>('/api/admin/trends?days=14')
  if (t.ok && t.data) trends.value = t.data.items
}

onMounted(load)
</script>

<style scoped>
.legend { display: flex; gap: 14px; font-size: 12px; color: var(--muted); }
.legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; }
.trend { width: 100%; height: 220px; }
.axis { font-size: 10px; fill: #a8a196; }
</style>
