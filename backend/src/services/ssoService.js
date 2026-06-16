const crypto = require('crypto')

// RSA 公钥（来自 AI 问数平台）
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6LZ3VRVXXGvQi+HHrjkJfPHLNhqx/LJfIqdtKNopxgrpyBmR/Z4FR9MyAWmvF6sTJ0PiEFl+EePK4BogeNfYCWkUh8jU2wYixDr3NXUfksRj8BXCwAAPdtb2ByDl+7V2RMLdsHKTTAXFfViFGAUYadBOh7jtgtG0bflV6wnRjsKYVTiMeDFUD8dkMgeBJH/Dub13rRs1A1Wej45ryj8UTsDCcf9YMzTcZIiBBwLO4NcwiVZbuNSLz/aIpSwyc2JVKaQ2w8fSGFiCQXsvgtiTTb3N5yuRa8S4AWE+MUYBUsPpEHQP7929Z0WIkfAyrBX89rN0oYYUdns93F/PA0OO0QIDAQAB
-----END PUBLIC KEY-----`

// AI 问数平台地址
const AI_PLATFORM_URL = process.env.SSO_PLATFORM_URL || 'http://183.129.242.90:3100'

/**
 * RSA/ECB/PKCS1Padding 加密
 * 使用 Node.js 原生 crypto 模块，完全兼容 Java 的 RSA/ECB/PKCS1Padding
 * @param {string} plaintext - 明文字符串
 * @returns {string} Base64 编码的密文
 */
function rsaEncrypt(plaintext) {
  const encrypted = crypto.publicEncrypt(
    {
      key: PUBLIC_KEY_PEM,
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
  const payload = JSON.stringify({
    username: employeeNo,
    timestamp: Date.now()
  })

  const encryptedData = rsaEncrypt(payload)

  const res = await fetch(`${AI_PLATFORM_URL}/api/auth/sso/ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.SSO_CLIENT_ID || 'xmgl',
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
