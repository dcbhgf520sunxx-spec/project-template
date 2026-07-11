const fs = require('node:fs')
const path = require('node:path')
const { pool } = require('../src/db')

function listMigrationFiles(directory) {
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort()
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS pms_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function getPendingMigrations(client, files) {
  const pending = []
  for (const file of files) {
    const existing = await client.query(
      'SELECT 1 FROM pms_migrations WHERE name = $1',
      [file]
    )
    if (!existing.rows.length) pending.push(file)
  }
  return pending
}

async function applyMigrations({ client, files, readFile }) {
  await ensureMigrationsTable(client)

  const applied = []
  for (const file of files) {
    const pending = await getPendingMigrations(client, [file])
    if (!pending.length) continue

    await client.query('BEGIN')
    try {
      await client.query(readFile(file))
      await client.query('INSERT INTO pms_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      applied.push(file)
    } catch (error) {
      await client.query('ROLLBACK')
      throw new Error(`迁移失败：${file}，${error.message}`)
    }
  }

  return applied
}

async function run() {
  const directory = path.join(__dirname, '../db/migrations')
  const client = await pool.connect()
  try {
    const files = listMigrationFiles(directory)
    await ensureMigrationsTable(client)
    if (process.argv.includes('--check')) {
      const pending = await getPendingMigrations(client, files)
      console.log(pending.length ? `待执行迁移：${pending.join(', ')}` : '没有待执行迁移')
      return
    }
    const applied = await applyMigrations({
      client,
      files,
      readFile: (file) => fs.readFileSync(path.join(directory, file), 'utf8')
    })
    console.log(applied.length ? `已执行迁移：${applied.join(', ')}` : '没有待执行迁移')
  } finally {
    client.release()
    await pool.end()
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}

module.exports = { applyMigrations, getPendingMigrations, listMigrationFiles }
