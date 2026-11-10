<template>
  <AuthLayout eyebrow="条款" title="免责声明" subtitle="最后更新：2026 年 11 月 11 日">
    <div class="doc">
      <h3>一、内容观点</h3>
      <p>社区内的帖子与评论由用户发布，仅代表发布者个人观点，不代表本站立场。本站不对内容的准确性、完整性作保证。</p>
      <h3>二、第三方链接</h3>
      <p>帖子里可能包含外部链接（网盘、代码仓库、视频站等）。点击后离开本站，外部网站的内容与安全性由该网站负责，本站不承担连带责任。</p>
      <h3>三、服务可用性</h3>
      <p>本站按“现状”提供服务，可能因维护、升级、网络或不可抗力中断。我们会尽力提前公告，但不对中断造成的损失承担责任。</p>
      <h3>四、用户行为</h3>
      <p>用户因违反法律法规或本协议造成的后果，由用户自行承担。因用户发布内容引发的第三方纠纷，本站有权配合处理并保留追责权利。</p>
      <h3>五、举报与删除</h3>
      <p>若你认为某内容侵犯了你的合法权益，可通过帖子或评论上的「举报」提交原因与联系方式，我们会在核实后处理。</p>
      <p class="doc-foot">本声明与《用户协议》共同构成你与本站之间的约定。</p>
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
.doc-foot { margin-top: 20px; color: var(--muted); font-size: 12.5px; }
</style>
