<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { get, patch, post, upload } from '../api'
import { store } from '../store'
import { initial } from '../format'

interface Profile {
  id: number
  username: string
  email: string
  avatar: string | null
  bio: string | null
  location: string | null
  website: string | null
  contact: string | null
}

const router = useRouter()

const profile = ref<Profile | null>(null)
const loading = ref(true)

const form = reactive({ username: '', bio: '', location: '', website: '', contact: '' })
const msg = ref('')
const err = ref('')
const saving = ref(false)

const pw = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwMsg = ref('')
const pwErr = ref('')
const pwSaving = ref(false)

const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function load() {
  const r = await get<{ user: Profile }>('/api/user/profile')
  if (!r.ok) {
    if (r.msg.includes('登录')) router.push('/login')
    loading.value = false
    return
  }
  profile.value = r.data?.user ?? null
  Object.assign(form, {
    username: profile.value?.username ?? '',
    bio: profile.value?.bio ?? '',
    location: profile.value?.location ?? '',
    website: profile.value?.website ?? '',
    contact: profile.value?.contact ?? '',
  })
  loading.value = false
}

async function saveProfile() {
  msg.value = ''
  err.value = ''
  saving.value = true
  const r = await patch<{ user: Profile }>('/api/user/profile', { ...form })
  saving.value = false
  if (!r.ok) {
    err.value = r.msg
    return
  }
  profile.value = r.data?.user ?? profile.value
  if (store.user) store.user.username = form.username
  msg.value = '资料已保存'
}

async function savePassword() {
  pwMsg.value = ''
  pwErr.value = ''
  pwSaving.value = true
  const r = await post('/api/user/password', { ...pw })
  pwSaving.value = false
  if (!r.ok) {
    pwErr.value = r.msg
    return
  }
  pw.oldPassword = ''
  pw.newPassword = ''
  pw.confirmPassword = ''
  pwMsg.value = '密码已修改，下次登录请用新密码'
}

