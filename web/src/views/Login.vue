<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import { post } from '../api'

const router = useRouter()
const route = useRoute()

const form = reactive({ account: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  const r = await post('/api/auth/login', { ...form })
  loading.value = false
  if (!r.ok) {
    error.value = r.msg
    return
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/forum'
  router.push(redirect)
}
</script>

<template>
  <AuthLayout eyebrow="登录" title="欢迎回来" subtitle="用用户名或邮箱登录。">
    <form class="auth-form" @submit.prevent="submit">
      <div class="auth-field">
        <label class="auth-label" for="account">账号</label>
        <input
          id="account"
          v-model="form.account"
          class="auth-input"
          type="text"
          autocomplete="username"
          placeholder="用户名或邮箱"
        />
      </div>

      <div class="auth-field">
        <label class="auth-label" for="password">密码</label>
        <input
          id="password"
          v-model="form.password"
          class="auth-input"
          type="password"
          autocomplete="current-password"
          placeholder="你的密码"
        />
      </div>

      <p v-if="error" class="auth-error">{{ error }}</p>

      <button class="auth-submit" type="submit" :disabled="loading">
        {{ loading ? '登录中…' : '登录' }}
      </button>

      <p class="auth-switch">还没有账号？<RouterLink to="/register">注册一个</RouterLink></p>
      <p class="auth-switch"><RouterLink to="/reset">忘记密码？</RouterLink></p>
    </form>
  </AuthLayout>
</template>
