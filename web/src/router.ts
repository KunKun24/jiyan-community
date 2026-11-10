import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: () => import('./views/Login.vue') },
    { path: '/register', name: 'register', component: () => import('./views/Register.vue') },
    { path: '/reset', name: 'reset', component: () => import('./views/Reset.vue') },
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
        { path: 'new', name: 'new-post', component: () => import('./views/NewPost.vue') },
        { path: 'me', name: 'me', component: () => import('./views/Profile.vue') },
        { path: 'settings', name: 'settings', component: () => import('./views/Settings.vue') },
      ],
    },
  ],
  scrollBehavior(to, _from, saved) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    if (saved) return saved
    return { top: 0 }
  },
})
