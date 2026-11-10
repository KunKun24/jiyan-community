<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../api'
import { store, logout } from '../store'
import { timeAgo } from '../format'

interface LoginLog { id: number; ip: string; ua: string; created_at: string }

const router = useRouter()
const email = reactive({ next: '', code: '', sent: false, busy: false, err: '', ok: '', countdown: 0 })
const logs = ref<LoginLog[]>([])
const logsOpen = ref(false)
const delOpen = ref(false)
const delPwd = ref('')
const delErr = ref('')
const delBusy = ref(false)
let timer: number | undefined

async function sendCode() {
  email.err = ''
  email.ok = ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.next.trim())) { email.err = '先填一个新邮箱'; return }
  email.busy = true
  const r = await post('/api/user/email/send-code', { email: email.next.trim() })
  email.busy = false
  if (!r.ok) { email.err = r.msg; return }
  email.sent = true
  email.ok = '验证码已发到新邮箱，5 分钟内有效'
  email.countdown = 60
  window.clearInterval(timer)
  timer = window.setInterval(() => {
    email.countdown--
    if (email.countdown <= 0) window.clearInterval(timer)
  }, 1000)
}

async function changeEmail() {
  email.err = ''
  email.ok = ''
  if (!/^[A-Za-z0-9]{8}$/.test(email.code.trim())) { email.err = '验证码是 8 位字母数字'; return }
  email.busy = true
  const r = await post('/api/user/email', { email: email.next.trim(), code: email.code.trim() })
  email.busy = false
  if (!r.ok) { email.err = r.msg; return }
  email.ok = '邮箱已更新'
  email.code = ''
  if (store.user) store.user.email = email.next.trim()
}

async function loadLogs() {
  logsOpen.value = !logsOpen.value
  if (!logsOpen.value || logs.value.length) return
  const r = await get<{ items: LoginLog[] }>('/api/user/logins')
  if (r.ok && r.data) logs.value = r.data.items
}

async function doDelete() {
  delErr.value = ''
  if (!delPwd.value) { delErr.value = '请输入密码'; return }
  delBusy.value = true
  const r = await post('/api/user/delete', { password: delPwd.value })
  delBusy.value = false
  if (!r.ok) { delErr.value = r.msg; return }
  await logout()
  router.push('/')
  alert('账号已注销')
}

onMounted(() => {})
</script>

<template>
  <section class="card">
    <h2>账号与安全</h2>

    <div class="sec-block">
      <h3>修改邮箱</h3>
      <p class="cur">当前邮箱：{{ store.user?.email || '—' }}</p>
      <div class="row-mail">
        <input v-model="email.next" class="ipt" placeholder="新的邮箱地址" />
        <button class="btn-mini" type="button" :disabled="email.busy || email.countdown > 0" @click="sendCode">
          {{ email.countdown > 0 ? `${email.countdown}s` : email.sent ? '重新发送' : '发送验证码' }}
        </button>
      </div>
      <div v-if="email.sent" class="row-mail">
        <input v-model="email.code" class="ipt" maxlength="8" placeholder="8 位验证码" />
        <button class="btn-mini" type="button" :disabled="email.busy" @click="changeEmail">确认更换</button>
      </div>
      <p v-if="email.err" class="err">{{ email.err }}</p>
      <p v-if="email.ok" class="ok">{{ email.ok }}</p>
    </div>

    <div class="sec-block">
      <h3>登录记录 <button class="link" type="button" @click="loadLogs">{{ logsOpen ? '收起' : '展开' }}</button></h3>
      <div v-if="logsOpen" class="logs">
        <p v-if="!logs.length" class="muted">还没有记录。</p>
        <div v-for="l in logs" :key="l.id" class="log-row">
          <span class="log-ip">{{ l.ip || '未知 IP' }}</span>
          <span class="log-ua" :title="l.ua">{{ l.ua || '未知设备' }}</span>
          <span class="log-time">{{ timeAgo(l.created_at) }}</span>
        </div>
      </div>
    </div>

    <div class="sec-block danger-zone">
      <h3>注销账号</h3>
      <p class="muted">注销后，账号、帖子互动记录都会被删除，且无法恢复。想清楚再做。</p>
      <button class="btn-danger" type="button" @click="delOpen = true">注销我的账号</button>
    </div>

    <div v-if="delOpen" class="modal-mask" @click.self="delOpen = false">
      <div class="modal">
        <h3>真的要注销吗？</h3>
        <p class="muted">这个操作不可撤销。输入密码确认。</p>
        <input v-model="delPwd" class="ipt" type="password" placeholder="当前密码" />
        <p v-if="delErr" class="err">{{ delErr }}</p>
        <div class="modal-acts">
          <button class="btn-ghost" type="button" @click="delOpen = false">取消</button>
          <button class="btn-danger" type="button" :disabled="delBusy" @click="doDelete">{{ delBusy ? '注销中…' : '确认注销' }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sec-block { padding: 14px 0; border-top: 1px solid #f0ece4; }
.sec-block:first-of-type { border-top: 0; padding-top: 4px; }
.sec-block h3 { margin: 0 0 8px; font-size: 13.5px; font-weight: 600; }
.cur { margin: 0 0 10px; font-size: 12.5px; color: var(--muted); }
.row-mail { display: flex; gap: 8px; margin-bottom: 8px; }
.ipt {
  flex: 1; min-width: 0; height: 36px; padding: 0 10px; border: 1px solid var(--line);
  border-radius: 8px; font: inherit; font-size: 13px; outline: none;
}
.ipt:focus { border-color: var(--accent); }
.btn-mini {
  height: 36px; padding: 0 12px; border: 1px solid var(--line); border-radius: 8px;
  background: #fff; font-size: 12.5px; cursor: pointer; color: var(--ink); flex-shrink: 0;
}
.btn-mini:disabled { opacity: .5; cursor: default; }
.err { margin: 4px 0; font-size: 12.5px; color: #b4483f; }
.ok { margin: 4px 0; font-size: 12.5px; color: var(--accent); }
.link { border: 0; background: none; color: var(--accent); font-size: 12px; cursor: pointer; padding: 0 0 0 6px; }
.logs { margin-top: 6px; }
.muted { font-size: 12.5px; color: var(--muted); }
.log-row { display: flex; gap: 10px; padding: 5px 0; font-size: 12.5px; border-bottom: 1px dashed #f0ece4; }
.log-ip { width: 110px; flex-shrink: 0; color: var(--ink); }
.log-ua { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
.log-time { flex-shrink: 0; color: var(--muted); }
.danger-zone h3 { color: #b4483f; }
.btn-danger {
  height: 34px; padding: 0 14px; border: 0; border-radius: 8px; background: #b4483f;
  color: #fff; font-size: 12.5px; cursor: pointer;
}
.modal-mask {
  position: fixed; inset: 0; background: rgba(38,34,28,.42); display: grid; place-items: center;
  z-index: 60; backdrop-filter: blur(2px);
}
.modal { width: min(88vw, 380px); background: #fff; border-radius: 14px; padding: 20px; }
.modal h3 { margin: 0 0 6px; font-size: 15px; }
.modal .ipt { width: 100%; margin-top: 8px; }
.modal-acts { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.btn-ghost {
  height: 34px; padding: 0 14px; border: 1px solid var(--line); border-radius: 8px;
  background: #fff; font-size: 12.5px; cursor: pointer;
}
</style>
