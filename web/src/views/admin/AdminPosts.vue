<template>
  <div>
    <div class="admin-page-head"><div><h1>帖子管理</h1><p>共 {{ total }} 篇</p></div></div>
    <div class="admin-toolbar">
      <input v-model="q" class="admin-input" placeholder="搜标题或作者" @keyup.enter="search" />
      <select v-model="status" class="admin-select" @change="search">
        <option value="">全部状态</option>
        <option value="public">公开</option>
        <option value="private">私密</option>
      </select>
      <button class="admin-btn" @click="search">搜索</button>
    </div>
    <div class="admin-card" style="padding:4px 12px">
      <table class="admin-table">
        <thead><tr><th>标题</th><th>作者</th><th>板块</th><th>浏览</th><th>回复</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="p in items" :key="p.id">
            <td style="max-width:280px"><RouterLink :to="`/post/${p.id}`" style="color:var(--ink)">{{ p.title }}</RouterLink></td>
            <td><RouterLink :to="`/u/${p.userId}`">{{ p.username }}</RouterLink></td>
            <td>{{ p.category.name }}</td>
            <td>{{ fmtNum(p.views) }}</td>
            <td>{{ p.replyCount }}</td>
            <td><span class="admin-badge" :class="p.status === 'public' ? 'ok' : ''">{{ p.status === 'public' ? '公开' : '私密' }}</span><span v-if="p.pinned" class="admin-badge ok" style="margin-left:4px">置顶</span></td>
            <td style="color:var(--muted);white-space:nowrap">{{ p.createdAt.slice(5, 16) }}</td>
            <td class="actions">
              <button class="admin-btn ghost" @click="togglePinned(p)">{{ p.pinned ? '取消置顶' : '置顶' }}</button>
              <button class="admin-btn ghost" @click="toggleStatus(p)">{{ p.status === 'public' ? '设为私密' : '公开' }}</button>
              <button class="admin-btn danger" @click="remove(p)">{{ p.confirm ? '确认删除' : '删除' }}</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="8" class="admin-empty">没有匹配的帖子</td></tr>
        </tbody>
      </table>
    </div>
    <div class="admin-pager">
      <span>第 {{ page }} / {{ pages }} 页</span>
      <button class="admin-btn ghost" :disabled="page <= 1" @click="go(page - 1)">上一页</button>
      <button class="admin-btn ghost" :disabled="page >= pages" @click="go(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { del, get, patch } from '../../api'
import { fmtNum } from '../../format'

interface Item { id: number; title: string; status: string; pinned: number; views: number; replyCount: number; createdAt: string; userId: number; username: string; category: { name: string }; confirm?: boolean }

const items = ref<Item[]>([])
const total = ref(0)
const page = ref(1)
const pages = ref(1)
const q = ref('')
const status = ref('')

async function load() {
  const params = new URLSearchParams({ page: String(page.value), size: '20' })
  if (q.value) params.set('q', q.value)
  if (status.value) params.set('status', status.value)
  const r = await get<{ items: Item[]; total: number }>(`/api/admin/posts?${params}`)
  if (r.ok && r.data) {
    items.value = r.data.items
    total.value = r.data.total
    pages.value = Math.max(1, Math.ceil(r.data.total / 20))
  }
}

function search() { page.value = 1; load() }
function go(n: number) { page.value = n; load() }

async function togglePinned(p: Item) {
  const next = p.pinned ? 0 : 1
  const r = await patch(`/api/admin/posts/${p.id}`, { pinned: next })
  if (r.ok) p.pinned = next
}

async function toggleStatus(p: Item) {
  const next = p.status === 'public' ? 'private' : 'public'
  const r = await patch(`/api/admin/posts/${p.id}`, { status: next })
  if (r.ok) p.status = next
}

async function remove(p: Item) {
  if (!p.confirm) { p.confirm = true; return }
  const r = await del(`/api/admin/posts/${p.id}`)
  if (r.ok) { items.value = items.value.filter((x) => x.id !== p.id); total.value-- }
}

onMounted(load)
</script>
