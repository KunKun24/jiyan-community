import 'dotenv/config'
import { sendMail, mailerConfigured } from '../src/mailer.js'
import { codeMail } from '../src/mail-template.js'
import { genCode } from '../src/code.js'

const to = process.argv[2] || process.env.TEST_EMAIL || ''
const code = genCode()

console.log('收件人:', to)
console.log('验证码:', code, '(8 位)')
console.log('SMTP 已配置:', mailerConfigured())

const mail = codeMail({ code, minutes: 5, purpose: 'register' })
const t0 = Date.now()
const [ok, msg] = await sendMail({ to, ...mail })
console.log(ok ? `✅ 发送成功 ${Date.now() - t0}ms` : `❌ 发送失败: ${msg}`)
if (ok) console.log('messageId:', msg)
process.exit(ok ? 0 : 1)
