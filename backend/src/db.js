const mysql = require('mysql2')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'pms',
  password: process.env.DB_PASSWORD || 'pms123456',
  database: process.env.DB_NAME || 'project_template',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
  dateStrings: true,
})

const promise = pool.promise()
const DEFAULT_ADMIN_ACCOUNT = 'admin'

// MySQL wrapper for cleaner syntax
function prepare(sql) {
  return {
    get: async (...params) => {
      const [rows] = await promise.execute(sql, params)
      return rows.length ? rows[0] : undefined
    },
    all: async (...params) => {
      const [rows] = await promise.execute(sql, params)
      return rows
    },
    run: async (...params) => {
      const [result] = await promise.execute(sql, params)
      return { lastInsertRowid: result.insertId, changes: result.affectedRows }
    },
  }
}

function exec(sql) {
  return promise.query(sql)
}

function transaction(fn) {
  return promise.getConnection().then(conn => {
    return conn.beginTransaction()
      .then(() => Promise.resolve(fn(conn)))
      .then(() => conn.commit())
      .catch(err => conn.rollback().then(() => { throw err }))
      .finally(() => conn.release())
  })
}

// Write operation log
function writeLog(userId, action, module, targetId, fieldName, oldValue, newValue, ip, targetName) {
  return prepare(
    'INSERT INTO pms_operation_log (user_id, action, module, target_id, field_name, old_value, new_value, ip, target_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, action, module, targetId, fieldName, oldValue, newValue, ip, targetName || null)
}

const initSQL = `
CREATE TABLE IF NOT EXISTS pms_user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_no VARCHAR(50) NOT NULL UNIQUE,
  real_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  status TINYINT DEFAULT 1,
  first_login TINYINT DEFAULT 1,
  creator_id BIGINT,
  updater_id BIGINT,
  is_deleted TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS pms_role (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  creator_id BIGINT,
  updater_id BIGINT,
  is_deleted TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

CREATE TABLE IF NOT EXISTS pms_user_role (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

CREATE TABLE IF NOT EXISTS pms_menu (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT DEFAULT 0,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  type TINYINT DEFAULT 1,
  path VARCHAR(200),
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  status TINYINT DEFAULT 1,
  creator_id BIGINT,
  updater_id BIGINT,
  is_deleted TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单权限表';

CREATE TABLE IF NOT EXISTS pms_role_menu (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_id BIGINT NOT NULL,
  menu_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表';

CREATE TABLE IF NOT EXISTS pms_operation_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  target_id BIGINT,
  target_name VARCHAR(200),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  ip VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

CREATE TABLE IF NOT EXISTS pms_work_order (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  problem_type TINYINT NOT NULL,
  problem_desc TEXT NOT NULL,
  result_desc TEXT,
  follower_id BIGINT NOT NULL,
  urgency TINYINT NOT NULL DEFAULT 1,
  status TINYINT NOT NULL DEFAULT 0,
  is_overdue TINYINT NOT NULL DEFAULT 0,
  expected_resolve_date DATETIME,
  resolve_date DATETIME,
  close_date DATETIME,
  submitter_name VARCHAR(50) NOT NULL,
  submitter_dept VARCHAR(100) NOT NULL,
  submit_time DATETIME NOT NULL,
  creator_id BIGINT,
  updater_id BIGINT,
  is_deleted TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运维工单表';

CREATE TABLE IF NOT EXISTS pms_archive_type (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  code_prefix VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  status TINYINT DEFAULT 1,
  creator_id BIGINT,
  updater_id BIGINT,
  is_deleted TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='档案类型表';

CREATE TABLE IF NOT EXISTS pms_archive (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  archive_type_id BIGINT NOT NULL,
  sort_order INT DEFAULT 0,
  status TINYINT DEFAULT 1,
  creator_id BIGINT,
  updater_id BIGINT,
  is_deleted TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='档案表';
`

async function init() {
  try {
    await exec(initSQL)
    console.log('Database tables initialized.')

    // Compatibility migrations for existing local databases.
    try { await exec('ALTER TABLE pms_operation_log ADD COLUMN target_name VARCHAR(200) DEFAULT NULL AFTER target_id') } catch (e) {}
    try { await exec('ALTER TABLE pms_work_order DROP COLUMN system_id') } catch (e) {}
    try { await exec('DROP TABLE IF EXISTS pms_bug, pms_task, pms_milestone, pms_requirement, pms_project, pms_product') } catch (e) {}

    // Seed data: admin user
    const userCount = await prepare('SELECT COUNT(*) as c FROM pms_user').get()
    if (userCount.c === 0) {
      const hashed = await bcrypt.hash('vv123456', 10)
      await prepare(
        'INSERT INTO pms_user (employee_no, real_name, phone, password, status, first_login, creator_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(DEFAULT_ADMIN_ACCOUNT, '管理员', '13800000000', hashed, 1, 0, null, new Date())
      console.log('Seeded admin user.')
    }

    const adminUserByAccount = await prepare('SELECT id FROM pms_user WHERE employee_no = ? AND is_deleted = 0').get(DEFAULT_ADMIN_ACCOUNT)
    if (!adminUserByAccount) {
      const legacyAdmin = await prepare('SELECT id FROM pms_user WHERE employee_no = ? AND real_name = ? AND is_deleted = 0').get('EMP000', '管理员')
      if (legacyAdmin) {
        await prepare('UPDATE pms_user SET employee_no = ?, updated_at = NOW() WHERE id = ?').run(DEFAULT_ADMIN_ACCOUNT, legacyAdmin.id)
      }
    }

    // Seed data: admin role
    const roleCount = await prepare('SELECT COUNT(*) as c FROM pms_role').get()
    if (roleCount.c === 0) {
      const adminUser = await prepare('SELECT id FROM pms_user WHERE employee_no = ?').get(DEFAULT_ADMIN_ACCOUNT)
      await prepare('INSERT INTO pms_role (code, name, description, creator_id) VALUES (?, ?, ?, ?)')
        .run('admin', '管理员', '系统管理员，拥有所有权限', adminUser.id)
      const adminRole = await prepare('SELECT id FROM pms_role WHERE code = ?').get('admin')
      await prepare('INSERT INTO pms_user_role (user_id, role_id) VALUES (?, ?)').run(adminUser.id, adminRole.id)
      console.log('Seeded roles.')
    }

    // Seed data: menu structure
    const menuCount = await prepare('SELECT COUNT(*) as c FROM pms_menu').get()
    if (menuCount.c === 0) {
      const adminUser = await prepare('SELECT id FROM pms_user WHERE employee_no = ?').get(DEFAULT_ADMIN_ACCOUNT)

      const menus = [
        { parent_id: 0, name: '运维工单', code: 'work_order', type: 2, path: '/work-orders', icon: 'Tools', sort: 1 },
        { parent_id: 0, name: '基础设置', code: 'base_settings', type: 1, path: '', icon: 'Setting', sort: 2 },
        { parent_id: 0, name: '用户与权限', code: 'user_auth', type: 1, path: '', icon: 'User', sort: 3 },
      ]

      const insertMenu = prepare(
        'INSERT INTO pms_menu (parent_id, name, code, type, path, icon, sort_order, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      for (const m of menus) {
        await insertMenu.run(m.parent_id, m.name, m.code, m.type, m.path, m.icon, m.sort, 1, adminUser.id)
      }

      // Sub-menus
      const baseSettings = await prepare('SELECT id FROM pms_menu WHERE code = ?').get('base_settings')
      await prepare(
        'INSERT INTO pms_menu (parent_id, name, code, type, path, icon, sort_order, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(baseSettings.id, '基础档案', 'archive', 2, '/archive', '', 1, 1, adminUser.id)

      const userAuth = await prepare('SELECT id FROM pms_menu WHERE code = ?').get('user_auth')
      await prepare(
        'INSERT INTO pms_menu (parent_id, name, code, type, path, icon, sort_order, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(userAuth.id, '用户管理', 'user', 2, '/users', '', 1, 1, adminUser.id)
      await prepare(
        'INSERT INTO pms_menu (parent_id, name, code, type, path, icon, sort_order, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(userAuth.id, '角色管理', 'role', 2, '/roles', '', 2, 1, adminUser.id)

      // Bind all menus to admin role
      const adminRole = await prepare('SELECT id FROM pms_role WHERE code = ?').get('admin')
      const allMenus = await prepare('SELECT id FROM pms_menu WHERE is_deleted = 0').all()
      const bindMenu = prepare('INSERT INTO pms_role_menu (role_id, menu_id) VALUES (?, ?)')
      for (const m of allMenus) {
        await bindMenu.run(adminRole.id, m.id)
      }
      console.log('Seeded complete menu structure.')
    }

    // 基础档案属于业务配置，新库初始化时不写入默认业务数据。
  } catch (err) {
    console.error('Database init failed:', err)
    process.exit(1)
  }
}

init()

module.exports = { prepare, exec, transaction, writeLog, pool }
