<template>
  <div>
    <div class="admin-page-head"><div><h1>账号管理</h1><p>共 {{ total }} 个账号</p></div></div>
    <div class="admin-toolbar">
      <input v-model="q" class="admin-input" placeholder="搜用户名或邮箱" @keyup.enter="search" />
      <button class="admin-btn" @click="search">搜索</button>
    </div>
    <div class="admin-card" style="padding:4px 12px">
      <table class="admin-table">
        <thead><tr><th>用户名</th><th>邮箱</th><th>角色</th><th>状态</th><th>帖子</th><th>注册时间</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="u in items" :key="u.id">
            <td><RouterLink :to="`/u/${u.id}`">{{ u.username }}</RouterLink></td>
            <td style="color:var(--muted)">{{ u.email }}</td>
            <td><span class="admin-badge" :class="u.role === 'admin' ? 'ok' : ''">{{ u.role === 'admin' ? '管理员' : '用户' }}</span></td>
            <td><span class="admin-badge" :class="u.status === 1 ? 'ok' : 'bad'">{{ u.status === 1 ? '正常' : '已封禁' }}</span></td>
            <td>{{ u.post_count }}</td>
            <td style="color:var(--muted);white-space:nowrap">{{ u.created_at.slice(0, 10) }}</td>
            <td class="actions">
              <button class="admin-btn ghost" @click="toggleStatus(u)">{{ u.status === 1 ? '封禁' : '解封' }}</button>
              <button class="admin-btn ghost" @click="toggleRole(u)">{{ u.role === 'admin' ? '取消管理员' : '设为管理员' }}</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="7" class="admin-empty">没有账号</td></tr>
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
import { get, patch } from '../../api'

interface Item { id: number; username: string; email: string; role: string; status: number; post_count: number; created_at: string }

const items = ref<Item[]>([])
const total = ref(0)
const page = ref(1)
const pages = ref(1)
const q = ref('')

async function load() {
  const params = new URLSearchParams({ page: String(page.value), size: '20' })
  if (q.value) params.set('q', q.value)
  const r = await get<{ items: Item[]; total: number }>(`/api/admin/users?${params}`)
  if (r.ok && r.data) {
    items.value = r.data.items
    total.value = r.data.total
    pages.value = Math.max(1, Math.ceil(r.data.total / 20))
  }
}
function search() { page.value = 1; load() }
function go(n: number) { page.value = n; load() }

async function toggleStatus(u: Item) {
  const next = u.status === 1 ? 0 : 1
  const r = await patch(`/api/admin/users/${u.id}`, { status: next })
  if (r.ok) u.status = next
}
async function toggleRole(u: Item) {
  const next = u.role === 'admin' ? 'user' : 'admin'
  const r = await patch(`/api/admin/users/${u.id}`, { role: next })
  if (r.ok) u.role = next
}

onMounted(load)
</script>
