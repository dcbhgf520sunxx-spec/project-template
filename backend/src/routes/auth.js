const express = require('express')
const router = express.Router()
const db = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { requestTicket } = require('../services/ssoService')
const { verifyToken } = require('../middleware/auth')
const accessLogService = require('../services/accessLogService')
const accountService = require('../services/accountService')
const { ok, fail, failField } = require('../utils/response')
const { includeParentMenus } = require('../services/menuHierarchy')

const { createLoginRateLimitService } = require('../services/loginRateLimitService')
const { createLoginCaptchaService } = require('../services/loginCaptchaService')
const loginProtection = createLoginRateLimitService()
const loginCaptcha = createLoginCaptchaService()

async function safeRecordLoginFailure(payload) {
  try {
    await accessLogService.recordLoginFailure(payload)
  } catch (err) {
    console.error('access log write failed:', err.message)
  }
}

async function safeRecordLoginSuccess(payload) {
  try {
    return await accessLogService.recordLoginSuccess(payload)
  } catch (err) {
    console.error('access log write failed:', err.message)
    return null
  }
}

router.get('/captcha', (req, res) => {
  res.set('Cache-Control', 'no-store')
  try {
    return ok(res, loginCaptcha.issue(req.ip || 'unknown'))
  } catch (err) {
    if (err.statusCode === 429) {
      res.set('Retry-After', '60')
      return fail(res, 429, 429, err.message)
    }
    console.error('captcha generation failed:', err.message)
    return fail(res, 500, 500, '验证码获取失败，请重试')
  }
})

// 密码登录的验证码必须先消费；账号失败额度按数据库身份合并工号和手机号。
router.post('/login', async (req, res) => {
  let attempt
  try {
    const clientIp = req.ip || 'unknown'
    const retryAfter = loginProtection.takeRequest(clientIp)
    if (retryAfter) {
      res.set('Retry-After', String(retryAfter))
      return fail(res, 429, 429, `请求过于频繁，请${retryAfter}秒后重试`)
    }
    const { account: rawAccount, password, captcha_id, captcha_code } = req.body || {}
    if (typeof rawAccount !== 'string' || !rawAccount.trim() || rawAccount.trim().length > 100 || typeof password !== 'string' || !password) {
      return fail(res, 400, 400, '请输入有效的账号和密码')
    }
    const account = rawAccount.trim()
    if (!loginCaptcha.consume(clientIp, captcha_id, captcha_code)) {
      return failField(res, 'captcha_code', '验证码错误或已过期，请重新输入')
    }

    const row = await db.prepare(
      'SELECT id, employee_no, real_name, phone, avatar_url, password, status, first_login FROM pms_user WHERE (employee_no = ? OR phone = ?) AND is_deleted = 0'
    ).get(account, account)
    attempt = loginProtection.begin(row ? `user:${row.id}` : account, { knownAccount: Boolean(row) })
    if (attempt.retryAfter) {
      res.set('Retry-After', String(attempt.retryAfter))
      const locked = attempt.reason === 'locked'
      await safeRecordLoginFailure({ account, failReason: locked ? '账号登录失败次数过多' : '账号登录请求繁忙', result: 'locked', req, user: row })
      return fail(res, 429, 429, locked
        ? `该账号登录失败次数过多，请${attempt.retryAfter}秒后重试`
        : `登录请求繁忙，请${attempt.retryAfter}秒后重试`)
    }
    if (!row) {
      attempt.complete('failure')
      await safeRecordLoginFailure({ account, failReason: '用户不存在', req })
      return fail(res, 401, 401, '账号或密码错误')
    }

    const valid = await bcrypt.compare(password, row.password)
    if (!valid) {
      attempt.complete('failure')
      await safeRecordLoginFailure({ account, failReason: '密码错误', req, user: row })
      return fail(res, 401, 401, '账号或密码错误')
    }
    if (row.status !== 1) {
      attempt.complete('failure')
      await safeRecordLoginFailure({ account, failReason: '账号已停用', req, user: row })
      return fail(res, 403, 403, '账号已停用')
    }

    // Get user menus (auto-include parent dirs for tree rendering)
    const menus = await db.prepare(`
      SELECT DISTINCT m.*
      FROM pms_menu m
      INNER JOIN pms_role_menu rm ON m.id = rm.menu_id
      INNER JOIN pms_user_role ur ON rm.role_id = ur.role_id
      WHERE ur.user_id = ? AND m.is_deleted = 0 AND m.status = 1
      ORDER BY m.sort_order, m.id
    `).all(row.id)

    const homeMenu = await db.prepare(
      "SELECT * FROM pms_menu WHERE path = '/home' AND is_deleted = 0 AND status = 1"
    ).get()
    if (homeMenu && !menus.some(m => m.id === homeMenu.id)) {
      menus.push(homeMenu)
      menus.sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id))
    }

    const allMenus = await db.prepare('SELECT * FROM pms_menu WHERE is_deleted = 0').all()
    const resolvedMenus = includeParentMenus(menus, allMenus)

    const accessSessionId = await safeRecordLoginSuccess({ user: row, account, req })
    if (!accessSessionId) throw new Error('登录会话创建失败')
    const roles = await db.prepare(`
      SELECT r.code FROM pms_user_role ur
      INNER JOIN pms_role r ON r.id = ur.role_id
      WHERE ur.user_id = ? AND r.is_deleted = 0
    `).all(row.id)
    const token = jwt.sign(
      { userId: row.id, employeeNo: row.employee_no, sessionId: accessSessionId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    attempt.complete('success')
    ok(res, { token, first_login: row.first_login, access_session_id: accessSessionId, user: { id: row.id, employee_no: row.employee_no, real_name: row.real_name, phone: row.phone, avatar_url: row.avatar_url, roles: roles.map(item => item.code) }, menus: resolvedMenus }, '登录成功')
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '登录失败', data: null })
  } finally {
    attempt?.complete?.()
  }
})

