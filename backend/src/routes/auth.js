const express = require('express')
const router = express.Router()
const db = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const { requestTicket } = require('../services/ssoService')
const { verifyToken } = require('../middleware/auth')
dotenv.config()

// Simple in-memory rate limiter for login
const loginAttempts = new Map()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes
const CLEANUP_MS = 60 * 60 * 1000 // 1 hour

// 定期清理超过 1 小时未活动的条目，防止内存泄漏
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of loginAttempts) {
    if (now - data.lastAttempt > CLEANUP_MS) loginAttempts.delete(ip)
  }
}, CLEANUP_MS)

// Login
router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body
    if (!account || !password) {
      return res.status(400).json({ code: 400, message: '请输入账号和密码', data: null })
    }

    // Rate limiting
    const clientIp = req.ip || 'unknown'
    const attempts = loginAttempts.get(clientIp) || { count: 0, lastAttempt: 0 }
    if (attempts.count >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - attempts.lastAttempt
      if (elapsed < LOCKOUT_MS) {
        const remaining = Math.ceil((LOCKOUT_MS - elapsed) / 1000)
        return res.status(429).json({ code: 429, message: `登录尝试次数过多，请${remaining}秒后重试`, data: null })
      }
      loginAttempts.delete(clientIp)
    }

    const row = await db.prepare(
      'SELECT id, employee_no, real_name, phone, password, status, first_login FROM pms_user WHERE (employee_no = ? OR phone = ? OR real_name = ?) AND is_deleted = 0'
    ).get(account, account, account)
    if (!row) {
      attempts.count++
      attempts.lastAttempt = Date.now()
      loginAttempts.set(clientIp, attempts)
      return res.status(401).json({ code: 401, message: '用户不存在', data: null })
    }

    const valid = await bcrypt.compare(password, row.password)
    if (!valid) {
      attempts.count++
      attempts.lastAttempt = Date.now()
      loginAttempts.set(clientIp, attempts)
      return res.status(401).json({ code: 401, message: '密码错误', data: null })
    }

    if (row.status !== 1) {
      return res.status(403).json({ code: 403, message: '账号已停用', data: null })
    }

    // Reset attempts on successful login
    loginAttempts.delete(clientIp)

    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign(
      { userId: row.id, employeeNo: row.employee_no },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Get user menus (auto-include parent dirs for tree rendering)
    const menus = await db.prepare(`
      SELECT DISTINCT m.*
      FROM pms_menu m
      INNER JOIN pms_role_menu rm ON m.id = rm.menu_id
      INNER JOIN pms_user_role ur ON rm.role_id = ur.role_id
      WHERE ur.user_id = ? AND m.is_deleted = 0 AND m.status = 1
      ORDER BY m.sort_order, m.id
    `).all(row.id)

    // Auto-include parent menus for tree rendering
    const allMenuIds = new Set(menus.map(r => r.id))
    const allMenus = await db.prepare('SELECT * FROM pms_menu WHERE is_deleted = 0').all()
    const menuMap = {}
    allMenus.forEach(m => { menuMap[m.id] = m })

    const toProcess = [...allMenuIds]
    while (toProcess.length > 0) {
      const id = toProcess.pop()
      const parentId = menuMap[id]
      if (parentId && parentId !== 0 && !allMenuIds.has(parentId)) {
        const parent = menuMap[parentId]
        if (parent) {
          menus.push(parent)
          allMenuIds.add(parentId)
          toProcess.push(parentId)
        }
      }
    }

    res.json({ code: 0, message: '登录成功', data: { token, first_login: row.first_login, user: { id: row.id, employee_no: row.employee_no, real_name: row.real_name, phone: row.phone }, menus } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '登录失败', data: null })
  }
})

// Change password
router.put('/password', async (req, res) => {
  try {
    const { id, old_password, new_password } = req.body
    if (!id || !old_password || !new_password) {
      return res.status(400).json({ code: 400, message: '参数不完整', data: null })
    }
    const row = await db.prepare('SELECT password FROM pms_user WHERE id = ? AND is_deleted = 0').get(id)
    if (!row) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    const valid = await bcrypt.compare(old_password, row.password)
    if (!valid) {
      return res.status(401).json({ code: 401, message: '原密码错误', data: null })
    }
    const hashed = await bcrypt.hash(new_password, 10)
    await db.prepare('UPDATE pms_user SET password = ?, first_login = 0, updated_at = NOW() WHERE id = ?').run(hashed, id)
    await db.writeLog(id, '更改密码', '用户', id, 'password', '***', '***', req.ip)
    res.json({ code: 0, message: '密码修改成功', data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '修改失败', data: null })
  }
})

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const { id } = req.query
    if (!id) {
      return res.status(400).json({ code: 400, message: '参数不完整', data: null })
    }
    const sql = `SELECT pms_user.id, pms_user.employee_no, pms_user.real_name, pms_user.phone, pms_user.status, pms_user.created_at,
      u1.real_name as creator_name, u2.real_name as updater_name, pms_user.updated_at
      FROM pms_user
      LEFT JOIN pms_user u1 ON pms_user.creator_id = u1.id
      LEFT JOIN pms_user u2 ON pms_user.updater_id = u2.id
      WHERE pms_user.id = ? AND pms_user.is_deleted = 0`
    const row = await db.prepare(sql).get(id)
    if (!row) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    res.json({ code: 0, message: 'success', data: row })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '查询失败', data: null })
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
