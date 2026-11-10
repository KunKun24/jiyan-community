<script setup lang="ts">
import { reactive, ref } from 'vue'
import AuthLayout from '../components/AuthLayout.vue'
import { post } from '../api'

const form = reactive({ username: '', email: '' })
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  const r = await post('/api/auth/reset-password', { ...form })
  loading.value = false
  if (!r.ok) {
    error.value = r.msg
    return
  }
  done.value = true
}
</script>

<template>
  <AuthLayout
    eyebrow="找回密码"
    title="重置密码"
    subtitle="填写注册时的用户名和邮箱，我们会把新密码发给你。"
  >
    <div v-if="done" class="auth-form">
      <p class="auth-note">
        密码已重置，新密码已发送到 <b>{{ form.email }}</b>。
        请查收邮件并尽快登录修改密码。
      </p>
      <RouterLink class="auth-submit auth-submit-link" to="/login">去登录</RouterLink>
    </div>

    <form v-else class="auth-form" @submit.prevent="submit">
      <div class="auth-field">
        <label class="auth-label" for="username">用户名</label>
        <input
          id="username"
          v-model="form.username"
          class="auth-input"
          type="text"
          autocomplete="username"
          placeholder="注册时填的用户名"
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
          placeholder="注册时填的邮箱"
        />
      </div>

      <p v-if="error" class="auth-error">{{ error }}</p>

      <button class="auth-submit" type="submit" :disabled="loading">
        {{ loading ? '处理中…' : '重置密码' }}
      </button>

      <p class="auth-note">重置后的默认密码为 12345678，登录后请及时修改。</p>
      <p class="auth-switch">想起来了？<RouterLink to="/login">返回登录</RouterLink></p>
    </form>
  </AuthLayout>
</template>
