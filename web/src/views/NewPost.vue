<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../api'
import RichEditor from '../components/RichEditor.vue'
import { store } from '../store'

interface Category {
  id: number
  name: string
  slug: string
  description?: string | null
}

const router = useRouter()
const categories = ref<Category[]>([])
const form = reactive({ categoryId: 0, title: '', content: '', contentHtml: '', tags: '' })
const error = ref('')
const catOpen = ref(false)
const catWrap = ref<HTMLElement | null>(null)
const currentCat = computed(() => categories.value.find((c) => c.id === form.categoryId) || null)

function pickCat(c: Category) {
  form.categoryId = c.id
  catOpen.value = false
}

function onDocClick(e: MouseEvent) {
  if (catWrap.value && !catWrap.value.contains(e.target as Node)) catOpen.value = false
}

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('beforeunload', saveDraft)
})
const sending = ref(false)
const draftKey = 'shequ:draft:new'
const draftTip = ref('')

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

watch(form, saveDraft, { deep: true })

onMounted(async () => {
  const r = await get<{ categories: Category[] }>('/api/categories')
  if (r.ok) {
    categories.value = r.data?.categories ?? []
    if (!form.categoryId && categories.value.length) {
      form.categoryId = categories.value[0].id
    }
  }
  document.addEventListener('click', onDocClick)
  const raw = localStorage.getItem(draftKey)
  if (raw) {
    try {
      const d = JSON.parse(raw)
      if (d.title || d.contentHtml) {
        form.title = d.title || ''
        form.content = d.content || ''
        form.contentHtml = d.contentHtml || ''
        form.tags = d.tags || ''
        if (d.categoryId) form.categoryId = d.categoryId
        draftTip.value = '已恢复上次没发出去的草稿'
      }
    } catch { /* 忽略 */ }
  }
  window.addEventListener('beforeunload', saveDraft)
})

async function submit() {
  if (!store.user) {
    router.push('/login')
    return
  }
  error.value = ''
  if (!form.title.trim()) {
    error.value = '标题还没写'
    return
  }
  if (!form.content.trim() && !form.contentHtml.trim()) {
    error.value = '正文还是空的'
    return
  }
  sending.value = true
  const tags = form.tags
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3)
  const r = await post<{ id: number }>('/api/posts', {
    categoryId: form.categoryId,
    title: form.title,
    content: form.content,
    contentHtml: form.contentHtml,
    tags,
  })
  sending.value = false
  if (!r.ok) {
    error.value = r.msg
    return
  }
  clearDraft()
  router.push(`/post/${r.data?.id}`)
}
</script>

<template>
  <div class="new-wrap">
    <div class="new-head">
      <h1>发帖</h1>
      <p>说清楚你想聊什么，就会有人接话。</p>
    </div>

    <div v-if="!store.user" class="need-login">
      <p>发帖需要先登录。</p>
      <RouterLink class="btn" to="/login">去登录</RouterLink>
    </div>

    <form v-else class="new-form" @submit.prevent="submit">
      <div class="field">
        <label>板块</label>
        <div ref="catWrap" class="cat-select">
          <button class="cat-btn" type="button" @click.stop="catOpen = !catOpen">
            <span>{{ currentCat?.name || '选择板块' }}</span>
            <svg class="chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div v-if="catOpen" class="cat-menu">
            <button
              v-for="c in categories"
              :key="c.id"
              class="cat-item"
              :class="{ on: c.id === form.categoryId }"
              type="button"
              @click="pickCat(c)"
            >
              <span class="ci-name">{{ c.name }}</span>
              <span class="ci-desc">{{ c.description || '' }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="field">
        <label for="title">标题</label>
        <input
          id="title"
          v-model="form.title"
          class="input"
          type="text"
          maxlength="120"
          placeholder="一句话说清楚这帖讲什么"
        />
      </div>

      <div class="field">
        <label>正文</label>
        <RichEditor v-model="form.contentHtml" @update:text="form.content = $event" />
        <small class="hint">支持图片、视频、表情、链接；贴上的链接会自动显示站点图标。</small>
      </div>

      <div class="field">
        <label for="tags">标签</label>
        <input
          id="tags"
          v-model="form.tags"
          class="input"
          type="text"
          placeholder="用逗号隔开，最多 3 个，比如：求助, 分享"
        />
        <small class="hint">标签会出现在板块页顶部，方便别人找到同类帖子。</small>
      </div>

      <p v-if="draftTip" class="draft-tip">{{ draftTip }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <RouterLink class="btn-ghost" to="/forum">取消</RouterLink>
        <button class="btn-send" type="submit" :disabled="sending">
          {{ sending ? '发布中…' : '发布帖子' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.new-wrap {
  max-width: 760px;
  margin: 0 auto;
}

.cat-select {
  position: relative;
}

.cat-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  height: 42px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.cat-btn:hover {
  border-color: #d9d3c7;
}

.chev {
  color: #a8a196;
  transition: transform 0.18s ease;
}

.cat-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  padding: 5px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  box-shadow: 0 14px 34px rgba(38, 34, 28, 0.12);
}

.cat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 7px;
  background: none;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.cat-item:hover {
  background: #f6f3ee;
}

.cat-item.on {
  background: #eef2ee;
}

.ci-name {
  font-size: 13.5px;
  color: var(--ink);
}

.cat-item.on .ci-name {
  font-weight: 600;
  color: var(--accent);
}

.ci-desc {
  font-size: 11.5px;
  color: #a8a196;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.new-head {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 26px;
}

.new-head h1 {
  margin: 0;
  font-size: 27px;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.new-head p {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--muted);
}

.new-form {
  display: grid;
  gap: 20px;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 13px;
  color: var(--muted);
}

.input,
.select,
.textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #fff;
  color: var(--ink);
  font-family: inherit;
  font-size: 14.8px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input,
.select {
  height: 44px;
  padding: 0 13px;
}

.textarea {
  padding: 13px;
  line-height: 1.75;
  resize: vertical;
}

.input:focus,
.select:focus,
.textarea:focus {
  border-color: #b9c9bf;
  box-shadow: 0 0 0 3px rgba(62, 92, 75, 0.1);
}

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.btn-send {
  height: 42px;
  padding: 0 22px;
  border: 0;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.btn-send:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  height: 42px;
  padding: 0 18px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 14px;
  color: var(--ink);
  background: #fff;
}
.btn-ghost:hover {
  background: #f4f1ec;
}

.hint {
  font-size: 12px;
  color: #a8a196;
}

.error {
  margin: 0;
  padding: 10px 13px;
  border-radius: 9px;
  background: #fdf2f0;
  border: 1px solid #f3d6cf;
  color: #b4492f;
  font-size: 13.5px;
}

.need-login {
  padding: 50px 0;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}
.need-login .btn {
  display: inline-flex;
  align-items: center;
  height: 42px;
  padding: 0 22px;
  margin-top: 12px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}
</style>
