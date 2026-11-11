<script setup lang="ts">
import { reactive, ref, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import { post, type User } from '../api'
import { store } from '../store'

const router = useRouter()
const route = useRoute()

const invite = ref(String(route.query.invite || '').trim().toUpperCase())
const form = reactive({
  username: '',
  email: '',
  code: '',
  password: '',
  password2: '',
})

const error = ref('')
const agree = ref(false)
const loading = ref(false)
const sending = ref(false)
const countdown = ref(0)
let timer: number | undefined

async function sendCode() {
  error.value = ''
  if (!form.email.trim()) {
    error.value = '请先填写邮箱'
    return
  }
  if (countdown.value > 0 || sending.value) return

  sending.value = true
  const r = await post('/api/auth/send-code', { email: form.email.trim(), purpose: 'register' })
  sending.value = false

  if (!r.ok) {
    error.value = r.msg
    return
  }
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) window.clearInterval(timer)
  }, 1000)
}

async function submit() {
  error.value = ''
  if (!form.username.trim()) { error.value = '请先填写用户名'; return }
  if (!form.email.trim()) { error.value = '请先填写邮箱'; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { error.value = '邮箱格式看起来不对'; return }
  if (!form.code.trim()) { error.value = '请先填写邮箱验证码'; return }
  if (form.password.length < 6) { error.value = '密码至少 6 位'; return }
  if (form.password !== form.password2) { error.value = '两次输入的密码不一致'; return }
  if (!agree.value) { error.value = '请先阅读并同意用户协议和免责声明'; return }
  loading.value = true
  const r = await post<{ user: User }>('/api/auth/register', { ...form, invite: invite.value.trim().toUpperCase() })
  loading.value = false
  if (!r.ok) {
    error.value = r.msg
    return
  }
  if (r.data?.user) {
    store.user = r.data.user
    store.loaded = true
  }
  router.push('/forum')
}

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <AuthLayout eyebrow="注册" title="创建账号" subtitle="一个邮箱就够了，用户名可以写中文。">
    <form class="auth-form" @submit.prevent="submit">
      <div class="auth-field">
        <label class="auth-label" for="username">用户名</label>
        <input
          id="username"
          v-model="form.username"
          class="auth-input"
          type="text"
          autocomplete="username"
          placeholder="支持中文，2-32 位"
        />
      </div>

      <div class="auth-field">
        <label class="auth-label" for="email">邮箱</label>
        <input
          id="email"
          v-model="form.email"
          class="auth-input"
          type="email"
          autocomplete="email"
          placeholder="用来接收验证码"
        />
      </div>

      <div class="auth-field">
        <label class="auth-label" for="code">验证码</label>
        <div class="auth-code-row">
          <input
            id="code"
            v-model="form.code"
            class="auth-input"
            type="text"
            inputmode="text"
            maxlength="8"
            autocomplete="one-time-code"
            placeholder="邮件里的 8 位验证码"
          />
          <button class="auth-code-btn" type="button" :disabled="sending || countdown > 0" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s` : sending ? '发送中…' : '发送验证码' }}
          </button>
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-label" for="password">密码</label>
        <input
          id="password"
          v-model="form.password"
          class="auth-input"
          type="password"
          autocomplete="new-password"
          placeholder="至少 6 位"
        />
      </div>

      <div class="auth-field">
        <label class="auth-label" for="password2">确认密码</label>
        <input
          id="password2"
          v-model="form.password2"
          class="auth-input"
          type="password"
          autocomplete="new-password"
          placeholder="再输入一次"
        />
      </div>

      <div class="auth-field">
        <label class="auth-label" for="invite">邀请码 <span class="opt">选填</span></label>
        <input
          id="invite"
          v-model="invite"
          class="auth-input"
          type="text"
          maxlength="8"
          autocomplete="off"
          placeholder="有朋友邀请就填他的码"
          @input="invite = invite.toUpperCase()"
        />
      </div>

      <label class="auth-agree">
        <input v-model="agree" type="checkbox" />
        <span>我已阅读并同意 <RouterLink to="/terms" target="_blank">《用户协议》</RouterLink> 和 <RouterLink to="/disclaimer" target="_blank">《免责声明》</RouterLink></span>
      </label>

      <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

      <button class="auth-submit" type="submit" :disabled="loading">
        {{ loading ? '创建中…' : '创建账号' }}
      </button>

      <p class="auth-switch">已有账号？<RouterLink to="/login">直接登录</RouterLink></p>
    </form>
  </AuthLayout>
</template>
