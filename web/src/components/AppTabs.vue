<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

interface Tab {
  path: string
  label: string
  icon: string
}

const tabs: Tab[] = [
  {
    path: '/forum',
    label: '社区',
    icon: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  },
  {
    path: '/categories',
    label: '板块',
    icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  },
  {
    path: '/me',
    label: '个人',
    icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  {
    path: '/settings',
    label: '设置',
    icon: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  },
]

function isActive(path: string) {
  if (path === '/forum') return route.path === '/forum' || route.path.startsWith('/post/')
  return route.path === path
}
</script>

<template>
  <!-- 顶部：平板 / 电脑 -->
  <nav class="tabs-top" aria-label="主导航">
    <div class="tabs-inner">
      <RouterLink
        v-for="t in tabs"
        :key="t.path"
        :to="t.path"
        class="tab"
        :class="{ active: isActive(t.path) }"
      >
        <span>{{ t.label }}</span>
      </RouterLink>
    </div>
  </nav>

  <!-- 底部：手机 -->
  <nav class="tabs-bottom" aria-label="主导航">
    <RouterLink
      v-for="t in tabs"
      :key="t.path"
      :to="t.path"
      class="btab"
      :class="{ active: isActive(t.path) }"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path :d="t.icon" />
      </svg>
      <span>{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabs-top {
  position: sticky;
  top: 62px;
  z-index: 19;
  background: rgba(247, 245, 241, 0.9);
  backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--line);
}

.tabs-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 22px;
  display: flex;
  gap: 4px;
}

.tab {
  position: relative;
  height: 46px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  transition: color 0.18s ease;
}

.tab:hover {
  color: var(--ink);
}

.tab.active {
  color: var(--ink);
  font-weight: 600;
}

.tab::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.24s cubic-bezier(0.22, 0.7, 0.24, 1);
}

.tab.active::after {
  transform: scaleX(1);
}

.tabs-bottom {
  display: none;
}

@media (max-width: 700px) {
  .tabs-top {
    display: none;
  }

  .tabs-bottom {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    background: rgba(252, 251, 248, 0.94);
    backdrop-filter: saturate(180%) blur(16px);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .btab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 56px;
    font-size: 11px;
    color: var(--muted);
    transition: color 0.18s ease;
  }

  .btab svg {
    width: 22px;
    height: 22px;
    transition: transform 0.2s cubic-bezier(0.22, 0.7, 0.24, 1);
  }

  .btab.active {
    color: var(--accent);
    font-weight: 600;
  }

  .btab.active svg {
    transform: translateY(-1px);
  }
}
</style>
