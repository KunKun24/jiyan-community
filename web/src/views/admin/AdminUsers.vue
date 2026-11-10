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
              <button class="admin-btn ghost" @click="openEdit(u)">编辑</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="7" class="admin-empty">没有账号</td></tr>
        </tbody>
      </table>
    </div>
    <div v-if="editing" class="am-mask" @click.self="editing = null">
      <div class="am-modal">
        <h3>编辑账号</h3>
        <div class="admin-toolbar" style="flex-direction:column;align-items:stretch;gap:10px">
          <label style="font-size:13px;color:var(--muted)">用户名
            <input v-model="form.username" class="admin-input" style="width:100%;margin-top:4px" />
          </label>
          <label style="font-size:13px;color:var(--muted)">贡献值（等级随贡献值变化）
            <input v-model.number="form.points" type="number" min="0" class="admin-input" style="width:100%;margin-top:4px" />
          </label>
          <label style="font-size:13px;color:var(--muted)">新密码（留空不改）
            <input v-model="form.password" type="text" class="admin-input" style="width:100%;margin-top:4px" placeholder="至少 6 位" />
          </label>
          <p v-if="editError" style="color:#b3261e;font-size:13px">{{ editError }}</p>
        </div>
        <div class="am-acts">
          <button class="admin-btn ghost" @click="editing = null">取消</button>
          <button class="admin-btn" @click="saveEdit">保存</button>
        </div>
      </div>
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

interface Item { id: number; username: string; email: string; role: string; status: number; points: number; post_count: number; created_at: string }

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
const editing = ref<Item | null>(null)
const form = ref({ username: '', points: 0, password: '' })
const editError = ref('')

function openEdit(u: Item) {
  editing.value = u
  form.value = { username: u.username, points: u.points ?? 0, password: '' }
  editError.value = ''
}
async function saveEdit() {
  if (!editing.value) return
  editError.value = ''
  const body: Record<string, unknown> = { username: form.value.username }
  body.points = Number(form.value.points) || 0
  if (form.value.password) body.password = form.value.password
  const r = await patch(`/api/admin/users/${editing.value.id}`, body)
  if (!r.ok) { editError.value = r.msg; return }
  editing.value = null
  load()
}

async function toggleRole(u: Item) {
  const next = u.role === 'admin' ? 'user' : 'admin'
  const r = await patch(`/api/admin/users/${u.id}`, { role: next })
  if (r.ok) u.role = next
}

onMounted(load)
</script>
