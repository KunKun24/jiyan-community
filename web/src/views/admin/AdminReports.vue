<template>
  <div>
    <div class="admin-page-head"><div><h1>举报管理</h1><p>按时间倒序，最多显示 200 条</p></div></div>
    <div class="admin-toolbar">
      <button v-for="t in tabs" :key="t.k" class="admin-btn" :class="status === t.k ? '' : 'ghost'" @click="switchTab(t.k)">{{ t.label }}</button>
    </div>
    <div v-if="!items.length" class="admin-card"><p class="admin-empty">这里什么都没有</p></div>
    <div v-for="r in items" :key="r.id" class="admin-card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <span class="admin-badge warn">{{ r.target_type === 'post' ? '帖子' : r.target_type === 'user' ? '用户' : '评论' }}</span>
          <span class="admin-badge">{{ r.created_at.slice(5, 16) }}</span>
        </div>
        <RouterLink v-if="r.target_type === 'user'" :to="`/u/${r.target_id}`" style="font-size:13px">查看用户 →</RouterLink>
        <RouterLink v-else-if="r.post_id" :to="`/post/${r.post_id}`" style="font-size:13px">查看原文 →</RouterLink>
      </div>
      <p style="margin:10px 0 4px;font-weight:600">
        {{ r.target_type === 'user' ? `被举报用户：${r.target_user || '（已不存在）'}` : r.post_title || '（帖子已不存在）' }}
      </p>
      <p v-if="r.target_type === 'comment'" style="color:var(--muted);font-size:13px">被举报评论：{{ r.comment_content }}</p>
      <p style="margin-top:8px;font-size:13.5px"><b>原因：</b>{{ r.reason }}</p>
      <p v-if="r.contact" style="font-size:13px;color:var(--muted)">联系方式：{{ r.contact }}</p>
      <p style="font-size:12.5px;color:var(--muted);margin-top:6px">
        举报人 {{ r.reporter_name || '匿名' }} · 目标作者 {{ r.target_type === 'post' ? r.post_author : r.comment_author }}
      </p>
      <div class="am-acts" style="justify-content:flex-start">
        <button class="admin-btn danger" @click="removeTarget(r)">{{ r.confirmDelete ? '确认删除' : '删除内容' }}</button>
        <button class="admin-btn danger" @click="ban(r)">{{ r.confirmBan ? '确认封禁' : '封禁作者' }}</button>
        <button class="admin-btn ghost" @click="resolve(r, 'ignore')">忽略</button>
        <button class="admin-btn" @click="resolve(r, 'resolve')">标记已处理</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { get, post } from '../../api'

interface Report { id: number; target_type: string; target_id: number; post_id: number; reason: string; contact: string; created_at: string; reporter_name: string; post_title: string; post_author: string; comment_content: string; comment_author: string; target_user: string; confirmDelete?: boolean; confirmBan?: boolean }

const tabs = [
  { k: 'pending', label: '待处理' },
  { k: 'resolved', label: '已处理' },
  { k: 'ignored', label: '已忽略' },
]
const status = ref('pending')
const items = ref<Report[]>([])

async function load() {
  const r = await get<{ items: Report[] }>(`/api/admin/reports?status=${status.value}`)
  if (r.ok && r.data) items.value = r.data.items
}
function switchTab(k: string) { status.value = k; load() }

async function resolve(r: Report, action: 'resolve' | 'ignore') {
  const body: Record<string, unknown> = { action }
  if (r.confirmDelete && action === 'resolve') body.deleteTarget = true
  if (r.confirmBan && action === 'resolve') body.banUser = true
  const res = await post(`/api/admin/reports/${r.id}/resolve`, body)
  if (res.ok) items.value = items.value.filter((x) => x.id !== r.id)
}

async function removeTarget(r: Report) {
  if (!r.confirmDelete) { r.confirmDelete = true; return }
  r.confirmDelete = false
  const res = await post(`/api/admin/reports/${r.id}/resolve`, { action: 'resolve', deleteTarget: true })
  if (res.ok) items.value = items.value.filter((x) => x.id !== r.id)
}

async function ban(r: Report) {
  if (!r.confirmBan) { r.confirmBan = true; return }
  r.confirmBan = false
  const res = await post(`/api/admin/reports/${r.id}/resolve`, { action: 'resolve', banUser: true })
  if (res.ok) items.value = items.value.filter((x) => x.id !== r.id)
}

onMounted(load)
</script>
