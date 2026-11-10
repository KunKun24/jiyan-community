<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="auth-page">
    <header class="auth-nav">
      <RouterLink class="auth-brand" to="/">
        <img src="/logo.png" alt="" />
        <span>极验社区</span>
      </RouterLink>
      <RouterLink class="auth-back" to="/">← 返回首页</RouterLink>
    </header>

    <main class="auth-main">
      <section class="auth-card">
        <p v-if="eyebrow" class="auth-eyebrow">{{ eyebrow }}</p>
        <h1 class="auth-title">{{ title }}</h1>
        <p v-if="subtitle" class="auth-sub">{{ subtitle }}</p>
        <slot />
      </section>
    </main>

    <footer class="auth-foot">© {{ new Date().getFullYear() }} 极验社区</footer>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.auth-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px clamp(20px, 5vw, 56px);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.auth-brand img {
  width: 26px;
  height: 26px;
  border-radius: 7px;
}

.auth-back {
  font-size: 13.5px;
  color: var(--muted);
  transition: color 0.15s ease;
}

.auth-back:hover {
  color: var(--ink);
}

.auth-main {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 12px 20px 56px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 38px 34px 34px;
  box-shadow: 0 10px 34px rgba(38, 34, 28, 0.05);
}

.auth-eyebrow {
  margin: 0 0 10px;
  font-size: 12.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.auth-title {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.auth-sub {
  margin: 12px 0 0;
  font-size: 14.5px;
  color: var(--muted);
  line-height: 1.65;
}

.auth-foot {
  padding: 0 20px 28px;
  text-align: center;
  font-size: 12.5px;
  color: #a8a196;
}

@media (max-width: 520px) {
  .auth-card {
    padding: 30px 22px 26px;
    border-radius: 14px;
  }
  .auth-title {
    font-size: 26px;
  }
}
</style>
