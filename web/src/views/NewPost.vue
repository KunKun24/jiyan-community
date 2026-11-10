<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../api'
import { store } from '../store'

interface Category {
  id: number
  name: string
  slug: string
}

const router = useRouter()
const categories = ref<Category[]>([])
const form = reactive({ categoryId: 0, title: '', content: '', tags: '' })
const error = ref('')
const sending = ref(false)

onMounted(async () => {
  const r = await get<{ categories: Category[] }>('/api/categories')
  if (r.ok) {
    categories.value = r.data?.categories ?? []
    if (!form.categoryId && categories.value.length) {
      form.categoryId = categories.value[0].id
    }
  }
})

async function submit() {
  if (!store.user) {
    router.push('/login')
    return
  }
  error.value = ''
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
    tags,
  })
  sending.value = false
  if (!r.ok) {
    error.value = r.msg
    return
  }
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
        <label for="cat">板块</label>
        <select id="cat" v-model.number="form.categoryId" class="select">
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
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
        <label for="content">正文</label>
        <textarea
          id="content"
          v-model="form.content"
          class="textarea"
          rows="12"
          maxlength="20000"
          placeholder="慢慢写，不用急。"
        ></textarea>
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
