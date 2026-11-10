import { one, q } from './db.js'

/**
 * 写一条站内通知。自己给自己的动作不记。
 * type: reply | mention | like | reply_like | admin
 */
export async function notify({ userId, actorId = null, type, postId = null, replyId = null, body = '' }) {
  if (!userId) return
  if (actorId && Number(userId) === Number(actorId)) return
  await q(
    'INSERT INTO notifications (user_id, actor_id, type, post_id, reply_id, body) VALUES (?,?,?,?,?,?)',
    [userId, actorId, type, postId, replyId, String(body || '').slice(0, 300)],
  )
}

const MENTION_RE = /@([\p{L}\p{N}_-]{2,32})/gu

/** 从纯文本里找 @用户名，给被提到的人发通知（不重复、不通知作者自己） */
export async function notifyMentions({ text, actorId, postId, replyId = null, body = '' }) {
  const names = new Set()
  for (const m of String(text || '').matchAll(MENTION_RE)) names.add(m[1])
  if (!names.size) return
  const list = [...names].slice(0, 10)
  const rows = await q(
    `SELECT id, username FROM users WHERE username IN (${list.map(() => '?').join(',')})`,
    list,
  )
  for (const u of rows) {
    await notify({ userId: u.id, actorId, type: 'mention', postId, replyId, body })
  }
}

export async function notifyReply({ postId, replyId, postOwnerId, parentUserId, actorId, actorName, text }) {
  const body = `${actorName}：${String(text || '').slice(0, 80)}`
  await notify({ userId: postOwnerId, actorId, type: 'reply', postId, replyId, body })
  if (parentUserId && Number(parentUserId) !== Number(postOwnerId)) {
    await notify({ userId: parentUserId, actorId, type: 'reply', postId, replyId, body })
  }
  await notifyMentions({ text, actorId, postId, replyId, body })
}

export { one }
