import { randomInt } from 'node:crypto'

/**
 * 验证码字符集：大小写字母 + 数字。
 * 去掉了 0/O、1/l/I 这类易混淆字符，避免用户抄错。
 */
const CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const CODE_LENGTH = 8

export function genCode(len = CODE_LENGTH) {
  let out = ''
  for (let i = 0; i < len; i += 1) {
    out += CHARS[randomInt(0, CHARS.length)]
  }
  return out
}
