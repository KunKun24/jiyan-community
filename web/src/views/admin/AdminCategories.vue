<template>
  <div>
    <div class="admin-page-head"><div><h1>板块管理</h1><p>板块标识用于网址 /c/标识，创建后不能改</p></div></div>
    <div class="admin-card" style="margin-bottom:16px">
      <h2 style="font-size:15px;margin-bottom:12px">{{ editing ? '编辑板块' : '新建板块' }}</h2>
      <div class="admin-toolbar" style="margin-bottom:10px">
        <input v-model="form.name" class="admin-input" style="min-width:140px" placeholder="名字，如 闲聊灌水" />
        <input v-model="form.slug" class="admin-input" style="min-width:140px" :disabled="editing" placeholder="标识，如 chat" />
        <input v-model="form.sort" class="admin-input" style="min-width:90px" type="number" placeholder="排序" />
      </div>
      <input v-model="form.description" class="admin-input" style="width:100%" placeholder="一句话简介（可空）" />
      <div class="am-acts">
        <button v-if="editing" class="admin-btn ghost" @click="reset">取消编辑</button>
        <button class="admin-btn" @click="save">{{ editing ? '保存' : '创建' }}</button>
      </div>
    </div>
    <div class="admin-card" style="padding:4px 12px">
      <table class="admin-table">
        <thead><tr><th>板块</th><th>标识</th><th>简介</th><th>排序</th><th>帖子</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in items" :key="c.id">
            <td>{{ c.name }}</td>
            <td style="color:var(--muted)">/c/{{ c.slug }}</td>
            <td style="color:var(--muted)">{{ c.description }}</td>
            <td>{{ c.sort }}</td>
            <td>{{ c.post_count }}</td>
            <td class="actions">
              <button class="admin-btn ghost" @click="edit(c)">编辑</button>
              <button class="admin-btn danger" @click="remove(c)">{{ c.confirm ? '确认删除' : '删除' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { del, get, patch, post } from '../../api'

interface Cat { id: number; name: string; slug: string; description: string; sort: number; post_count: number; confirm?: boolean }

const items = ref<Cat[]>([])
const form = reactive({ id: 0, name: '', slug: '', description: '', sort: 0 })
const editing = ref(false)

async function load() {
  const r = await get<{ items: Cat[] }>('/api/admin/categories')
  if (r.ok && r.data) items.value = r.data.items
}

function edit(c: Cat) {
  editing.value = true
  form.id = c.id; form.name = c.name; form.slug = c.slug
  form.description = c.description || ''; form.sort = c.sort
}
function reset() { editing.value = false; form.id = 0; form.name = ''; form.slug = ''; form.description = ''; form.sort = 0 }

async function save() {
  const body = { name: form.name, slug: form.slug, description: form.description, sort: form.sort }
  const r = editing.value ? await patch(`/api/admin/categories/${form.id}`, body) : await post('/api/admin/categories', body)
  if (r.ok) { reset(); load() } else alert(r.msg)
}

async function remove(c: Cat) {
  if (!c.confirm) { c.confirm = true; return }
  const r = await del(`/api/admin/categories/${c.id}`)
  if (r.ok) items.value = items.value.filter((x) => x.id !== c.id)
  else alert(r.msg)
}

onMounted(load)
</script>
