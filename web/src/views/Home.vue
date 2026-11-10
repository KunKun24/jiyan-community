<script setup lang="ts">
import { onMounted } from 'vue'

interface Feature {
  title: string
  desc: string
  path: string
}

interface Contact {
  title: string
  desc: string
  href: string
  label: string
  path: string
  brand?: 'github' | 'telegram'
}

interface Faq {
  q: string
  a: string
}

const links = {
  github: 'https://github.com/KunKun24/jiyan-community',
  // TODO: 换成真实的 Telegram 频道 / 群链接
  telegramChannel: 'https://t.me/',
  telegramGroup: 'https://t.me/',
}

const brandPaths = {
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  telegram:
    'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
}

const stats = [
  { n: '1', label: '个社区' },
  { n: '0', label: '条广告' },
  { n: '100%', label: '开源' },
]

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

const contacts: Contact[] = [
  {
    title: 'GitHub 仓库',
    desc: '源码、提交记录与版本更新。觉得有用，就点个 Star。',
    href: links.github,
    label: '查看仓库 →',
    path: brandPaths.github,
    brand: 'github',
  },
  {
    title: 'Telegram 频道',
    desc: '公告、更新和发布通知。',
    href: links.telegramChannel,
    label: '关注频道 →',
    path: brandPaths.telegram,
    brand: 'telegram',
  },
  {
    title: 'Telegram 群',
    desc: '和其他人即时聊天。',
    href: links.telegramGroup,
    label: '加入群组 →',
    path: brandPaths.telegram,
    brand: 'telegram',
  },
  {
    title: '问题反馈',
    desc: '发现 bug 或想提建议，开一个 issue。',
    href: links.github + '/issues',
    label: '提交 issue →',
    path: 'M12 3l9 16H3zM12 9v5M12 17h.01',
  },
]

const faqs: Faq[] = [
  {
    q: '极验社区是什么？',
    a: '一个自建的、专注讨论的社区。没有推荐算法，没有无限滚动，只有板块、帖子和回复。',
  },
  {
    q: '为什么要自己写一个？',
    a: '现成的论坛系统要么太重，要么界面改不动。我们想要一个干净、轻、完全能自己掌控的实现。',
  },
  {
    q: '会一直开源吗？',
    a: '会。源码放在 GitHub，MIT 协议，任何人都可以自己部署一份。',
  },
  {
    q: '现在能注册吗？',
    a: '还在搭建中。注册和发帖会陆续开放，可以先去 GitHub 或 Telegram 关注进度。',
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
          <img class="brand-logo" src="/logo.png" alt="极验社区" />
          <span>极验社区</span>
        </a>
        <nav class="nav-links">
          <a href="#features">功能</a>
          <a href="#about">关于</a>
          <a href="#contact">联系</a>
          <a href="#faq">常见问题</a>
        </nav>
        <div class="nav-actions">
          <RouterLink class="link" to="/login">登录</RouterLink>
          <RouterLink class="btn btn-dark btn-sm" to="/register">注册</RouterLink>
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
          <RouterLink class="btn btn-dark btn-lg" to="/register">立即注册</RouterLink>
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
              <img class="mock-logo" src="/logo.png" alt="" />
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

      <section class="stats">
        <div class="stats-inner">
          <div v-for="s in stats" :key="s.label" class="stat reveal">
            <b>{{ s.n }}</b>
            <span>{{ s.label }}</span>
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
        <RouterLink class="btn btn-light btn-lg reveal" to="/register">进入社区</RouterLink>
      </section>

      <section id="contact" class="contact">
        <div class="section-head reveal">
          <p class="eyebrow">保持联系</p>
          <h2>社区之外，<br />也能找到我们。</h2>
        </div>
        <div class="contact-grid">
          <a
            v-for="c in contacts"
            :key="c.title"
            class="contact-card reveal"
            :href="c.href"
            target="_blank"
            rel="noopener"
          >
            <div class="contact-icon" :class="c.brand">
              <svg
                v-if="c.brand"
                class="brand-ico"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path :d="c.path" />
              </svg>
              <svg
                v-else
                class="ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path :d="c.path" />
              </svg>
            </div>
            <h3>{{ c.title }}</h3>
            <p>{{ c.desc }}</p>
            <span class="go">{{ c.label }}</span>
          </a>
        </div>
      </section>

      <section id="faq" class="faq">
        <div class="section-head reveal">
          <p class="eyebrow">常见问题</p>
          <h2>你可能想问。</h2>
        </div>
        <div class="faq-list reveal">
          <details v-for="f in faqs" :key="f.q" class="faq-item">
            <summary>{{ f.q }}</summary>
            <p>{{ f.a }}</p>
          </details>
        </div>
      </section>

      <section id="join" class="cta">
        <h2 class="reveal">现在，开始说话。</h2>
        <p class="reveal">注册只需要一个邮箱。没有问卷，没有等待。</p>
        <a class="btn btn-dark btn-lg reveal" href="#">创建账号</a>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand-col">
          <div class="brand">
            <img class="brand-logo" src="/logo.png" alt="极验社区" />
            <span>极验社区</span>
          </div>
          <p>一个干净、专注内容的开源社区。</p>
        </div>
        <div class="footer-col">
          <h4>社区</h4>
          <a href="#features">功能</a>
          <a href="#faq">常见问题</a>
          <RouterLink to="/register">加入</RouterLink>
        </div>
        <div class="footer-col">
          <h4>联系</h4>
          <a :href="links.github" target="_blank" rel="noopener">GitHub</a>
          <a :href="links.telegramChannel" target="_blank" rel="noopener">Telegram 频道</a>
          <a :href="links.telegramGroup" target="_blank" rel="noopener">Telegram 群</a>
        </div>
        <div class="footer-col">
          <h4>其他</h4>
          <a :href="links.github + '/blob/main/LICENSE'" target="_blank" rel="noopener">MIT 协议</a>
          <a :href="links.github" target="_blank" rel="noopener">源码</a>
        </div>
      </div>
      <div class="footer-bottom">© 2026 极验社区 · 保留所有权利</div>
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
.brand-logo {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  flex: none;
}
.nav-links {
  display: flex;
  gap: 26px;
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
  padding: 0 24px 110px;
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
  flex: none;
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

/* ---------- 数字 ---------- */
.stats {
  border-top: 1px solid rgba(22, 21, 15, 0.08);
  border-bottom: 1px solid rgba(22, 21, 15, 0.08);
}
.stats-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 44px 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.stat {
  text-align: center;
}
.stat b {
  display: block;
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.stat span {
  font-size: 13px;
  color: var(--muted);
}

/* ---------- 特性 ---------- */
.features {
  max-width: 1080px;
  margin: 0 auto;
  padding: 130px 24px;
}
.section-head {
  text-align: center;
  margin-bottom: 64px;
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
.feature-icon,
.contact-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: #f1f6f2;
  color: var(--accent);
  display: grid;
  place-items: center;
  margin-bottom: 20px;
}
.contact-icon.github {
  background: #f2f0eb;
  color: #16150f;
}
.contact-icon.telegram {
  background: #e8f4fb;
  color: #229ed9;
}
.brand-ico {
  width: 20px;
  height: 20px;
}
.ico {
  width: 19px;
  height: 19px;
}
.feature h2,
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

/* ---------- 联系 ---------- */
.contact {
  max-width: 1080px;
  margin: 0 auto;
  padding: 130px 24px;
}
.contact-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.contact-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 24px 22px;
  transition: transform 0.22s, border-color 0.22s, box-shadow 0.22s;
}
.contact-card:hover {
  transform: translateY(-2px);
  border-color: #d9d2c6;
  box-shadow: 0 18px 40px -22px rgba(22, 21, 15, 0.2);
}
.contact-card h3 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
}
.contact-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted);
}
.contact-card .go {
  margin-top: 16px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent);
}

