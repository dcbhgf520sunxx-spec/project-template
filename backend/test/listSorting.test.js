const assert = require('node:assert/strict')
const test = require('node:test')
const db = require('../src/db')

for (const count of [1, 25]) {
  test(`角色列表返回${count}条时关联权限不产生逐行查询`, async t => {
    let queries = 0
    const rows = Array.from({ length: count }, (_, index) => ({ id: index + 1, permissions: '可见叶子菜单' }))
    t.mock.method(db, 'prepare', () => {
      queries++
      return { all: async () => rows, get: async () => ({ total: count }) }
    })
    const res = { status() { return this }, json(body) { this.body = body } }
    await require('../src/controllers/roleController').list({ query: { pageSize: 50 } }, res)
    assert.equal(queries, 2)
    assert.equal(res.body.data.list.length, count)
    assert.ok(res.body.data.list.every(row => row.permissions === '可见叶子菜单'))
  })
}

for (const [order, direction] of [['ascend', 'ASC'], ['descend', 'DESC']]) {
  test(`工单跟进人列表与详情上下条按显示姓名${direction}排序`, async t => {
    const queries = []
    t.mock.method(db, 'prepare', sql => {
      queries.push(sql.replace(/\s+/g, ' '))
      return { all: async () => [], get: async () => ({ total: 0 }) }
    })
    const controller = require('../src/controllers/workOrderController')
    const req = { query: { sort_field: 'follower_id', sort_order: order, id: 1, page: 2, pageSize: 10 }, user: { id: 1 } }
    const res = { status() { return this }, json() {} }
    await controller.list(req, res)
    await controller.getNeighbors(req, res)
    for (const query of [queries.find(sql => sql.includes('LIMIT ?')), queries.find(sql => sql.includes('LAG('))]) {
      assert.ok(query.includes(`ORDER BY u3.real_name ${direction}, w.id ${direction}`))
    }
  })
}
