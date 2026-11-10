<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTabs from './AppTabs.vue'
import { store, logout } from '../store'
import { initial } from '../format'
import { get } from '../api'
import { connectRealtime, onRealtime } from '../realtime'
import AnnouncementModal from './AnnouncementModal.vue'

const router = useRouter()
const route = useRoute()
const unread = ref(0)

const msgUnread = ref(0)

async function loadUnread() {
  if (!store.user) {
    unread.value = 0
    msgUnread.value = 0
    return
  }
  const [r, m] = await Promise.all([
    get<{ unread: number }>('/api/notifications/count'),
    get<{ count: number }>('/api/messages/unread-count'),
  ])
  if (r.ok) unread.value = r.data?.unread || 0
  if (m.ok) msgUnread.value = m.data?.count || 0
}

let offRealtime: (() => void) | null = null
onMounted(() => {
  loadUnread()
  if (store.user) {
    connectRealtime()
    offRealtime = onRealtime((d) => {
      if (d.type === 'message') {
        msgUnread.value++
        loadUnread()
      }
    })
  }
})
watch(() => route.fullPath, loadUnread)
onBeforeUnmount(() => { offRealtime?.() })

async function onLogout() {
  await logout()
  router.push('/')
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="topbar-inner">
        <RouterLink class="brand" to="/">
          <img src="/logo.png" alt="极验社区" />
          <span>极验社区</span>
        </RouterLink>

        <AppTabs />

        <div class="top-actions">
          <RouterLink class="icon-btn" to="/search" title="搜索" aria-label="搜索">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
            </svg>
          </RouterLink>
          <template v-if="store.user">
            <RouterLink class="icon-btn" to="/messages" title="私信" aria-label="私信">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M4 6h16v10a2 2 0 0 1-2 2H9l-5 3V6Z" />
                <path d="M8 10h8M8 13h5" />
              </svg>
              <i v-if="msgUnread" class="badge-dot">{{ msgUnread > 99 ? '99+' : msgUnread }}</i>
            </RouterLink>
            <RouterLink class="icon-btn" to="/notifications" title="消息" aria-label="消息">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 3a6 6 0 0 0-6 6v4l-1.5 3h15L18 13V9a6 6 0 0 0-6-6Z" />
                <path d="M10 19a2 2 0 0 0 4 0" />
              </svg>
              <i v-if="unread" class="badge-dot">{{ unread > 99 ? '99+' : unread }}</i>
            </RouterLink>
            <RouterLink v-if="store.user?.role === 'admin'" class="icon-btn" to="/admin" title="管理后台" aria-label="管理后台">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" />
              </svg>
            </RouterLink>
            <RouterLink class="btn-primary" to="/new">发帖</RouterLink>
            <RouterLink class="userbox" to="/me" title="个人资料">
              <img v-if="store.user.avatar" class="avatar-img" :src="store.user.avatar" alt="" />
              <span v-else class="avatar">{{ initial(store.user.username) }}</span>
              <span class="uname">{{ store.user.username }}</span>
            </RouterLink>
            <button class="btn-link" type="button" @click="onLogout">退出</button>
          </template>
          <template v-else>
            <RouterLink class="btn-ghost" to="/login">登录</RouterLink>
            <RouterLink class="btn-primary" to="/register">注册</RouterLink>
          </template>
        </div>
      </div>
    </header>

    <main class="shell-main">
      <RouterView v-slot="{ Component, route }">
        <Transition name="tabfade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <AnnouncementModal />
  </div>
</template>

<style scoped>
.icon-btn {
  position: relative;
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  color: #7c7469;
}
.icon-btn:hover {
  background: #f1ede5;
  color: var(--ink);
}
.badge-dot {
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #b4483f;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  line-height: 16px;
  text-align: center;
}
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(247, 245, 241, 0.86);
  backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--line);
}

.topbar-inner {
  max-width: 1120px;
  margin: 0 auto;
  height: 62px;
  padding: 0 22px;
  display: flex;
  align-items: center;
  gap: 22px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  font-weight: 700;
  flex: none;
}

.brand img {
  width: 27px;
  height: 27px;
  border-radius: 7px;
}

.top-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
}

.btn-primary {
  background: var(--ink);
  color: #fff;
}

.btn-primary:hover {
  background: #2c2a22;
}

.btn-ghost {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
}

.btn-ghost:hover {
  background: #f4f1ec;
}

.userbox {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
}

.avatar-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e8e4db;
  color: #4a453a;
  font-size: 13px;
  font-weight: 600;
  display: grid;
  place-items: center;
}

.uname {
  font-size: 13.5px;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-link {
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
}

.btn-link:hover {
  color: var(--ink);
}

.shell-main {
  flex: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px 22px 64px;
}

@media (max-width: 700px) {
  .uname {
    display: none;
  }
  .topbar-inner {
    padding: 0 16px;
    gap: 12px;
  }
  .shell-main {
    padding: 20px 14px 84px;
  }
}
</style>
