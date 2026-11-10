<script setup lang="ts">
import { onMounted } from 'vue'

interface Feature {
  title: string
  desc: string
  path: string
}

const features: Feature[] = [
  {
    title: '干净的界面',
    desc: '没有多余的边框、弹窗和装饰。内容就是内容，一眼能读完。',
    path: 'M4 5h16v14H4zM4 9.5h16',
  },
  {
    title: '打开就是快',
    desc: '首屏直出，列表秒开。不为了一点装饰，拖慢整页加载。',
    path: 'M13 2 4 14h7l-1 8 9-12h-7z',
  },
  {
    title: '专注讨论',
    desc: '板块、帖子、回复。没有算法推荐，也没有无限下拉。',
    path: 'M4 5h16v11H9l-5 4z',
  },
  {
    title: '数据在你自己手里',
    desc: '自己的服务器，自己的数据库与备份。想改什么，就改什么。',
    path: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  },
]

onMounted(() => {
  const els = document.querySelectorAll<HTMLElement>('.reveal')
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'))
    return
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  )
  els.forEach((el) => io.observe(el))
})
</script>

<template>
  <div class="page">
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" href="/">
          <span class="brand-mark">极</span>
          <span>极验社区</span>
        </a>
        <nav class="nav-links">
          <a href="#features">功能</a>
          <a href="#about">关于</a>
          <a href="#join">加入</a>
        </nav>
        <div class="nav-actions">
          <a class="link" href="#join">登录</a>
          <a class="btn btn-dark btn-sm" href="#join">进入社区</a>
        </div>
      </div>
    </header>

    <main>
      <section class="hero">
        <p class="eyebrow reveal">极验社区</p>
        <h1 class="reveal">让讨论<br />回到简单。</h1>
        <p class="lede reveal">
          没有弹窗，没有推荐算法，没有为了留住你而设计的东西。
          只有板块、帖子、回复，和一群认真说话的人。
        </p>
        <div class="hero-actions reveal">
          <a class="btn btn-dark btn-lg" href="#join">进入社区</a>
          <a class="btn btn-ghost btn-lg" href="#features">了解更多</a>
        </div>
      </section>

      <section class="showcase reveal">
        <div class="browser">
          <div class="browser-bar">
            <i></i><i></i><i></i>
            <span class="browser-url">shequ.和泉纱雾.cn</span>
          </div>
          <div class="browser-body">
            <div class="mock-head">
              <span class="mock-logo">极</span>
              <span class="mock-name">极验社区</span>
              <span class="mock-search">搜索讨论…</span>
            </div>
            <div class="mock-rows">
              <div class="mock-row">
                <span class="mock-dot"></span>
                <span class="mock-text">
                  <span class="mock-line t1"></span>
                  <span class="mock-line t2"></span>
                </span>
                <span class="mock-tag">12 回复</span>
              </div>
              <div class="mock-row">
                <span class="mock-dot"></span>
                <span class="mock-text">
                  <span class="mock-line t1" style="width: 52%"></span>
                  <span class="mock-line t2" style="width: 34%"></span>
                </span>
                <span class="mock-tag">7 回复</span>
              </div>
              <div class="mock-row">
                <span class="mock-dot"></span>
                <span class="mock-text">
                  <span class="mock-line t1" style="width: 68%"></span>
                  <span class="mock-line t2" style="width: 44%"></span>
                </span>
                <span class="mock-tag">21 回复</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="section-head reveal">
          <p class="eyebrow">为什么是这里</p>
          <h2>少一点噪音，<br />多一点交流。</h2>
        </div>
        <div class="feature-grid">
          <article v-for="f in features" :key="f.title" class="feature reveal">
            <div class="feature-icon">
              <svg
                class="ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path :d="f.path" />
              </svg>
            </div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </article>
        </div>
      </section>

      <section id="about" class="dark">
        <h2 class="reveal">把注意力，<br />还给内容本身。</h2>
        <p class="reveal">
          没有信息流推荐，没有无限滚动。你看到的是你选择的板块，
          和你愿意花时间读完的帖子。
        </p>
        <a class="btn btn-light btn-lg reveal" href="#join">进入社区</a>
      </section>

      <section id="join" class="cta">
        <h2 class="reveal">现在，开始说话。</h2>
        <p class="reveal">注册只需要一个邮箱。没有问卷，没有等待。</p>
        <a class="btn btn-dark btn-lg reveal" href="#">创建账号</a>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <span class="footer-brand">极验社区</span>
        <span>© 2026 极验社区 · 保留所有权利</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.page {
  overflow-x: hidden;
}

