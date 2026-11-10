export function timeAgo(input: string | null | undefined): string {
  if (!input) return ''
  const t = new Date(String(input).replace(' ', 'T')).getTime()
  if (Number.isNaN(t)) return String(input).slice(0, 10)
  const diff = Date.now() - t
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return String(input).slice(0, 10)
}

export function initial(name: string | null | undefined): string {
  return (name || '?').trim().slice(0, 1).toUpperCase()
}
