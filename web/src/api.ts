export interface ApiResp<T = unknown> {
  ok: boolean
  msg: string
  data?: T
}

export interface User {
  id: number
  username: string
  email: string
  avatar: string | null
  role: string
  createdAt: string
}

async function request<T>(url: string, init?: RequestInit): Promise<ApiResp<T>> {
  try {
    const res = await fetch(url, { credentials: 'include', ...init })
    return (await res.json()) as ApiResp<T>
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' }
  }
}

export const get = <T>(url: string) => request<T>(url)

export const post = <T>(url: string, body: unknown) =>
  request<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
