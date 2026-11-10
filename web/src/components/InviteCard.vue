<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import { get } from '../api'

interface Invite { id: number; code: string; used: boolean; usedAt: string | null; createdAt: string }

const baseUrl = ref('')
const items = ref<Invite[]>([])
const invited = ref(0)
const qr = ref('')
const activeCode = ref('')
const copied = ref('')

const active = computed(() => items.value.find((i) => i.code === activeCode.value) || null)
const link = computed(() => (active.value ? `${baseUrl.value}/register?invite=${active.value.code}` : ''))

async function load() {
  const r = await get<{ baseUrl: string; invited: number; items: Invite[] }>('/api/user/invites')
  if (!r.ok || !r.data) return
  baseUrl.value = r.data.baseUrl
  items.value = r.data.items
  invited.value = r.data.invited
  const free = items.value.find((i) => !i.used) || items.value[0]
  if (free) await pick(free)
}

async function pick(i: Invite) {
  activeCode.value = i.code
  if (!baseUrl.value) return
  qr.value = await QRCode.toDataURL(`${baseUrl.value}/register?invite=${i.code}`, {
    width: 320,
    margin: 1,
    color: { dark: '#26221C', light: '#FFFFFF' },
  })
}

async function copy(text: string, what: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
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
    copied.value = '复制失败，请手动选中'
  }
}

onMounted(load)
</script>

<template>
  <section class="card">
    <h2>邀请好友</h2>
    <p class="lead">每邀请一个朋友注册，你就能多一个一起聊天的人。用下面的链接、邀请码或二维码都行。</p>

    <div class="invite-grid">
      <div class="invite-left">
        <div class="code-box">
          <span class="code-label">你的邀请码</span>
          <b class="code">{{ active?.code || '—' }}</b>
          <button v-if="active" class="btn-mini" type="button" @click="copy(active.code, 'code')">
            {{ copied === 'code' ? '已复制' : '复制' }}
          </button>
        </div>
        <div class="link-box">
          <input :value="link" readonly @focus="($event.target as HTMLInputElement).select()" />
          <button class="btn-mini" type="button" :disabled="!link" @click="copy(link, 'link')">
            {{ copied === 'link' ? '已复制' : '复制链接' }}
          </button>
        </div>
        <p class="hint">已邀请 <b>{{ invited }}</b> 人 · 邀请码用过一次就失效，系统会自动补新的</p>
        <div class="codes">
          <button
            v-for="i in items"
            :key="i.id"
            class="code-chip"
            :class="{ on: i.code === activeCode, used: i.used }"
            type="button"
            @click="pick(i)"
          >
            {{ i.code }}
            <em v-if="i.used">已用</em>
          </button>
        </div>
      </div>
      <div class="qr-wrap">
        <img v-if="qr" :src="qr" alt="邀请二维码" class="qr" />
        <span class="qr-cap">扫码注册</span>
      </div>
    </div>
    <p v-if="copied && (copied === 'code' || copied === 'link')" class="ok"></p>
  </section>
</template>

<style scoped>
.lead { margin: -6px 0 16px; font-size: 13px; color: var(--muted); line-height: 1.7; }
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
.hint { margin: 10px 0 0; font-size: 12px; color: var(--muted); }
.codes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.code-chip {
  padding: 4px 9px; border: 1px solid var(--line); border-radius: 6px; background: #fff;
  font-size: 12px; letter-spacing: .06em; cursor: pointer; color: var(--ink);
}
.code-chip.on { border-color: var(--accent); color: var(--accent); background: #f3f7f4; }
.code-chip.used { color: #b9b2a6; text-decoration: line-through; }
.code-chip em { font-style: normal; font-size: 10px; margin-left: 3px; }
.qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.qr { width: 132px; height: 132px; border: 1px solid var(--line); border-radius: 10px; background: #fff; padding: 6px; }
.qr-cap { font-size: 11.5px; color: var(--muted); }
@media (max-width: 640px) { .invite-grid { flex-direction: column-reverse; } }
</style>