/* ---------- FAQ ---------- */
.faq {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 24px 130px;
}
.faq-list {
  border-top: 1px solid var(--line);
}
.faq-item {
  border-bottom: 1px solid var(--line);
  padding: 22px 2px;
}
.faq-item summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  font-size: 17px;
  font-weight: 550;
  letter-spacing: -0.01em;
}
.faq-item summary::-webkit-details-marker {
  display: none;
}
.faq-item summary::after {
  content: '+';
  color: var(--muted);
  font-size: 22px;
  font-weight: 300;
  line-height: 1;
  transition: transform 0.2s;
}
.faq-item[open] summary::after {
  content: '−';
}
.faq-item p {
  max-width: 720px;
  margin: 14px 0 0;
  font-size: 14.5px;
  line-height: 1.75;
  color: var(--muted);
}

/* ---------- 结尾 CTA ---------- */
.cta {
  padding: 130px 24px 150px;
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
  padding: 64px 24px 32px;
}
.footer-inner {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
}
.footer-brand-col .brand {
  font-size: 14px;
  margin-bottom: 12px;
}
.footer-brand-col p {
  margin: 0;
  max-width: 260px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
}
.footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer-col h4 {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a29c92;
}
.footer-col a {
  font-size: 13.5px;
  color: var(--muted);
  transition: color 0.2s;
}
.footer-col a:hover {
  color: var(--ink);
}
.footer-bottom {
  max-width: 1080px;
  margin: 44px auto 0;
  padding-top: 22px;
  border-top: 1px solid rgba(22, 21, 15, 0.06);
  font-size: 12px;
  color: #a29c92;
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
  .feature-grid,
  .contact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .nav-links {
    display: none;
  }
  .footer-inner {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .hero {
    padding-top: 96px;
  }
  .feature-grid,
  .contact-grid {
    grid-template-columns: 1fr;
  }
  .stats-inner {
    padding: 34px 24px;
  }
  .nav-actions .link {
    display: none;
  }
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>
