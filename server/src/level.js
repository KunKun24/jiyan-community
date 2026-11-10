/**
 * 等级体系
 * 成长值 = 贡献值 + 注册天数(封顶 365) + 签到次数×3 + 收到点赞×2 + 分享×2
 */
export const LEVELS = [
  { name: '路过', min: 0 },
  { name: '新面孔', min: 50 },
  { name: '熟人', min: 150 },
  { name: '常客', min: 400 },
  { name: '老邻居', min: 900 },
  { name: '常驻', min: 1800 },
  { name: '支柱', min: 3500 },
  { name: '元老', min: 7000 },
]

export function growthOf(u) {
  const created = u?.created_at ? new Date(u.created_at).getTime() : Date.now()
  const days = Math.max(0, Math.floor((Date.now() - created) / 86400000))
  return (
    Number(u?.points || 0) +
    Math.min(days, 365) +
    Number(u?.checkin_count || 0) * 3 +
    Number(u?.likes_received || 0) * 2 +
    Number(u?.share_count || 0) * 2
  )
}

export function levelOf(growth) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (growth >= LEVELS[i].min) idx = i
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1] || null
  const span = next ? next.min - cur.min : 0
  const progress = next ? Math.min(100, Math.max(0, Math.round(((growth - cur.min) / span) * 100))) : 100
  return {
    level: idx + 1,
    name: cur.name,
    growth,
    nextName: next?.name ?? null,
    nextAt: next?.min ?? null,
    progress,
  }
}
