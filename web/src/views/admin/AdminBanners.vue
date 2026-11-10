<template>
  <div>
    <div class="admin-page-head"><div><h1>轮播图</h1><p>显示在社区首页顶部，最多 10 张</p></div></div>
    <div class="admin-card" style="margin-bottom:16px">
      <h2 style="font-size:15px;margin-bottom:12px">{{ editing ? '编辑轮播图' : '新增轮播图' }}</h2>
      <div style="display:flex;gap:14px;flex-wrap:wrap">
        <label class="up-box">
          <img v-if="form.image" :src="form.image" alt="" />
          <span v-else>{{ uploading ? '上传中…' : '上传图片' }}</span>
          <input type="file" accept="image/*" hidden @change="pick" />
        </label>
        <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px">
          <input v-model="form.title" class="admin-input" placeholder="标题（可空，只做备注）" />
          <input v-model="form.link" class="admin-input" placeholder="点击跳转地址（可空，纯图片就不填）" />
          <input v-model="form.sort" class="admin-input" type="number" placeholder="排序，小的在前" />
        </div>
      </div>
      <div class="am-acts">
        <button v-if="editing" class="admin-btn ghost" @click="reset">取消编辑</button>
        <button class="admin-btn" :disabled="saving || !form.image" @click="save">{{ editing ? '保存' : '添加' }}</button>
      </div>
    </div>
    <div class="admin-card" style="padding:4px 12px">
      <table class="admin-table">
        <thead><tr><th>图</th><th>标题</th><th>跳转</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="b in items" :key="b.id">
            <td><img :src="b.image" alt="" style="width:110px;height:56px;object-fit:cover;border-radius:6px;border:1px solid var(--line)" /></td>
            <td>{{ b.title || '—' }}</td>
            <td style="color:var(--muted);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ b.link || '纯图片' }}</td>
            <td>{{ b.sort }}</td>
            <td><span class="admin-badge" :class="b.enabled ? 'ok' : ''">{{ b.enabled ? '显示' : '隐藏' }}</span></td>
            <td class="actions">
              <button class="admin-btn ghost" @click="edit(b)">编辑</button>
              <button class="admin-btn ghost" @click="toggle(b)">{{ b.enabled ? '隐藏' : '显示' }}</button>
              <button class="admin-btn danger" @click="remove(b)">{{ b.confirm ? '确认删除' : '删除' }}</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="6" class="admin-empty">还没有轮播图</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { del, get, patch, post, upload } from '../../api'

interface Banner { id: number; image: string; link: string; title: string; sort: number; enabled: number; confirm?: boolean }

const items = ref<Banner[]>([])
const form = reactive({ id: 0, image: '', link: '', title: '', sort: 0 })
const editing = ref(false)
const saving = ref(false)
const uploading = ref(false)

async function load() {
  const r = await get<{ items: Banner[] }>('/api/admin/banners')
  if (r.ok && r.data) items.value = r.data.items
}

async function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  const fd = new FormData()
  fd.append('file', file)
  const r = await upload<{ url: string }>('/api/upload/image', fd)
  uploading.value = false
  if (r.ok && r.data) form.image = r.data.url
  else alert(r.msg)
}

function edit(b: Banner) {
  editing.value = true
  form.id = b.id; form.image = b.image; form.link = b.link; form.title = b.title; form.sort = b.sort
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function reset() { editing.value = false; form.id = 0; form.image = ''; form.link = ''; form.title = ''; form.sort = 0 }

async function save() {
  if (saving.value) return
  saving.value = true
  const body = { image: form.image, link: form.link, title: form.title, sort: form.sort }
  const r = editing.value ? await patch(`/api/admin/banners/${form.id}`, body) : await post('/api/admin/banners', body)
  saving.value = false
  if (r.ok) { reset(); load() } else alert(r.msg)
}

async function toggle(b: Banner) {
  const r = await patch(`/api/admin/banners/${b.id}`, { ...b, enabled: !b.enabled })
  if (r.ok) b.enabled = b.enabled ? 0 : 1
}

async function remove(b: Banner) {
  if (!b.confirm) { b.confirm = true; return }
  const r = await del(`/api/admin/banners/${b.id}`)
  if (r.ok) items.value = items.value.filter((x) => x.id !== b.id)
}

onMounted(load)
</script>

<style scoped>
.up-box {
  width: 260px; height: 132px; border: 1px dashed var(--line); border-radius: 10px; background: #faf9f6;
  display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 13px; cursor: pointer; overflow: hidden;
}
.up-box img { width: 100%; height: 100%; object-fit: cover; }
</style>
