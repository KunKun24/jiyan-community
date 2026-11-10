type Handler = (d: any) => void

let socket: WebSocket | null = null
let retry = 0
let closed = false
const handlers = new Set<Handler>()

export function connectRealtime() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return
  closed = false
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  socket = new WebSocket(`${proto}://${location.host}/ws`)
  socket.onopen = () => { retry = 0 }
  socket.onmessage = (ev) => {
    let d: any
    try { d = JSON.parse(ev.data) } catch { return }
    handlers.forEach((fn) => {
      try { fn(d) } catch { /* ignore */ }
    })
  }
  socket.onclose = () => {
    if (closed) return
    retry++
    setTimeout(connectRealtime, Math.min(8000, 600 * retry))
  }
}

export function onRealtime(fn: Handler) {
  handlers.add(fn)
  return () => handlers.delete(fn)
}

export function closeRealtime() {
  closed = true
  socket?.close()
  socket = null
}
