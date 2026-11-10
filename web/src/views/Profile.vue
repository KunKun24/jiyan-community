<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '../api'
import { initial } from '../format'

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
}

const router = useRouter()
const profile = ref<Profile | null>(null)
const stats = ref({ posts: 0, replies: 0 })
const loading = ref(true)

onMounted(async () => {
  const r = await get<{ user: Profile; stats: { posts: number; replies: number } }>('/api/user/profile')
  if (!r.ok) {
    if (r.msg.includes('登录')) router.push('/login')
    loading.value = false
    return
  }
  profile.value = r.data?.user ?? null
  stats.value = r.data?.stats ?? { posts: 0, replies: 0 }
  loading.value = false
})
</script>

<template>
  <div v-if="loading" class="state">加载中…</div>

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

@media (max-width: 700px) {
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
</style>