function pickAvatar() {
  fileInput.value?.click()
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  err.value = ''
  msg.value = ''
  uploading.value = true
  const fd = new FormData()
  fd.append('file', f)
  const r = await upload<{ avatar: string }>('/api/user/avatar', fd)
  uploading.value = false
  input.value = ''
  if (!r.ok) {
    err.value = r.msg
    return
  }
  const url = r.data?.avatar ?? null
  if (profile.value) profile.value.avatar = url
  if (store.user) store.user.avatar = url
  msg.value = '头像已更新'
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="state">加载中…</div>

  <div v-else-if="profile" class="settings">
    <header class="head">
      <h1>设置</h1>
      <p>换头像、改资料、改密码。</p>
    </header>

    <p v-if="msg" class="toast ok">{{ msg }}</p>
    <p v-if="err" class="toast bad">{{ err }}</p>

    <section class="card">
      <div class="card-head">
        <h2>头像</h2>
        <p>点击圆形头像更换，支持 jpg / png / webp / gif，2MB 内。</p>
      </div>
      <div class="avatar-row">
        <button class="pavatar" type="button" :disabled="uploading" @click="pickAvatar">
          <img v-if="profile.avatar" :src="profile.avatar" alt="头像" />
          <span v-else class="pavatar-ph">{{ initial(profile.username) }}</span>
          <em class="pavatar-mask">{{ uploading ? '上传中…' : '更换' }}</em>
        </button>
        <input
          ref="fileInput"
          class="hidden-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          @change="onFile"
        />
        <div class="avatar-tip">
          <strong>{{ profile.username }}</strong>
          <span>建议上传正方形图片，显示效果最好。</span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>基本资料</h2>
        <p>改个名字、写两句话，别人就知道你是谁了。</p>
      </div>

      <form class="fields" @submit.prevent="saveProfile">
        <div class="field">
          <label for="u">用户名</label>
          <input id="u" v-model="form.username" class="input" type="text" maxlength="32" />
          <small>2-32 位，中英文、数字、下划线、连字符都可以。</small>
        </div>

        <div class="field">
          <label for="b">个人简介</label>
          <textarea id="b" v-model="form.bio" class="textarea" rows="3" maxlength="300" placeholder="一句话介绍自己"></textarea>
          <small>{{ form.bio.length }} / 300</small>
        </div>

        <div class="grid2">
          <div class="field">
            <label for="l">所在地</label>
            <input id="l" v-model="form.location" class="input" type="text" maxlength="64" placeholder="杭州" />
          </div>
          <div class="field">
            <label for="c">联系方式</label>
            <input id="c" v-model="form.contact" class="input" type="text" maxlength="120" placeholder="Telegram / QQ / 邮箱" />
          </div>
        </div>

        <div class="field">
          <label for="w">个人网站</label>
          <input id="w" v-model="form.website" class="input" type="url" maxlength="200" placeholder="https://" />
        </div>

        <div class="actions">
          <button class="btn-save" type="submit" :disabled="saving">
            {{ saving ? '保存中…' : '保存资料' }}
          </button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>修改密码</h2>
        <p>需要原密码，改完下次登录用新的。</p>
      </div>

      <form class="fields" @submit.prevent="savePassword">
        <div class="field">
          <label for="op">原密码</label>
          <input id="op" v-model="pw.oldPassword" class="input" type="password" autocomplete="current-password" />
        </div>
        <div class="grid2">
          <div class="field">
            <label for="np">新密码</label>
            <input id="np" v-model="pw.newPassword" class="input" type="password" autocomplete="new-password" />
            <small>至少 6 位。</small>
          </div>
          <div class="field">
            <label for="cp">确认新密码</label>
            <input id="cp" v-model="pw.confirmPassword" class="input" type="password" autocomplete="new-password" />
          </div>
        </div>

        <p v-if="pwErr" class="inline-bad">{{ pwErr }}</p>
        <p v-if="pwMsg" class="inline-ok">{{ pwMsg }}</p>

        <div class="actions">
          <button class="btn-save" type="submit" :disabled="pwSaving">
            {{ pwSaving ? '提交中…' : '修改密码' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.state {
  padding: 70px 0;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.settings {
  max-width: 760px;
  margin: 0 auto;
}

.head {
  padding: 2px 0 20px;
}

.head h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: -0.02em;
}

.head p {
  margin: 7px 0 0;
  font-size: 14px;
  color: var(--muted);
}

.toast {
  margin: 0 0 16px;
  padding: 10px 13px;
  border-radius: 9px;
  font-size: 13.5px;
}
.toast.ok {
  background: #eef5f0;
  border: 1px solid #d6e6dc;
  color: #2f5b41;
}
.toast.bad {
  background: #fdf2f0;
  border: 1px solid #f3d6cf;
  color: #b4492f;
}

.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 24px 26px;
  margin-bottom: 20px;
}

.card-head {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}

.card-head h2 {
  margin: 0;
  font-size: 16.5px;
  font-weight: 600;
}

.card-head p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 18px;
}

.pavatar {
  position: relative;
  width: 84px;
  height: 84px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 50%;
  overflow: hidden;
  background: #e8e4db;
  cursor: pointer;
}

.pavatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pavatar-ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 30px;
  font-weight: 600;
  color: #4a453a;
}

.pavatar-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-style: normal;
  font-size: 12px;
  color: #fff;
  background: rgba(20, 18, 14, 0.5);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.pavatar:hover .pavatar-mask {
  opacity: 1;
}

.hidden-file {
  display: none;
}

.avatar-tip {
  display: grid;
  gap: 5px;
}

.avatar-tip strong {
  font-size: 16px;
}

.avatar-tip span {
  font-size: 13px;
  color: var(--muted);
}

.fields {
  display: grid;
  gap: 18px;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: grid;
  gap: 7px;
}

.field label {
  font-size: 13px;
  color: var(--muted);
}

.field small {
  font-size: 12px;
  color: #a8a196;
}

.input,
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

.input {
  height: 44px;
  padding: 0 13px;
}

.textarea {
  padding: 12px 13px;
  line-height: 1.7;
  resize: vertical;
}

.input:focus,
.textarea:focus {
  border-color: #b9c9bf;
  box-shadow: 0 0 0 3px rgba(62, 92, 75, 0.1);
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn-save {
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
.btn-save:disabled {
  opacity: 0.6;
  cursor: default;
}

.inline-bad {
  margin: 0;
  font-size: 13px;
  color: #b4492f;
}
.inline-ok {
  margin: 0;
  font-size: 13px;
  color: #2f5b41;
}

@media (max-width: 700px) {
  .head h1 {
    font-size: 22px;
  }
  .card {
    padding: 20px 18px;
  }
  .grid2 {
    grid-template-columns: 1fr;
  }
  .pavatar {
    width: 68px;
    height: 68px;
  }
}
</style>