/* ---------- 导航 ---------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(247, 245, 241, 0.78);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(22, 21, 15, 0.07);
}
.nav-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 40px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.01em;
}
.brand-mark {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--ink);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}
.nav-links {
  display: flex;
  gap: 28px;
  font-size: 14px;
  color: var(--muted);
}
.nav-links a {
  transition: color 0.2s;
}
.nav-links a:hover {
  color: var(--ink);
}
.nav-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 20px;
}
.link {
  font-size: 14px;
  color: var(--muted);
  transition: color 0.2s;
}
.link:hover {
  color: var(--ink);
}

/* ---------- 按钮 ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 14.5px;
  font-weight: 500;
  white-space: nowrap;
  transition: transform 0.2s, background 0.2s, border-color 0.2s;
}
.btn:hover {
  transform: translateY(-1px);
}
.btn-dark {
  background: var(--ink);
  color: #fff;
}
.btn-dark:hover {
  background: #2a2820;
}
.btn-ghost {
  border: 1px solid rgba(22, 21, 15, 0.18);
  color: var(--ink);
}
.btn-ghost:hover {
  background: rgba(22, 21, 15, 0.04);
}
.btn-light {
  background: #fff;
  color: var(--ink);
}
.btn-lg {
  height: 50px;
  padding: 0 28px;
  font-size: 15.5px;
}
.btn-sm {
  height: 34px;
  padding: 0 16px;
  font-size: 13.5px;
}

/* ---------- Hero ---------- */
.hero {
  max-width: 980px;
  margin: 0 auto;
  padding: 128px 24px 72px;
  text-align: center;
}
.eyebrow {
  margin: 0 0 18px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}
.hero h1 {
  margin: 0;
  font-size: clamp(48px, 8vw, 92px);
  line-height: 1.04;
  font-weight: 600;
  letter-spacing: -0.035em;
  color: var(--ink);
}
.lede {
  max-width: 600px;
  margin: 26px auto 0;
  font-size: clamp(16.5px, 1.7vw, 20px);
  line-height: 1.6;
  color: var(--muted);
}
.hero-actions {
  margin-top: 38px;
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

/* ---------- 产品预览 ---------- */
.showcase {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px 140px;
}
.browser {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 40px 90px -30px rgba(22, 21, 15, 0.22),
    0 2px 8px rgba(22, 21, 15, 0.05);
}
.browser-bar {
  height: 38px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 16px;
  background: #fbf9f6;
  border-bottom: 1px solid var(--line);
}
.browser-bar i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e2ddd4;
}
.browser-url {
  margin-left: 12px;
  font-size: 12px;
  color: #a29c92;
}
.browser-body {
  padding: 22px 24px 26px;
}
.mock-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.mock-logo {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--ink);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
}
.mock-name {
  font-size: 13.5px;
  font-weight: 600;
}
.mock-search {
  margin-left: auto;
  height: 28px;
  padding: 0 14px;
  border-radius: 999px;
  background: #f3f0eb;
  color: #a29c92;
  font-size: 12px;
  display: flex;
  align-items: center;
}
.mock-rows {
  padding-top: 4px;
}
.mock-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 2px;
  border-bottom: 1px solid #f0ece5;
}
.mock-row:last-child {
  border-bottom: 0;
}
.mock-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e8e2d8;
  flex: none;
}
.mock-text {
  min-width: 0;
  flex: 1;
}
.mock-line {
  display: block;
  height: 8px;
  border-radius: 4px;
  background: #ebe6de;
}
.mock-line.t1 {
  width: 62%;
}
.mock-line.t2 {
  width: 40%;
  height: 7px;
  margin-top: 9px;
  background: #f2eee8;
}
.mock-tag {
  flex: none;
  font-size: 11.5px;
  color: #a29c92;
  background: #f5f2ed;
  padding: 2px 9px;
  border-radius: 6px;
}

/* ---------- 特性 ---------- */
.features {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px 140px;
}
.section-head {
  text-align: center;
  margin-bottom: 72px;
}
.section-head h2 {
  margin: 0;
  font-size: clamp(34px, 5vw, 62px);
  line-height: 1.08;
  letter-spacing: -0.03em;
  font-weight: 600;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.feature {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 26px 22px 28px;
}
.feature-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: #f1f6f2;
  color: var(--accent);
  display: grid;
  place-items: center;
  margin-bottom: 20px;
}
.ico {
  width: 19px;
  height: 19px;
}
.feature h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.feature p {
  margin: 0;
  font-size: 13.8px;
  line-height: 1.65;
  color: var(--muted);
}

/* ---------- 深色区 ---------- */
.dark {
  background: var(--ink);
  color: #fff;
  padding: 150px 24px;
  text-align: center;
}
.dark h2 {
  max-width: 820px;
  margin: 0 auto 22px;
  font-size: clamp(32px, 5vw, 64px);
  line-height: 1.07;
  letter-spacing: -0.03em;
  font-weight: 600;
}
.dark p {
  max-width: 560px;
  margin: 0 auto 36px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 16.5px;
  line-height: 1.65;
}

/* ---------- 结尾 CTA ---------- */
.cta {
  padding: 150px 24px;
  text-align: center;
}
.cta h2 {
  margin: 0 0 16px;
  font-size: clamp(34px, 5vw, 60px);
  letter-spacing: -0.03em;
  font-weight: 600;
}
.cta p {
  margin: 0 0 32px;
  color: var(--muted);
  font-size: 16.5px;
}

/* ---------- 页脚 ---------- */
.footer {
  border-top: 1px solid rgba(22, 21, 15, 0.08);
  padding: 44px 24px 52px;
}
.footer-inner {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 12.5px;
  color: #9a958c;
}
.footer-brand {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
}

/* ---------- 滚动淡入 ---------- */
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.9s cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 0.9s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

@media (max-width: 900px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .nav-links {
    display: none;
  }
}

@media (max-width: 600px) {
  .hero {
    padding-top: 96px;
  }
  .feature-grid {
    grid-template-columns: 1fr;
  }
  .nav-actions .link {
    display: none;
  }
  .footer-inner {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
