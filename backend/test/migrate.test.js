const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { applyMigrations, baselineMigrations, getPendingMigrations, listMigrationFiles } = require('../scripts/migrate')

test('lists SQL migration files in lexical order', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'))
  fs.writeFileSync(path.join(directory, '20260705_second.sql'), 'SELECT 2;')
  fs.writeFileSync(path.join(directory, '20260704_first.sql'), 'SELECT 1;')
  fs.writeFileSync(path.join(directory, 'notes.txt'), 'ignore')

  assert.deepEqual(listMigrationFiles(directory), [
    '20260704_first.sql',
    '20260705_second.sql'
  ])
})

test('rejects migration files without the required date prefix', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'))
  fs.writeFileSync(path.join(directory, 'bad-name.sql'), 'SELECT 1;')
  assert.throws(() => listMigrationFiles(directory), /YYYYMMDD_name\.sql/)
})

test('requires an explicit sequence for new same-day migrations', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'))
  fs.writeFileSync(path.join(directory, '20260716_without_sequence.sql'), 'SELECT 1;')
  assert.throws(() => listMigrationFiles(directory), /YYYYMMDD_01_name\.sql/)

  fs.rmSync(directory, { recursive: true })
  const orderedDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'))
  fs.writeFileSync(path.join(orderedDirectory, '20260716_02_second.sql'), 'SELECT 2;')
  fs.writeFileSync(path.join(orderedDirectory, '20260716_01_first.sql'), 'SELECT 1;')
  assert.deepEqual(listMigrationFiles(orderedDirectory), [
    '20260716_01_first.sql',
    '20260716_02_second.sql'
  ])
})

test('applies only migrations that are not recorded', async () => {
  const queries = []
  const client = {
    async query(sql, params = []) {
      queries.push({ sql, params })
      if (sql.includes('SELECT 1 FROM pms_migrations')) {
        return { rows: params[0] === '20260704_done.sql' ? [{ exists: 1 }] : [] }
      }
      return { rows: [] }
    }
  }

  const applied = await applyMigrations({
    client,
    files: ['20260704_done.sql', '20260705_new.sql'],
    readFile: (file) => file === '20260705_new.sql' ? 'CREATE TABLE example (id INT);' : 'SELECT 1;'
  })

  assert.deepEqual(applied, ['20260705_new.sql'])
  assert.ok(queries.some(({ sql }) => sql === 'CREATE TABLE example (id INT);'))
  assert.ok(!queries.some(({ sql }) => sql === 'SELECT 1;'))
  assert.ok(queries.some(({ sql, params }) => sql.includes('INSERT INTO pms_migrations') && params[0] === '20260705_new.sql'))
})

test('lists migrations that still need execution', async () => {
  const client = {
    async query(sql, params = []) {
      if (sql.includes('SELECT 1 FROM pms_migrations')) {
        return { rows: params[0] === '20260704_done.sql' ? [{ exists: 1 }] : [] }
      }
      return { rows: [] }
    }
  }

  assert.deepEqual(
    await getPendingMigrations(client, ['20260704_done.sql', '20260705_new.sql']),
    ['20260705_new.sql']
  )
})

test('baselines a freshly initialized database without replaying historical SQL', async () => {
  const queries = []
  const client = {
    async query(sql, params = []) {
      queries.push({ sql, params })
      return { rows: [] }
    }
  }

  const recorded = await baselineMigrations(client, [
    '20260704_first.sql',
    '20260705_second.sql'
  ])

  assert.deepEqual(recorded, ['20260704_first.sql', '20260705_second.sql'])
  assert.equal(queries.filter(({ sql }) => sql.includes('INSERT INTO pms_migrations')).length, 2)
  assert.ok(!queries.some(({ sql }) => sql.includes('CREATE TABLE example')))
})
