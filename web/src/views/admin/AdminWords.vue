<template>
  <div>
    <div class="admin-page-head"><div><h1>敏感词</h1><p>命中后直接拒绝发布，提示里会指出是哪个词</p></div></div>
    <div class="admin-card" style="margin-bottom:16px">
      <div style="display:flex;gap:10px">
        <input v-model="word" class="admin-input" style="flex:1" placeholder="输入一个词，回车添加" @keydown.enter="add" />
        <button class="admin-btn" :disabled="saving || !word.trim()" @click="add">{{ saving ? '…' : '添加' }}</button>
      </div>
      <p style="margin:10px 0 0;font-size:12.5px;color:var(--muted)">大小写不敏感，包含即命中。比如「代开发票」会拦下「代开发票 请联系」。</p>
    </div>
    <div class="admin-card" style="padding:4px 12px">
      <table class="admin-table">
        <thead><tr><th style="width:60%">词语</th><th>添加时间</th><th style="width:100px">操作</th></tr></thead>
        <tbody>
          <tr v-for="w in items" :key="w.id">
            <td>{{ w.word }}</td>
            <td style="color:var(--muted)">{{ w.created_at.slice(0, 16) }}</td>
            <td class="actions"><button class="admin-btn danger" @click="remove(w)">{{ w.confirm ? '确认' : '删除' }}</button></td>
          </tr>
          <tr v-if="!items.length"><td colspan="3" class="admin-empty">还没有敏感词。发帖、回复、私信都会先过这个列表。</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { del, get, post } from '../../api'

interface Word { id: number; word: string; created_at: string; confirm?: boolean }
const items = ref<Word[]>([])
const word = ref('')
const saving = ref(false)

async function load() {
  const r = await get<{ items: Word[] }>('/api/admin/sensitive-words')
  if (r.ok && r.data) items.value = r.data.items
}

async function add() {
  const w = word.value.trim()
  if (!w || saving.value) return
  saving.value = true
  const r = await post('/api/admin/sensitive-words', { word: w })
  saving.value = false
  if (!r.ok) { alert(r.msg); return }
  word.value = ''
  load()
}

async function remove(w: Word) {
  if (!w.confirm) { w.confirm = true; return }
  const r = await del(`/api/admin/sensitive-words/${w.id}`)
  if (r.ok) items.value = items.value.filter((x) => x.id !== w.id)
}

onMounted(load)
</script>
