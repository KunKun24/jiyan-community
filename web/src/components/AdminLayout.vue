<template>
  <div class="admin">
    <aside class="side">
      <RouterLink to="/admin" class="side-brand">
        <img src="/logo.png" alt="" />
        <span>管理后台</span>
      </RouterLink>
      <nav class="side-nav">
        <RouterLink v-for="m in menus" :key="m.to" :to="m.to" class="side-link">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path :d="m.icon" /></svg>
          <span>{{ m.label }}</span>
        </RouterLink>
      </nav>
      <div class="side-foot">
        <RouterLink to="/forum" class="side-back">← 返回社区</RouterLink>
      </div>
    </aside>
    <main class="main"><RouterView /></main>
  </div>
</template>

<script setup lang="ts">
const menus = [
  { to: '/admin', label: '总览', icon: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z' },
  { to: '/admin/posts', label: '帖子管理', icon: 'M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm9 1v4h4M8 13h8M8 17h5' },
  { to: '/admin/reports', label: '举报管理', icon: 'M12 3l8 15H4l8-15zm0 5v5m0 3v.01' },
  { to: '/admin/users', label: '账号管理', icon: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-2.8 2.7-5 6-5s6 2.2 6 5m1-5c3 .3 5 2.3 5 5' },
  { to: '/admin/categories', label: '板块管理', icon: 'M4 5h16M4 12h16M4 19h10' },
  { to: '/admin/banners', label: '轮播图', icon: 'M4 6h16v12H4zM8 6v12m8-12v12M4 10h4m8 0h4' },
  { to: '/admin/notices', label: '公告管理', icon: 'M4 9v6h4l5 4V5L8 9H4zm13-1a5 5 0 0 1 0 8' },
  { to: '/admin/words', label: '敏感词', icon: 'M4 5h7v7H4V5zm9 0h7v7h-7V5zM4 14h7v5H4v-5zm9 0h7v5h-7v-5z' },
]
</script>

<style scoped>
.admin { min-height: 100vh; background: var(--bg); }
.side {
  position: fixed; inset: 0 auto 0 0; width: 224px; background: #fbfaf7;
  border-right: 1px solid var(--line); padding: 22px 14px; display: flex; flex-direction: column; z-index: 10;
}
.side-brand { display: flex; align-items: center; gap: 10px; padding: 4px 10px 22px; color: var(--ink); }
.side-brand img { width: 26px; height: 26px; }
.side-brand span { font-weight: 600; font-size: 15px; letter-spacing: .02em; }
.side-nav { display: flex; flex-direction: column; gap: 2px; }
.side-link {
  display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px;
  color: var(--muted); font-size: 14px;
}
.side-link:hover { background: #f4f1ea; color: var(--ink); }
.side-link.router-link-exact-active { background: #eef2ed; color: var(--accent); font-weight: 600; }
.side-foot { margin-top: auto; padding: 10px; }
.side-back { font-size: 13px; color: var(--muted); }
.side-back:hover { color: var(--accent); }
.main { margin-left: 224px; padding: 32px 36px 64px; }
@media (max-width: 760px) {
  .side { position: static; width: auto; padding: 12px; border-right: 0; border-bottom: 1px solid var(--line); flex-direction: row; align-items: center; gap: 8px; overflow-x: auto; }
  .side-brand { padding: 0 8px 0 4px; white-space: nowrap; }
  .side-brand span { display: none; }
  .side-nav { flex-direction: row; }
  .side-link { padding: 8px 10px; white-space: nowrap; }
  .side-foot { margin: 0 0 0 auto; padding: 0; }
  .main { margin-left: 0; padding: 20px 16px 48px; }
}
</style>
