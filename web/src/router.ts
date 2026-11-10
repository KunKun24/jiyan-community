import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: () => import('./views/Login.vue') },
    { path: '/register', name: 'register', component: () => import('./views/Register.vue') },
    { path: '/reset', name: 'reset', component: () => import('./views/Reset.vue') },
    { path: '/forum', name: 'forum', component: () => import('./views/Forum.vue') },
    { path: '/post/:id', name: 'post', component: () => import('./views/Post.vue') },
    { path: '/new', name: 'new-post', component: () => import('./views/NewPost.vue') },
  ],
  scrollBehavior(to, _from, saved) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    if (saved) return saved
    return { top: 0 }
  },
})
