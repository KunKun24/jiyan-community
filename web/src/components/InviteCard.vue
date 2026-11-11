<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import { get } from '../api'
import { initial, timeAgo } from '../format'

interface Inviter { id: number; username: string; avatar: string | null; createdAt: string }

const baseUrl = ref('')
const code = ref('')
const invited = ref(0)
const title = ref('')
const nextTitle = ref<string | null>(null)
const nextAt = ref<number | null>(null)
const items = ref<Inviter[]>([])
const qr = ref('')
const copied = ref('')

const link = computed(() => (code.value ? `${baseUrl.value}/register?invite=${code.value}` : ''))
const progress = computed(() => {
  if (!nextAt.value) return 100
  return Math.min(100, Math.round((invited.value / nextAt.value) * 100))
})
const remain = computed(() => (nextAt.value ? Math.max(0, nextAt.value - invited.value) : 0))

async function load() {
  const r = await get<{
    baseUrl: string; code: string; invited: number; title: string
    nextTitle: string | null; nextAt: number | null; items: Inviter[]
  }>('/api/user/invites')
  if (!r.ok || !r.data) return
  baseUrl.value = r.data.baseUrl
  code.value = r.data.code
  invited.value = r.data.invited
  title.value = r.data.title
  nextTitle.value = r.data.nextTitle
  nextAt.value = r.data.nextAt
  items.value = r.data.items
  qr.value = await QRCode.toDataURL(`${r.data.baseUrl}/register?invite=${r.data.code}`, {
    width: 320, margin: 1, color: { dark: '#26221C', light: '#FFFFFF' },
  })
}

async function copy(text: string, what: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text)
    else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = what
    setTimeout(() => (copied.value = ''), 1600)
  } catch {
    copied.value = 'fail'
  }
}

onMounted(load)
</script>

<template>
  <section class="card">
    <div class="head">
      <h2>邀请好友</h2>
      <span class="badge" :class="{ none: !invited }">{{ title }}</span>
    </div>
    <p class="lead">你的邀请码长期有效，不限次数。对方用你的码注册后，就会记在你名下。</p>

    <div class="invite-grid">
      <div class="invite-left">
        <div class="code-box">
          <span class="code-label">你的邀请码</span>
          <b class="code">{{ code || '—' }}</b>
          <button v-if="code" class="btn-mini" type="button" @click="copy(code, 'code')">
            {{ copied === 'code' ? '已复制' : '复制' }}
          </button>
        </div>
        <div class="link-box">
          <input :value="link" readonly @focus="($event.target as HTMLInputElement).select()" />
          <button class="btn-mini" type="button" :disabled="!link" @click="copy(link, 'link')">
            {{ copied === 'link' ? '已复制' : '复制链接' }}
          </button>
        </div>

        <div class="stat-line">
          <span>已邀请 <b>{{ invited }}</b> 人</span>
          <span v-if="nextTitle" class="next">再邀 {{ remain }} 人升级为「{{ nextTitle }}」</span>
          <span v-else class="next done">已是最高称号</span>
        </div>
        <div class="bar"><i :style="{ width: progress + '%' }" /></div>

        <div v-if="items.length" class="who">
          <span class="who-label">最近邀请</span>
          <div class="who-list">
            <RouterLink v-for="u in items" :key="u.id" class="who-item" :to="`/u/${u.id}`" :title="`${u.username} · ${timeAgo(u.createdAt)}`">
              <img v-if="u.avatar" :src="u.avatar" alt="" />
              <span v-else class="ph">{{ initial(u.username) }}</span>
            </RouterLink>
          </div>
        </div>
        <p class="hint">称号只看成功注册的人数，同一个人重复注册不会重复计数。</p>
      </div>

      <div class="qr-wrap">
        <img v-if="qr" :src="qr" alt="邀请二维码" class="qr" />
        <span class="qr-cap">扫码注册</span>
      </div>
    </div>
    <p v-if="copied === 'fail'" class="err">复制失败，请手动选中</p>
  </section>
</template>

<style scoped>
.head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.head h2 { margin: 0; }
.badge {
  padding: 2px 9px; border-radius: 999px; background: #edf3ee; color: #3e5c4b;
  font-size: 11.5px; letter-spacing: .04em;
}
.badge.none { background: #f1ede6; color: #8b8377; }
.lead { margin: 4px 0 16px; font-size: 13px; color: var(--muted); line-height: 1.7; }
.invite-grid { display: flex; gap: 20px; align-items: flex-start; }
.invite-left { flex: 1; min-width: 0; }
.code-box {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  background: #f7f5f1; border: 1px dashed #d8d2c6; border-radius: 10px;
}
.code-label { font-size: 12px; color: var(--muted); }
.code { font-size: 20px; letter-spacing: .12em; color: var(--accent); font-family: ui-monospace, Menlo, monospace; }
.link-box { display: flex; gap: 8px; margin-top: 10px; }
.link-box input {
  flex: 1; min-width: 0; height: 36px; padding: 0 10px; border: 1px solid var(--line);
  border-radius: 8px; font-size: 12.5px; color: var(--muted); background: #fff;
}
.btn-mini {
  height: 30px; padding: 0 12px; border: 1px solid var(--line); border-radius: 7px;
  background: #fff; font-size: 12.5px; cursor: pointer; color: var(--ink); flex-shrink: 0;
}
.btn-mini:hover { border-color: var(--accent); color: var(--accent); }
.stat-line { display: flex; justify-content: space-between; gap: 12px; margin-top: 14px; font-size: 12.5px; color: var(--muted); }
.stat-line b { color: var(--ink); }
.next { color: var(--accent); }
.next.done { color: #8b8377; }
.bar { height: 6px; border-radius: 999px; background: #ece7de; margin-top: 7px; overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--accent); border-radius: 999px; transition: width .4s ease; }
.who { margin-top: 14px; }
.who-label { font-size: 12px; color: var(--muted); }
.who-list { display: flex; gap: 6px; margin-top: 7px; flex-wrap: wrap; }
.who-item img, .who-item .ph {
  width: 28px; height: 28px; border-radius: 50%; object-fit: cover; display: block;
  background: #ece7de; color: #7c7469; font-size: 12px; line-height: 28px; text-align: center;
}
.hint { margin: 12px 0 0; font-size: 11.5px; color: #a8a196; }
.qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.qr { width: 132px; height: 132px; border: 1px solid var(--line); border-radius: 10px; background: #fff; padding: 6px; }
.qr-cap { font-size: 11.5px; color: var(--muted); }
.err { margin: 10px 0 0; font-size: 12px; color: #b3261e; }
@media (max-width: 640px) { .invite-grid { flex-direction: column-reverse; } }
</style>
