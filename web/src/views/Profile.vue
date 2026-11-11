<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { del, get, patch, post } from '../api'
import { fmtNum, initial, timeAgo } from '../format'
import InviteCard from '../components/InviteCard.vue'
import AccountSecurity from '../components/AccountSecurity.vue'

interface Profile {
  id: number
  username: string
  email: string
  avatar: string | null
  bio: string | null
  location: string | null
  website: string | null
  contact: string | null
  createdAt: string
  points: number
  checkinCount: number
  likesReceived: number
  shareCount: number
  lastCheckinOn: string | null
}

interface MyPost {
  id: number
  title: string
  status: string
  views: number
  createdAt: string
  category: { name: string; slug: string }
}

interface Bookmark {
  postId: number
  available: boolean
  title: string | null
  author: string | null
  category: { name: string } | null
  savedAt: string
}

interface Level {
  level: number
  name: string
  growth: number
  nextName: string | null
  nextAt: number | null
  progress: number
}

const router = useRouter()
const profile = ref<Profile | null>(null)
const stats = ref({ posts: 0, replies: 0 })
const level = ref<Level | null>(null)
const loading = ref(true)
const checkedIn = ref(false)
const checkinMsg = ref('')
const myPosts = ref<MyPost[]>([])
const bookmarks = ref<Bookmark[]>([])
const selected = ref<number[]>([])
const delTarget = ref<MyPost | null>(null)
const batchDelete = ref(false)
const pendingIds = ref<number[]>([])
const deleting = ref<number[]>([])
const busyIds = ref<number[]>([])
const opMsg = ref('')

function flash(t: string) {
  opMsg.value = t
  setTimeout(() => {
    if (opMsg.value === t) opMsg.value = ''
  }, 2400)
}

function toggleSel(id: number) {
  const i = selected.value.indexOf(id)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(id)
}

function toggleAll() {
  if (selected.value.length === myPosts.value.length) selected.value = []
  else selected.value = myPosts.value.map((p) => p.id)
}

async function setStatus(p: MyPost, status: string) {
  if (busyIds.value.includes(p.id)) return
  busyIds.value.push(p.id)
  const r = await patch<{ status: string }>(`/api/posts/${p.id}`, { status })
  busyIds.value = busyIds.value.filter((x) => x !== p.id)
  if (!r.ok) {
    flash(r.msg)
    return
  }
  p.status = status
  flash(status === 'private' ? '已设为私密，只有你自己能看' : '已公开')
}

async function bulkStatus(status: string) {
  const ids = [...selected.value]
  if (!ids.length) return
  busyIds.value = ids
  flash('正在处理…')
  let done = 0
  for (const id of ids) {
    const p = myPosts.value.find((x) => x.id === id)
    if (!p) continue
    const r = await patch(`/api/posts/${p.id}`, { status })
    if (r.ok) {
      p.status = status
      done++
    }
  }
  busyIds.value = []
  selected.value = []
  flash(status === 'private' ? `已把 ${done} 篇设为私密` : `已公开 ${done} 篇`)
}

function askDelete(p: MyPost) {
  delTarget.value = p
  batchDelete.value = false
}

function askBulkDelete() {
  if (!selected.value.length) return
  pendingIds.value = [...selected.value]
  delTarget.value = null
  batchDelete.value = true
}

function closeModal() {
  delTarget.value = null
  batchDelete.value = false
  pendingIds.value = []
}

async function doDelete() {
  if (batchDelete.value) {
    const ids = [...pendingIds.value]
    // 先关弹窗、把行标成“删除中”，别让用户对着静止的界面等
    closeModal()
    deleting.value = ids
    let done = 0
    for (const id of ids) {
      const r = await del(`/api/posts/${id}`)
      if (r.ok) {
        done++
        myPosts.value = myPosts.value.filter((p) => p.id !== id)
      }
    }
    deleting.value = []
    selected.value = []
    flash(done === ids.length ? `已删除 ${done} 篇` : `删除了 ${done} 篇，有 ${ids.length - done} 篇没成功`)
    return
  }

  const p = delTarget.value
  if (!p) return
  closeModal()
  deleting.value = [p.id]
  const r = await del(`/api/posts/${p.id}`)
  deleting.value = []
  if (!r.ok) {
    flash(r.msg)
    return
  }
  myPosts.value = myPosts.value.filter((x) => x.id !== p.id)
  selected.value = selected.value.filter((x) => x !== p.id)
  flash('帖子已删除')
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysSince(s: string) {
  const t = new Date(s).getTime()
  if (!t) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 86400000))
}

