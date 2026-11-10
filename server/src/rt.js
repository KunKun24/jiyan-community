/** 实时连接：uid -> Set<ws> */
export const online = new Map()

export function onlineCount() {
  let n = 0
  for (const set of online.values()) n += set.size
  return n
}

export function onlineUsers() {
  return [...online.keys()]
}

export function addConn(uid, ws) {
  if (!online.has(uid)) online.set(uid, new Set())
  online.get(uid).add(ws)
}

export function removeConn(uid, ws) {
  const set = online.get(uid)
  if (!set) return
  set.delete(ws)
  if (!set.size) online.delete(uid)
}

export function pushTo(uid, payload) {
  const set = online.get(uid)
  if (!set) return
  const text = JSON.stringify(payload)
  for (const ws of set) {
    try { ws.send(text) } catch { /* 已断开 */ }
  }
}
