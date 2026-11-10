export interface ApiResp<T = unknown> {
  ok: boolean
  msg: string
  data?: T
}

export async function post<T = unknown>(url: string, body: unknown): Promise<ApiResp<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    return (await res.json()) as ApiResp<T>
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' }
  }
}

export interface User {
  id: number
  username: string
  email: string
  avatar: string | null
  role: string
  createdAt: string
}
