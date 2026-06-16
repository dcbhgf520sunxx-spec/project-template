const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

/**
 * JWT 身份验证中间件
 * - 验证请求头中的 Authorization Bearer Token
 * - 验证通过：将用户信息挂载到 req.user，放行
 * - 验证失败：返回 401 拒绝访问
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录', data: null })
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: decoded.userId,
      employeeNo: decoded.employeeNo,
    }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null })
    }
    return res.status(401).json({ code: 401, message: '无效的登录凭证', data: null })
  }
}

module.exports = { verifyToken }
