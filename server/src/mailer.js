import nodemailer from 'nodemailer'

/**
 * 邮件发送：SMTP（SMTPS 465 / STARTTLS 587 / 明文 25）
 * 配置全部来自环境变量，源码里不落任何密钥。
 */
const cfg = () => ({
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT || 465),
  secure: (process.env.SMTP_SECURE || 'ssl').toLowerCase(), // ssl | tls | none
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || '',
  fromName: process.env.SMTP_FROM_NAME || '极验社区',
  timeout: Number(process.env.SMTP_TIMEOUT || 10000),
})

let transporter = null

function getTransport() {
  if (transporter) return transporter
  const c = cfg()
  if (!c.host || !c.user || !c.pass) return null

  const opts = {
    host: c.host,
    port: c.port,
    secure: c.secure === 'ssl',
    auth: { user: c.user, pass: c.pass },
    connectionTimeout: c.timeout,
    greetingTimeout: c.timeout,
    socketTimeout: c.timeout,
  }
  if (c.secure === 'tls') {
    opts.secure = false
    opts.requireTLS = true
  }
  transporter = nodemailer.createTransport(opts)
  return transporter
}

export function mailerConfigured() {
  const c = cfg()
  return Boolean(c.host && c.user && c.pass && c.from)
}

/**
 * @returns {Promise<[boolean, string]>}
 */
export async function sendMail({ to, subject, html, text = '' }) {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return [false, '收件地址无效']
  if (!mailerConfigured()) return [false, '邮件服务未配置']

  const tx = getTransport()
  const c = cfg()
  try {
    const info = await tx.sendMail({
      from: `"${c.fromName}" <${c.from}>`,
      to,
      subject,
      html,
      text,
    })
    return [true, info.messageId || 'ok']
  } catch (err) {
    return [false, err?.message || String(err)]
  }
}
