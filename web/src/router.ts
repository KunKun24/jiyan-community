import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import { loadMe, store } from './store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: () => import('./views/Login.vue') },
    { path: '/register', name: 'register', component: () => import('./views/Register.vue') },
    { path: '/reset', name: 'reset', component: () => import('./views/Reset.vue') },
    { path: '/terms', name: 'terms', component: () => import('./views/Terms.vue') },
    { path: '/disclaimer', name: 'disclaimer', component: () => import('./views/Disclaimer.vue') },
    {
      path: '/',
      component: () => import('./components/ForumLayout.vue'),
      children: [
        { path: 'forum', name: 'forum', component: () => import('./views/Forum.vue') },
        { path: 'categories', name: 'categories', component: () => import('./views/Categories.vue') },
        { path: 'c/:slug', name: 'category', component: () => import('./views/CategoryDetail.vue') },
        { path: 'hot', name: 'hot', component: () => import('./views/Hot.vue') },
        { path: 'notices', name: 'notices', component: () => import('./views/Notices.vue') },
        { path: 'post/:id', name: 'post', component: () => import('./views/Post.vue') },
        { path: 'post/:id/edit', name: 'edit-post', component: () => import('./views/EditPost.vue') },
        { path: 'u/:id', name: 'user-home', component: () => import('./views/UserHome.vue') },
        { path: 'search', name: 'search', component: () => import('./views/Search.vue') },
        { path: 'notifications', name: 'notifications', component: () => import('./views/Notifications.vue') },
        { path: 'messages', name: 'messages', component: () => import('./views/Messages.vue') },
        { path: 'new', name: 'new-post', component: () => import('./views/NewPost.vue') },
        { path: 'me', name: 'me', component: () => import('./views/Profile.vue') },
        { path: 'settings', name: 'settings', component: () => import('./views/Settings.vue') },
      ],
    },
    {
      path: '/admin',
      component: () => import('./components/AdminLayout.vue'),
      meta: { admin: true },
      children: [
        { path: '', name: 'admin-home', component: () => import('./views/admin/AdminHome.vue') },
        { path: 'posts', name: 'admin-posts', component: () => import('./views/admin/AdminPosts.vue') },
        { path: 'reports', name: 'admin-reports', component: () => import('./views/admin/AdminReports.vue') },
        { path: 'users', name: 'admin-users', component: () => import('./views/admin/AdminUsers.vue') },
        { path: 'banners', name: 'admin-banners', component: () => import('./views/admin/AdminBanners.vue') },
        { path: 'notices', name: 'admin-notices', component: () => import('./views/admin/AdminNotices.vue') },
        { path: 'categories', name: 'admin-categories', component: () => import('./views/admin/AdminCategories.vue') },
        { path: 'words', name: 'admin-words', component: () => import('./views/admin/AdminWords.vue') },
      ],
    },
  ],
  scrollBehavior(to, _from, saved) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    if (saved) return saved
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  if (!store.loaded) await loadMe()
  if (!to.meta.admin) return true
  if (!store.user) return { path: '/login', query: { redirect: to.fullPath } }
  if (store.user.role !== 'admin') return '/forum'
  return true
})

export default router
