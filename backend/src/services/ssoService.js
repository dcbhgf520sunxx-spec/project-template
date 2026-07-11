const crypto = require('crypto')

function requireSsoConfig(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`未配置 ${name}`)
  return value
}

/**
 * RSA/ECB/PKCS1Padding 加密
 * 使用 Node.js 原生 crypto 模块，完全兼容 Java 的 RSA/ECB/PKCS1Padding
 * @param {string} plaintext - 明文字符串
 * @returns {string} Base64 编码的密文
 */
function rsaEncrypt(plaintext, publicKeyPem) {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    Buffer.from(plaintext, 'utf8')
  )
  return encrypted.toString('base64')
}

/**
 * 申请 SSO ticket
 * @param {string} employeeNo - 工号
 * @returns {Promise<string>} ticket
 */
async function requestTicket(employeeNo) {
  const platformUrl = requireSsoConfig('SSO_PLATFORM_URL')
  const clientId = requireSsoConfig('SSO_CLIENT_ID')
  const publicKeyPem = requireSsoConfig('SSO_PUBLIC_KEY_PEM').replace(/\\n/g, '\n')
  const payload = JSON.stringify({
    username: employeeNo,
    timestamp: Date.now()
  })

  const encryptedData = rsaEncrypt(payload, publicKeyPem)

  const res = await fetch(`${platformUrl}/api/auth/sso/ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      encryptedData
    })
  })

  const body = await res.json()

  if (!res.ok || (body.code !== 0 && body.success !== true)) {
    throw new Error(body.message || `获取 ticket 失败: ${res.status}`)
  }
  return typeof body.data === 'string' ? body.data : (body.data?.ticket || body.ticket)
}

module.exports = { requestTicket }
