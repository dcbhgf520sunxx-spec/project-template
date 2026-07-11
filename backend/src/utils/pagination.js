function parsePagination(query = {}) {
  const rawPage = Number(query.page)
  const rawPageSize = Number(query.pageSize)
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const pageSize = Number.isInteger(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, 100) : 20

  return { page, pageSize, offset: (page - 1) * pageSize }
}

function getSortDirection(value) {
  return value === 'ascend' || value === 'asc' ? 'ASC' : 'DESC'
}

module.exports = { parsePagination, getSortDirection }
