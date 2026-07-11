const assert = require('node:assert/strict')
const test = require('node:test')
const { parsePagination, getSortDirection } = require('../src/utils/pagination')

test('normalizes list pagination and caps the page size', () => {
  assert.deepEqual(parsePagination({ page: '3', pageSize: '500' }), { page: 3, pageSize: 100, offset: 200 })
})

test('maps UI sort order to SQL order', () => {
  assert.equal(getSortDirection('ascend'), 'ASC')
  assert.equal(getSortDirection('descend'), 'DESC')
})
