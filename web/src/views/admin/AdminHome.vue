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
import { onMounted, ref } from 'vue'
import { get } from '../../api'

const s = ref<Record<string, number>>({})
const recent = ref<Array<Record<string, string>>>([])

async function load() {
  const r = await get<Record<string, number> & { recent: Array<Record<string, string>> }>('/api/admin/stats')
  if (r.ok && r.data) {
    const { recent: list, ...rest } = r.data
    s.value = rest
    recent.value = list || []
  }
}

onMounted(load)
</script>
