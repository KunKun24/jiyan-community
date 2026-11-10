<template>
  <div>
    <div class="admin-page-head"><div><h1>公告管理</h1><p>公告会显示在「公告」页，首页横幅暂未接</p></div></div>
    <div class="admin-card" style="margin-bottom:16px">
      <h2 style="font-size:15px;margin-bottom:12px">{{ editing ? '编辑公告' : '发布新公告' }}</h2>
      <input v-model="form.title" class="admin-input" style="width:100%;margin-bottom:10px" placeholder="标题（2-120 字）" />
      <textarea v-model="form.content" class="admin-textarea" placeholder="内容"></textarea>
      <div class="am-acts">
        <button v-if="editing" class="admin-btn ghost" @click="reset">取消编辑</button>
        <button class="admin-btn" :disabled="saving" @click="save">{{ editing ? '保存' : '发布' }}</button>
      </div>
    </div>
    <div class="admin-card" style="padding:4px 12px">
      <table class="admin-table">
        <thead><tr><th>标题</th><th>内容</th><th>时间</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="n in items" :key="n.id">
            <td>{{ n.title }}</td>
            <td style="color:var(--muted);max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ n.content }}</td>
            <td style="color:var(--muted);white-space:nowrap">{{ n.created_at.slice(5, 16) }}</td>
            <td class="actions">
              <button class="admin-btn ghost" @click="edit(n)">编辑</button>
              <button class="admin-btn danger" @click="remove(n)">{{ n.confirm ? '确认删除' : '删除' }}</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="4" class="admin-empty">还没有公告</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { del, get, patch, post } from '../../api'

interface Notice { id: number; title: string; content: string; created_at: string; confirm?: boolean }

const items = ref<Notice[]>([])
const form = reactive({ id: 0, title: '', content: '' })
const editing = ref(false)
const saving = ref(false)

async function load() {
  const r = await get<{ items: Notice[] }>('/api/admin/notices')
  if (r.ok && r.data) items.value = r.data.items
}

function edit(n: Notice) {
  editing.value = true
  form.id = n.id
  form.title = n.title
  form.content = n.content
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function reset() { editing.value = false; form.id = 0; form.title = ''; form.content = '' }

async function save() {
  if (saving.value) return
  saving.value = true
  const r = editing.value
    ? await patch(`/api/admin/notices/${form.id}`, { title: form.title, content: form.content })
    : await post('/api/admin/notices', { title: form.title, content: form.content })
  saving.value = false
  if (r.ok) { reset(); load() } else alert(r.msg)
}

async function remove(n: Notice) {
  if (!n.confirm) { n.confirm = true; return }
  const r = await del(`/api/admin/notices/${n.id}`)
  if (r.ok) items.value = items.value.filter((x) => x.id !== n.id)
}

onMounted(load)
</script>
