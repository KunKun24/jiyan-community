<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppTabs from './AppTabs.vue'
import { store, logout } from '../store'
import { initial } from '../format'

const router = useRouter()

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
          <template v-if="store.user">
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
  </div>
</template>

<style scoped>
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
