const jwt = require('jsonwebtoken')
const accessLogService = require('../services/accessLogService')
const { fail } = require('../utils/response')

/**
 * JWT 身份验证中间件
 * - 验证请求头中的 Authorization Bearer Token
 * - 验证通过：将用户信息挂载到 req.user，放行
 * - 验证失败：返回 401 拒绝访问
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 401, 401, '未登录，请先登录')
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!await accessLogService.isSessionActive({ userId: decoded.userId, sessionId: decoded.sessionId })) {
      return fail(res, 401, 401, '登录已失效，请重新登录')
    }
    req.user = {
      id: decoded.userId,
      employeeNo: decoded.employeeNo,
      sessionId: decoded.sessionId,
    }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 401, 401, '登录已过期，请重新登录')
    }
    return fail(res, 401, 401, '无效的登录凭证')
  }
}

module.exports = { verifyToken }
