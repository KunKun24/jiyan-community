<template>
  <AuthLayout eyebrow="条款" title="用户协议" subtitle="最后更新：2026 年 11 月 11 日">
    <div class="doc">
      <p>欢迎来到极验社区。注册账号或使用本社区，即表示你同意以下约定。</p>
      <h3>一、账号</h3>
      <p>你需要提供真实可用的邮箱注册。请妥善保管密码，账号下的一切行为由你负责。不得将账号出借、出售或转让。</p>
      <h3>二、你发布的内容</h3>
      <p>你对自己发布的帖子、评论、图片和视频负责。发布即表示你授予本社区在本站范围内展示、存储和必要转码的权利，版权仍归你所有。</p>
      <h3>三、禁止行为</h3>
      <ul>
        <li>发布违法、暴力、色情、诈骗、侵权或侵犯他人隐私的内容；</li>
        <li>恶意刷屏、刷浏览量、刷赞、批量注册或干扰社区正常运行；</li>
        <li>冒充他人、伪造身份，或未经允许收集其他用户信息；</li>
        <li>发布广告、推广与社区无关的商业内容（除非事先获得许可）。</li>
      </ul>
      <h3>四、管理与处理</h3>
      <p>管理员可以对违规内容进行私密、删除，对违规账号进行警告、封禁。对处理结果有异议，可通过举报页的联系方式申诉。</p>
      <h3>五、终止</h3>
      <p>你可以随时停止使用本社区。我们保留在违规情形下暂停或终止账号的权利。</p>
      <p class="doc-foot">继续注册即视为你已阅读并同意本协议与《免责声明》。</p>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '../components/AuthLayout.vue'
</script>

<style scoped>
.doc { font-size: 14px; line-height: 1.85; color: #3a352d; }
.doc p { margin: 8px 0; }
.doc h3 { font-size: 14.5px; margin: 18px 0 6px; color: var(--ink); }
.doc ul { padding-left: 20px; margin: 6px 0; }
.doc li { margin: 4px 0; }
.doc-foot { margin-top: 20px; color: var(--muted); font-size: 12.5px; }
</style>
