/**
 * 邮件模板：米白风格，内联样式 + 表格布局，兼容 QQ / 163 / Outlook / Gmail。
 * 设计 token 与官网一致：底 #F7F5F1 卡片 #FFF 边框 #E7E2D9 主文 #16150F 强调 #3E5C4B
 */

const SITE = () => process.env.SITE_NAME || '极验社区'
const BASE = () => (process.env.SITE_BASE_URL || 'http://shequ.xn--0try77c6um82w.cn').replace(/\/$/, '')

const PURPOSE = {
  register: { subject: '注册验证码', action: '注册', desc: '注册账号' },
  reset: { subject: '密码重置验证码', action: '密码重置', desc: '重置密码' },
  bind: { subject: '邮箱绑定验证码', action: '邮箱绑定', desc: '绑定邮箱' },
}

function shell(inner, { preview = '' } = {}) {
  return `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${SITE()}</title>
</head>
<body style="margin:0;padding:0;background:#F7F5F1;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F5F1;padding:36px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;">

      <tr><td style="padding:0 4px 18px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;padding-right:9px;">
            <img src="${BASE()}/logo.png" width="24" height="24" alt="" style="display:block;border-radius:6px;">
          </td>
          <td style="vertical-align:middle;font-size:15px;font-weight:700;color:#16150F;letter-spacing:.01em;">${SITE()}</td>
        </tr></table>
      </td></tr>

      <tr><td style="background:#FFFFFF;border:1px solid #E7E2D9;border-radius:14px;padding:38px 32px 34px;">
        ${inner}
      </td></tr>

      <tr><td style="padding:20px 6px 0;font-size:12px;line-height:1.85;color:#9A9284;">
        本邮件由系统自动发送，请勿直接回复<br>
        © ${new Date().getFullYear()} ${SITE()} · 保留所有权利
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`
}

/** 验证码邮件 */
export function codeMail({ code, minutes = 5, purpose = 'register' }) {
  const p = PURPOSE[purpose] || PURPOSE.register
  const inner = `
    <div style="font-size:13px;color:#7C7469;letter-spacing:.02em;margin-bottom:10px;">${p.action}</div>
    <div style="font-size:25px;font-weight:700;color:#16150F;letter-spacing:-.01em;margin-bottom:14px;">${p.subject}</div>
    <div style="font-size:14px;line-height:1.75;color:#5C554A;">
      你正在 ${SITE()} ${p.desc}，请在页面中输入下方的验证码完成验证。
    </div>
    <div style="margin:24px 0;background:#F7F5F1;border:1px solid #EFEAE1;border-radius:12px;padding:20px 12px;text-align:center;">
      <span style="font-family:'SF Mono',Consolas,Menlo,'Courier New',monospace;font-size:30px;font-weight:700;letter-spacing:7px;color:#3E5C4B;">${code}</span>
    </div>
    <div style="font-size:12px;color:#9A9284;">验证码 ${minutes} 分钟内有效，请勿告知他人。</div>
    <div style="margin-top:22px;padding-top:20px;border-top:1px solid #EFEAE1;font-size:13px;line-height:1.75;color:#5C554A;">
      如非本人操作，请忽略本邮件，你的账号不会产生任何变更。
    </div>`
  return {
    subject: `${SITE()} · ${p.subject}`,
    html: shell(inner, { preview: `你的${p.subject}是 ${code}，${minutes} 分钟内有效。` }),
    text: `你的${p.subject}是 ${code}，${minutes} 分钟内有效。如非本人操作请忽略本邮件。`,
  }
}

/** 密码重置通知邮件 */
export function resetMail({ username, password }) {
  const inner = `
    <div style="font-size:13px;color:#7C7469;letter-spacing:.02em;margin-bottom:10px;">账号安全</div>
    <div style="font-size:25px;font-weight:700;color:#16150F;letter-spacing:-.01em;margin-bottom:14px;">密码已重置</div>
    <div style="font-size:14px;line-height:1.75;color:#5C554A;">
      你好，${username}。${SITE()} 的账号密码已被重置，请使用下方密码登录。
    </div>
    <div style="margin:24px 0;background:#F7F5F1;border:1px solid #EFEAE1;border-radius:12px;padding:20px 12px;text-align:center;">
      <span style="font-family:'SF Mono',Consolas,Menlo,'Courier New',monospace;font-size:26px;font-weight:700;letter-spacing:3px;color:#3E5C4B;">${password}</span>
    </div>
    <div style="font-size:13px;line-height:1.75;color:#5C554A;padding:12px 14px;background:#F1F6F2;border-radius:10px;border:1px solid #DCE7DF;">
      为账号安全，登录后请及时修改密码。
    </div>
    <div style="margin-top:22px;padding-top:20px;border-top:1px solid #EFEAE1;font-size:13px;line-height:1.75;color:#5C554A;">
      如非本人操作，请立即通过「找回密码」重新重置，或联系管理员。
    </div>`
  return {
    subject: `${SITE()} · 密码已重置`,
    html: shell(inner, { preview: `你的账号密码已重置为 ${password}，登录后请及时修改密码。` }),
    text: `你好，${username}。你的账号密码已重置为 ${password}，登录后请及时修改密码。`,
  }
}
