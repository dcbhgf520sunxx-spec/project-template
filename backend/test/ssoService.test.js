const test = require('node:test')
const assert = require('node:assert/strict')

test('SSO request rejects missing platform configuration instead of using legacy defaults', async () => {
  const previous = {
    platformUrl: process.env.SSO_PLATFORM_URL,
    clientId: process.env.SSO_CLIENT_ID,
    publicKey: process.env.SSO_PUBLIC_KEY_PEM
  }

  delete process.env.SSO_PLATFORM_URL
  delete process.env.SSO_CLIENT_ID
  delete process.env.SSO_PUBLIC_KEY_PEM

  try {
    const { requestTicket } = require('../src/services/ssoService')
    await assert.rejects(requestTicket('admin'), /未配置 SSO_PLATFORM_URL/)
  } finally {
    if (previous.platformUrl === undefined) delete process.env.SSO_PLATFORM_URL
    else process.env.SSO_PLATFORM_URL = previous.platformUrl
    if (previous.clientId === undefined) delete process.env.SSO_CLIENT_ID
    else process.env.SSO_CLIENT_ID = previous.clientId
    if (previous.publicKey === undefined) delete process.env.SSO_PUBLIC_KEY_PEM
    else process.env.SSO_PUBLIC_KEY_PEM = previous.publicKey
  }
})