async function checkin() {
  const r = await post<{ user: Profile; level: Level; gained: number }>('/api/user/checkin', {})
  if (!r.ok) {
    checkinMsg.value = r.msg
    checkedIn.value = true
    return
  }
  profile.value = r.data?.user ?? profile.value
  level.value = r.data?.level ?? level.value
  checkedIn.value = true
  checkinMsg.value = r.msg
}

const loadError = ref('')
let loadTimer: number | undefined

async function load() {
  loading.value = true
  loadError.value = ''
  window.clearTimeout(loadTimer)
  loadTimer = window.setTimeout(() => {
    if (loading.value) { loading.value = false; loadError.value = '加载时间有点长，网络可能不稳定。' }
  }, 8000)
  try {
    const r = await get<{ user: Profile; stats: { posts: number; replies: number } }>('/api/user/profile')
    if (!r.ok) {
      if (r.msg.includes('登录')) { router.push('/login'); return }
      loadError.value = r.msg || '加载失败'
      return
    }
    profile.value = r.data?.user ?? null
    level.value = (r.data as { level?: Level })?.level ?? null
    stats.value = r.data?.stats ?? { posts: 0, replies: 0 }
    checkedIn.value = !!profile.value?.lastCheckinOn && profile.value.lastCheckinOn === todayStr()

    const [a, b] = await Promise.all([
      get<{ posts: MyPost[] }>('/api/user/posts'),
      get<{ bookmarks: Bookmark[] }>('/api/user/bookmarks'),
    ])
    if (a.ok) myPosts.value = a.data?.posts ?? []
    if (b.ok) bookmarks.value = b.data?.bookmarks ?? []
  } catch {
    loadError.value = '加载失败，请检查网络后重试。'
  } finally {
    window.clearTimeout(loadTimer)
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <SkeletonList v-if="loading" :rows="5" thumb />
  <LoadError v-else-if="loadError" :message="loadError" @retry="load" />

  <div v-else-if="profile" class="profile">
    <header class="phead">
      <img v-if="profile.avatar" class="big-avatar" :src="profile.avatar" alt="头像" />
      <span v-else class="big-avatar ph">{{ initial(profile.username) }}</span>

      <div class="pinfo">
        <h1>{{ profile.username }}</h1>
        <p class="bio">{{ profile.bio || '这个人还没有写简介。' }}</p>
        <p class="meta">
          加入于 {{ profile.createdAt.slice(0, 10) }}
          <span class="dot">·</span>{{ stats.posts }} 帖
          <span class="dot">·</span>{{ stats.replies }} 回复
        </p>
      </div>

      <RouterLink class="btn-edit" to="/settings">编辑资料</RouterLink>
    </header>

    <section class="growth">
      <div class="lv">
        <span class="lv-badge">Lv{{ level?.level ?? 1 }}</span>
        <strong>{{ level?.name ?? '路过' }}</strong>
      </div>

      <div class="grow-main">
        <div class="grow-top">
          <span>贡献值 <b>{{ profile.points }}</b></span>
          <span v-if="level?.nextName" class="next">
            距「{{ level.nextName }}」还差 {{ (level.nextAt ?? 0) - level.growth }}
          </span>
          <span v-else class="next">已到最高等级</span>
        </div>
        <div class="bar"><i :style="{ width: (level?.progress ?? 100) + '%' }"></i></div>
        <div class="facts">
          <span>注册 {{ daysSince(profile.createdAt) }} 天</span>
          <span>签到 {{ profile.checkinCount }} 次</span>
          <span>被赞 {{ profile.likesReceived }}</span>
          <span>分享 {{ profile.shareCount }}</span>
        </div>
      </div>

      <button class="checkin" type="button" :disabled="checkedIn" @click="checkin">
        {{ checkedIn ? '今日已签到' : '签到 +3' }}
      </button>
    </section>
    <p v-if="checkinMsg" class="checkin-msg">{{ checkinMsg }}</p>

    <section class="card">
      <h2>资料</h2>
      <dl>
        <div class="row">
          <dt>邮箱</dt>
          <dd>{{ profile.email }}</dd>
        </div>
        <div class="row">
          <dt>所在地</dt>
          <dd>{{ profile.location || '未填写' }}</dd>
        </div>
        <div class="row">
          <dt>联系方式</dt>
          <dd>{{ profile.contact || '未填写' }}</dd>
        </div>
        <div class="row">
          <dt>个人网站</dt>
          <dd>
            <a v-if="profile.website" :href="profile.website" target="_blank" rel="noopener noreferrer">
              {{ profile.website }}
            </a>
            <span v-else>未填写</span>
          </dd>
        </div>
      </dl>
    </section>

    <section class="card">
      <div class="post-head">
        <h2>我的帖子</h2>
        <div class="post-tools">
          <span v-if="opMsg" class="op-msg">{{ opMsg }}</span>
          <label v-if="myPosts.length" class="pick-all">
            <input
              type="checkbox"
              :checked="myPosts.length > 0 && selected.length === myPosts.length"
              @change="toggleAll"
            />
            全选
          </label>
        </div>
      </div>

      <div v-if="selected.length" class="bulk-bar">
        <span>已选 {{ selected.length }} 篇</span>
        <button type="button" @click="bulkStatus('private')">设为私密</button>
        <button type="button" @click="bulkStatus('public')">设为公开</button>
        <button type="button" class="danger" @click="askBulkDelete">删除</button>
        <button type="button" class="plain" @click="selected = []">取消</button>
      </div>

      <p v-if="!myPosts.length" class="empty">还没发过帖子。</p>
      <div v-else class="list">
        <div
          v-for="p in myPosts"
          :key="p.id"
          class="item post-item"
          :class="{ picked: selected.includes(p.id), deleting: deleting.includes(p.id), busy: busyIds.includes(p.id) }"
        >
          <input
            class="pick"
            type="checkbox"
            :checked="selected.includes(p.id)"
            @change="toggleSel(p.id)"
          />
          <RouterLink class="post-link" :to="`/post/${p.id}`">
            <span class="item-title">
              {{ p.title }}
              <span v-if="p.status === 'private'" class="badge">私密</span>
            </span>
            <span class="item-meta">
              {{ p.category.name }} · {{ timeAgo(p.createdAt) }} · {{ fmtNum(p.views) }} 浏览
              <span v-if="deleting.includes(p.id)" class="del-tip">删除中…</span>
            </span>
          </RouterLink>
          <div class="post-ops">
            <button
              class="op"
              type="button"
              :title="p.status === 'private' ? '设为公开' : '设为私密'"
              @click.prevent="setStatus(p, p.status === 'private' ? 'public' : 'private')"
            >
              <svg v-if="p.status === 'private'" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M7 11V8a5 5 0 0 1 9.5-2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                <rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.7" />
              </svg>
            </button>
            <button class="op danger" type="button" title="删除" @click.prevent="askDelete(p)">
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="delTarget || batchDelete" class="modal-mask" @click.self="closeModal">
        <div class="modal">
          <h3>{{ batchDelete ? '批量删除帖子' : '删除帖子' }}</h3>
          <p v-if="batchDelete">将删除选中的 {{ pendingIds.length }} 篇帖子，回复、点赞、收藏一并清掉，不能恢复。</p>
          <p v-else>《{{ delTarget?.title }}》会被永久删除，回复、点赞、收藏一并清掉，不能恢复。</p>
          <div class="modal-acts">
            <button class="btn-ghost" type="button" @click="closeModal">取消</button>
            <button class="btn-danger" type="button" @click="doDelete">确认删除</button>
          </div>
        </div>
      </div>
    </section>

    <InviteCard />

    <AccountSecurity />

    <section class="card">
      <h2>我的收藏</h2>
      <p v-if="!bookmarks.length" class="empty">还没有收藏。看到值得留的帖子，点一下书签。</p>
      <div v-else class="list">
        <template v-for="b in bookmarks" :key="b.postId">
          <RouterLink v-if="b.available" class="item" :to="`/post/${b.postId}`">
            <span class="item-title">{{ b.title }}</span>
            <span class="item-meta">
              {{ b.author }}<template v-if="b.category"> · {{ b.category.name }}</template>
            </span>
          </RouterLink>
          <div v-else class="item gone">
            <span class="item-title">该帖子可能已被版主私密或删除</span>
            <span class="item-meta">收藏于 {{ timeAgo(b.savedAt) }}</span>
          </div>
        </template>
      </div>
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

.profile {
  max-width: 760px;
  margin: 0 auto;
}

.phead {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 4px 0 24px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 22px;
}

.big-avatar {
  width: 88px;
  height: 88px;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.big-avatar.ph {
  display: grid;
  place-items: center;
  background: #e8e4db;
  color: #4a453a;
  font-size: 32px;
  font-weight: 600;
}

.pinfo {
  min-width: 0;
  flex: 1;
}

.pinfo h1 {
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.02em;
}

.bio {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--muted);
  white-space: pre-wrap;
  word-break: break-word;
}

.meta {
  margin: 9px 0 0;
  font-size: 12.5px;
  color: #a8a196;
}

.dot {
  margin: 0 7px;
  color: #cfc8bb;
}

.btn-edit {
  flex: none;
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 600;
}

.btn-edit:hover {
  background: #f4f1ec;
}

.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 22px 24px;
}

.card h2 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
}

