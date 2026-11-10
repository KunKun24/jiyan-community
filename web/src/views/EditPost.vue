<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, patch } from '../api'
import RichEditor from '../components/RichEditor.vue'
import { store } from '../store'

interface Category { id: number; name: string; slug: string; description?: string | null }

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const categories = ref<Category[]>([])
const form = reactive({ categoryId: 0, title: '', content: '', contentHtml: '', tags: '' })
const error = ref('')
const notice = ref('')
const loading = ref(true)
const sending = ref(false)
const catOpen = ref(false)
const catWrap = ref<HTMLElement | null>(null)
const currentCat = computed(() => categories.value.find((c) => c.id === form.categoryId) || null)
const draftKey = `shequ:edit:${id}`

function pickCat(c: Category) {
  form.categoryId = c.id
  catOpen.value = false
}
function onDocClick(e: MouseEvent) {
  if (catWrap.value && !catWrap.value.contains(e.target as Node)) catOpen.value = false
}

function saveDraft() {
  try {
    localStorage.setItem(draftKey, JSON.stringify({
      title: form.title, content: form.content, contentHtml: form.contentHtml,
      categoryId: form.categoryId, tags: form.tags, at: Date.now(),
    }))
  } catch { /* 忽略 */ }
}
function clearDraft() {
  localStorage.removeItem(draftKey)
}

onMounted(async () => {
  if (!store.user) {
    router.push('/login')
    return
  }
  const [c, p] = await Promise.all([
    get<{ categories: Category[] }>('/api/categories'),
    get<{ post: { id: number; title: string; content: string; contentHtml: string; category: { id: number }; tags: string[]; author: { id: number } } }>(`/api/posts/${id}`),
  ])
  loading.value = false
  if (c.ok) categories.value = c.data?.categories ?? []
  if (!p.ok || !p.data) {
    error.value = p.msg || '帖子不存在'
    return
  }
  const post = p.data.post
  if (post.author.id !== store.user.id) {
    error.value = '只能编辑自己的帖子'
    return
  }
  form.categoryId = post.category.id
  form.title = post.title
  form.content = post.content
  form.contentHtml = post.contentHtml
  form.tags = (post.tags || []).join(', ')

  const raw = localStorage.getItem(draftKey)
  if (raw) {
    try {
      const d = JSON.parse(raw)
      if (d.title || d.contentHtml) {
        form.title = d.title || form.title
        form.content = d.content || form.content
        form.contentHtml = d.contentHtml || form.contentHtml
        form.categoryId = d.categoryId || form.categoryId
        form.tags = d.tags || form.tags
        notice.value = '已恢复上次未保存的草稿'
      }
    } catch { /* 忽略 */ }
  }
  document.addEventListener('click', onDocClick)
  window.addEventListener('beforeunload', saveDraft)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('beforeunload', saveDraft)
})

function onUpdateHtml() {
  saveDraft()
}

async function submit() {
  error.value = ''
  if (!form.title.trim()) { error.value = '标题还没写'; return }
  if (!form.content.trim() && !form.contentHtml.trim()) { error.value = '正文还是空的'; return }
  sending.value = true
  const tags = form.tags.split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean).slice(0, 3)
  const r = await patch(`/api/posts/${id}`, {
    title: form.title.trim(),
    content: form.content.trim(),
    contentHtml: form.contentHtml,
    categoryId: form.categoryId,
    tags,
  })
  sending.value = false
  if (!r.ok) { error.value = r.msg; return }
  clearDraft()
  router.push(`/post/${id}`)
}
</script>

<template>
  <div class="page">
    <div v-if="loading" class="hint">加载中…</div>
    <div v-else-if="error && !form.title" class="hint">{{ error }}</div>

    <template v-else>
      <div class="head">
        <h1>编辑帖子</h1>
        <span class="tip">草稿会自动存在这台设备上</span>
      </div>
      <p v-if="notice" class="notice">{{ notice }}</p>

      <div class="row-cat">
        <div ref="catWrap" class="cat-pick">
          <button class="cat-btn" type="button" @click.stop="catOpen = !catOpen">
            <span>{{ currentCat?.name || '选择板块' }}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div v-if="catOpen" class="cat-menu">
            <button v-for="c in categories" :key="c.id" type="button" :class="{ on: c.id === form.categoryId }" @click.stop="pickCat(c)">
              <b>{{ c.name }}</b>
              <span>{{ c.description }}</span>
            </button>
          </div>
        </div>
        <input v-model="form.tags" class="tag-input" placeholder="标签，逗号分隔，最多 3 个" />
      </div>

      <input v-model="form.title" class="title" placeholder="标题" maxlength="120" @input="saveDraft" />

      <RichEditor v-model="form.contentHtml" @update:text="form.content = $event; onUpdateHtml()" />

      <p v-if="error" class="err">{{ error }}</p>
      <div class="foot">
        <RouterLink :to="`/post/${id}`" class="btn-ghost">取消</RouterLink>
        <button class="btn-primary" type="button" :disabled="sending" @click="submit">
          {{ sending ? '保存中…' : '保存修改' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 860px; margin: 0 auto; padding: 24px 18px 60px; }
.hint { padding: 50px 0; text-align: center; color: var(--muted); }
.head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
.head h1 { margin: 0; font-size: 20px; }
.tip { font-size: 12px; color: #a8a196; }
.notice { margin: 0 0 12px; padding: 8px 11px; background: #f3f7f4; border-radius: 8px; font-size: 12.5px; color: #3e5c4b; }
.row-cat { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.cat-pick { position: relative; }
.cat-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px;
  border: 1px solid var(--line); border-radius: 8px; background: #fff; font: inherit; font-size: 13px; cursor: pointer;
}
.cat-menu {
  position: absolute; top: 40px; left: 0; z-index: 30; width: 240px; background: #fff;
  border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 14px 34px rgba(30, 26, 20, 0.14); padding: 5px;
}
.cat-menu button { display: block; width: 100%; text-align: left; border: 0; background: transparent; padding: 8px 10px; border-radius: 7px; font: inherit; cursor: pointer; }
.cat-menu button:hover, .cat-menu button.on { background: #f5f2ec; }
.cat-menu b { display: block; font-size: 13px; }
.cat-menu span { display: block; font-size: 11.5px; color: #a8a196; margin-top: 2px; }
.tag-input { flex: 1; height: 34px; padding: 0 12px; border: 1px solid var(--line); border-radius: 8px; font: inherit; font-size: 13px; outline: 0; }
.title {
  width: 100%; box-sizing: border-box; height: 44px; padding: 0 12px; margin-bottom: 12px;
  border: 1px solid var(--line); border-radius: 9px; font: inherit; font-size: 15px; outline: 0;
}
.err { color: #b4432f; font-size: 13px; }
.foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
.btn-ghost, .btn-primary {
  height: 36px; padding: 0 16px; display: inline-flex; align-items: center;
  border-radius: 8px; font-size: 13.5px; font-weight: 600;
}
.btn-ghost { border: 1px solid var(--line); color: var(--ink); background: #fff; }
.btn-primary { background: var(--accent); color: #fff; border: 0; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; }
</style>
