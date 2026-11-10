import { reactive } from 'vue'
import { get, post, type User } from './api'

export const store = reactive<{ user: User | null; loaded: boolean }>({
  user: null,
  loaded: false,
})

export async function loadMe() {
  const r = await get<{ user: User }>('/api/auth/me')
  store.user = r.ok ? (r.data?.user ?? null) : null
  store.loaded = true
}

export async function logout() {
  await post('/api/auth/logout', {})
  store.user = null
}