dl {
  margin: 0;
}

.row {
  display: flex;
  gap: 18px;
  padding: 12px 0;
  border-bottom: 1px solid #f0ece4;
  font-size: 14px;
}

.row:last-child {
  border-bottom: 0;
}

dt {
  width: 84px;
  flex: none;
  color: var(--muted);
}

dd {
  margin: 0;
  color: var(--ink);
  word-break: break-word;
}

dd a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.growth {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 20px;
  margin: 4px 0 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(38, 34, 28, 0.05);
}

.lv {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 62px;
}

.lv-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.lv strong {
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
}

.grow-main {
  flex: 1;
  min-width: 0;
}

.grow-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: var(--muted);
}

.grow-top b {
  color: var(--ink);
  font-size: 15px;
}

.next {
  font-size: 12px;
  color: #a09a8e;
}

.bar {
  height: 6px;
  border-radius: 999px;
  background: #efeae1;
  margin: 8px 0 9px;
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 0.4s ease;
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #a09a8e;
}

.checkin {
  flex: none;
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: var(--ink);
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.checkin:disabled {
  background: #e7e2d9;
  color: #a8a196;
  cursor: default;
}

.checkin-msg {
  margin: -6px 0 14px;
  font-size: 12.5px;
  color: var(--accent);
}

.empty {
  margin: 4px 0 2px;
  font-size: 13px;
  color: #a09a8e;
}

.list {
  display: flex;
  flex-direction: column;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 2px;
  border-bottom: 1px solid #efeae1;
}

.item:last-child {
  border-bottom: 0;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  color: var(--ink);
}

.item:hover .item-title {
  color: var(--accent);
}

.item-meta {
  font-size: 12px;
  color: #a09a8e;
}

.badge {
  padding: 1px 6px;
  border-radius: 4px;
  background: #f4ece4;
  color: #9a6b4a;
  font-size: 11px;
}

.gone .item-title {
  color: #a8a196;
  font-style: normal;
}

@media (max-width: 700px) {
  .growth {
    flex-wrap: wrap;
    gap: 14px;
  }
  .grow-main {
    flex-basis: 100%;
    order: 3;
  }
  .phead {
    gap: 14px;
  }
  .big-avatar {
    width: 68px;
    height: 68px;
  }
  .pinfo h1 {
    font-size: 20px;
  }
  .btn-edit {
    align-self: flex-start;
    height: 32px;
    padding: 0 12px;
  }
  .card {
    padding: 18px 16px;
  }
}
.post-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.post-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}
.op-msg {
  font-size: 12.5px;
  color: var(--accent);
}
.pick-all {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--muted);
  cursor: pointer;
}
.bulk-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background: #f4f1ea;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 8px 0 4px;
  font-size: 13px;
  color: var(--muted);
}
.bulk-bar button {
  border: 1px solid #ddd6c9;
  background: #fff;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12.5px;
  cursor: pointer;
  color: var(--ink);
}
.bulk-bar button.danger {
  color: #b4432f;
  border-color: #e8c9c1;
}
.bulk-bar button.plain {
  margin-left: auto;
  border-color: transparent;
  background: transparent;
}
.post-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
.post-item.busy {
  opacity: 0.55;
}
.post-item.deleting {
  opacity: 0.45;
  pointer-events: none;
}
.del-tip {
  color: #b4432f;
  margin-left: 6px;
}
.post-item.picked {
  background: #faf8f3;
}
.post-item .pick {
  flex: none;
  width: 15px;
  height: 15px;
  accent-color: #3e5c4b;
  cursor: pointer;
}
.post-link {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-decoration: none;
  color: inherit;
}
.post-ops {
  flex: none;
  display: flex;
  gap: 4px;
}
.op {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
}
.op:hover {
  background: #f1ede5;
  color: var(--ink);
}
.op.danger:hover {
  background: #fbf0ed;
  color: #b4432f;
}
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(38, 34, 28, 0.34);
  backdrop-filter: blur(2px);
}
.modal {
  width: min(400px, 100%);
  background: #fff;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 24px 60px rgba(20, 18, 14, 0.22);
}
.modal h3 {
  margin: 0 0 8px;
  font-size: 17px;
}
.modal p {
  margin: 0 0 18px;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--muted);
}
.modal-acts {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}
.btn-ghost {
  height: 36px;
  padding: 0 15px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}
.btn-danger {
  height: 36px;
  padding: 0 15px;
  border: 0;
  border-radius: 8px;
  background: #b4483f;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}
</style>