router.post('/heartbeat', verifyToken, async (req, res) => {
  try {
    const result = await accessLogService.touchSession({
      userId: req.user.id,
      sessionId: req.body.session_id
    })
    res.json({ code: 0, message: 'success', data: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '更新访问状态失败', data: null })
  }
})

router.post('/logout', verifyToken, async (req, res) => {
  try {
    const result = await accessLogService.endSession({
      userId: req.user.id,
      sessionId: req.body.session_id,
      preserveLastActive: req.body.preserve_last_active === 1 || req.body.preserve_last_active === true
    })
    res.json({ code: 0, message: 'success', data: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '退出记录失败', data: null })
  }
})

// Current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const row = await accountService.getCurrentUser(req.user.id)
    if (!row) return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    res.json({ code: 0, message: 'success', data: row })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '查询失败', data: null })
  }
})

router.put('/me/profile', verifyToken, async (req, res) => {
  try {
    const row = await accountService.updateProfile(req.user.id, req.body)
    res.json({ code: 0, message: 'success', data: row })
  } catch (err) {
    console.error(err)
    res.status(err.statusCode || 500).json({ code: err.statusCode || 500, message: err.message || '保存失败', data: null })
  }
})

router.put('/me/phone', verifyToken, async (req, res) => {
  try {
    const row = await accountService.changePhone(req.user.id, req.body)
    res.json({ code: 0, message: 'success', data: row })
  } catch (err) {
    console.error(err)
    res.status(err.statusCode || 400).json({ code: err.statusCode || 400, message: err.message || '手机号修改失败', data: null })
  }
})

router.post('/me/avatar', verifyToken, async (req, res) => {
  try {
    const result = await accountService.saveAvatar(req.user.id, req.body)
    res.json({ code: 0, message: 'success', data: result })
  } catch (err) {
    console.error(err)
    res.status(400).json({ code: 400, message: err.message || '头像上传失败', data: null })
  }
})

router.delete('/me/avatar', verifyToken, async (req, res) => {
  try {
    const result = await accountService.resetAvatar(req.user.id)
    res.json({ code: 0, message: 'success', data: result })
  } catch (err) {
    console.error(err)
    res.status(400).json({ code: 400, message: err.message || '头像重置失败', data: null })
  }
})

router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const preference = await accountService.getPreference(req.user.id)
    res.json({ code: 0, message: 'success', data: preference })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '查询失败', data: null })
  }
})

router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const preference = await accountService.savePreference(req.user.id, req.body)
    res.json({ code: 0, message: 'success', data: preference })
  } catch (err) {
    console.error(err)
    res.status(400).json({ code: 400, message: err.message || '保存失败', data: null })
  }
})

// Change password
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body
    const userId = req.user.id
    const passwordPayload = accountService.validatePasswordChangePayload({
      oldPassword: old_password,
      newPassword: new_password
    })
    const row = await db.prepare('SELECT password FROM pms_user WHERE id = ? AND is_deleted = 0').get(userId)
    if (!row) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    const valid = await bcrypt.compare(passwordPayload.oldPassword, row.password)
    if (!valid) {
      return res.status(401).json({ code: 401, message: '原密码错误', data: null })
    }
    const hashed = await bcrypt.hash(passwordPayload.newPassword, 10)
    await db.prepare('UPDATE pms_user SET password = ?, first_login = 0, updated_at = NOW() WHERE id = ?').run(hashed, userId)
    await db.writeLog(userId, '更改密码', '用户', userId, 'password', '***', '***', req.ip)
    res.json({ code: 0, message: '密码修改成功', data: null })
  } catch (err) {
    console.error(err)
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({ code: statusCode, message: err.message || '修改失败', data: null })
  }
})

// Get SSO ticket for AI chatbot embed (requires authentication)
router.post('/sso/ticket', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    if (!userId) {
      return res.status(400).json({ code: 400, message: '用户信息异常', data: null })
    }

    // Get employee number from database
    const user = await db.prepare('SELECT employee_no FROM pms_user WHERE id = ? AND is_deleted = 0').get(userId)
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }

    const ticket = await requestTicket(user.employee_no)
    res.json({ code: 0, message: 'success', data: { ticket } })
  } catch (err) {
    console.error('SSO ticket error:', err.message)
    res.status(500).json({ code: 500, message: err.message || '获取 ticket 失败', data: null })
  }
})

module.exports = router
