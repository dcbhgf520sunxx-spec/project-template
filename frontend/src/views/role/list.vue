<template>
  <div class="role-list">
    <div class="table-box">
      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-row" ref="filterBarRef" :style="{ '--filter-width': itemWidthValue + 'px' }">
          <template v-for="(f, idx) in allFilters" :key="f.key">
            <div v-if="idx < visibleCount" class="filter-item" :class="{ 'double-width': f.attrs?.type === 'daterange' || f.doubleWidth }">
              <span class="filter-label">{{ f.label }}</span>
              <input v-model="filters[f.key]" :placeholder="f.placeholder || '请输入'" @keyup.enter="handleSearch">
            </div>
          </template>
          <div class="btn-group-inline">
            <button class="btn btn-outline btn-sm" @click="handleSearch">搜索</button>
            <button class="btn btn-outline btn-sm" @click="handleReset">重置</button>
            <button class="btn btn-outline btn-sm" @click="expanded = !expanded">{{ expanded ? '收起' : '展开' }} ▾</button>
          </div>
          <span class="push"></span>
          <button class="btn btn-primary btn-sm add-btn" @click="$router.push('/roles/add')">+ 新增</button>
        </div>
        <!-- Expanded filters -->
        <div class="filter-row-extra" v-show="expanded && allFilters.length > visibleCount" :style="{ '--filter-width': itemWidthValue + 'px' }">
          <template v-for="(f, idx) in allFilters" :key="'extra-' + f.key">
            <div v-if="idx >= visibleCount" class="filter-item" :class="{ 'double-width': f.attrs?.type === 'daterange' || f.doubleWidth }">
              <span class="filter-label">{{ f.label }}</span>
              <input v-model="filters[f.key]" :placeholder="f.placeholder || '请输入'" @keyup.enter="handleSearch">
            </div>
          </template>
        </div>
      </div>

      <!-- Table -->
      <div class="table-area">
        <el-table :data="tableData" stripe resizable border style="width:100%;height:100%"
          :header-cell-style="{ background: '#f3f4f6', fontWeight: '500', fontSize: '13px', color: '#374151' }">
          <el-table-column label="序号" width="60" fixed align="center">
            <template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="角色编码" prop="code" width="120" fixed>
            <template #header>
              <span class="sortable-header" @click="toggleSort('code')">
                角色编码 <span :class="['sort-icon', { active: isSortActive('code') }]">{{ getSortIcon('code') }}</span>
              </span>
            </template>
            <template #default="{ row }">
              <a class="link" @click="$router.push(`/roles/detail/${row.id}`)">{{ row.code }}</a>
            </template>
          </el-table-column>
          <el-table-column label="角色名称" prop="name" min-width="160" fixed>
            <template #header>
              <span class="sortable-header" @click="toggleSort('name')">
                角色名称 <span :class="['sort-icon', { active: isSortActive('name') }]">{{ getSortIcon('name') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column label="已分配权限" prop="permissions" width="440" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('permissions')">
                已分配权限 <span :class="['sort-icon', { active: isSortActive('permissions') }]">{{ getSortIcon('permissions') }}</span>
              </span>
            </template>
            <template #default="{ row }">
              <span class="perm-cell" :title="row.permissions || ''">{{ row.permissions || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建人" prop="creator_name" width="100" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('creator_name')">
                创建人 <span :class="['sort-icon', { active: isSortActive('creator_name') }]">{{ getSortIcon('creator_name') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ row.creator_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" min-width="190" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('created_at')">
                创建时间 <span :class="['sort-icon', { active: isSortActive('created_at') }]">{{ getSortIcon('created_at') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ row.created_at || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="btn-group">
                <button class="btn btn-primary btn-sm" @click="$router.push(`/roles/edit/${row.id}`)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(row)">删除</button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span style="flex: 1;"></span>
        <div class="pg-right">
          <span class="pg-info">共 {{ total }} 条</span>
          <select v-model="pageSize" @change="onPageSizeChange">
            <option :value="20">20条/页</option>
            <option :value="50">50条/页</option>
            <option :value="100">100条/页</option>
          </select>
          <button class="pg-btn pg-nav" :disabled="page <= 1" @click="page = Math.max(1, page - 1); fetchData()">&lt;</button>
          <button
            v-for="pg in visiblePages" :key="pg"
            :class="['pg-btn', { active: pg === page }]"
            @click="goPage(pg)"
          >{{ pg }}</button>
          <button class="pg-btn pg-nav" :disabled="page >= totalPages" @click="page = Math.min(totalPages, page + 1); fetchData()">&gt;</button>
          <span class="pg-jump">
            前往 <input v-model="jumpPage" @keyup.enter="onJump"> 页
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'RoleList' })
import { ref, reactive, computed, onMounted, onActivated, onUnmounted, nextTick } from 'vue'
import { getRoles, deleteRole } from '../../api/role'
import { ElMessage, ElMessageBox } from 'element-plus'

const expanded = ref(false)
const filterBarRef = ref(null)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const jumpPage = ref('')
const visibleCount = ref(5)
const itemWidthValue = ref(170)

// 列排序状态
const sortState = reactive({ field: null, order: null })

const toggleSort = (field) => {
  if (sortState.field === field) {
    sortState.order = sortState.order === 'asc' ? 'desc' : null
    if (sortState.order === null) sortState.field = null
  } else {
    sortState.field = field
    sortState.order = 'asc'
  }
  fetchData()
}

const getSortIcon = (field) => {
  if (sortState.field === field && sortState.order === 'asc') return ' ▲'
  if (sortState.field === field && sortState.order === 'desc') return ' ▼'
  return ' ⇅'
}
const isSortActive = (field) => sortState.field === field

const filters = ref({ code: '', name: '' })

// Unified filter array
const allFilters = [
  { label: '角色编码', key: 'code', tag: 'input', placeholder: '请输入' },
  { label: '角色名称', key: 'name', tag: 'input', placeholder: '请输入' },
]

const visiblePages = computed(() => {
  const tp = totalPages.value
  if (tp <= 9) return Array.from({ length: tp }, (_, i) => i + 1)
  const pages = [1]
  const start = Math.max(2, page.value - 2)
  const end = Math.min(tp - 1, page.value + 2)
  if (start > 2) pages.push('...')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < tp - 1) pages.push('...')
  if (tp > 1) pages.push(tp)
  return pages
})

const fetchData = async () => {
  try {
    const { data } = await getRoles({ ...filters.value })
    let all = data.data || []
    total.value = all.length

    // 前端排序
    if (sortState.field && sortState.order) {
      const { field, order } = sortState
      const dir = order === 'asc' ? 1 : -1
      all = [...all].sort((a, b) => {
        let va = a[field], vb = b[field]
        if (va == null) va = ''
        if (vb == null) vb = ''
        if (typeof va === 'string' && typeof vb === 'string') {
          return va.localeCompare(vb, 'zh-CN') * dir
        }
        return (va - vb) * dir
      })
    }

    const start = (page.value - 1) * pageSize.value
    tableData.value = all.slice(start, start + pageSize.value)
  } catch (e) {
    ElMessage.error('获取角色列表失败')
  }
}

const handleSearch = () => { page.value = 1; fetchData() }
const handleReset = () => { sortState.field = null; sortState.order = null; filters.value = { code: '', name: '' }; handleSearch() }
const goPage = (pg) => { if (pg === '...' || pg < 1 || pg > totalPages.value) return; page.value = pg; fetchData() }
const onPageSizeChange = () => { page.value = 1; fetchData() }
const onJump = () => {
  const p = parseInt(jumpPage.value)
  if (!isNaN(p) && p >= 1 && p <= totalPages.value) { page.value = p; fetchData() }
  jumpPage.value = ''
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此角色吗？删除后不可恢复。', '确认删除', { type: 'warning' })
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await deleteRole(row.id, { updater_id: currentUser.id })
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
  }
}

function calcVisibleCount() {
  if (!filterBarRef.value) return
  const container = filterBarRef.value
  const containerWidth = container.clientWidth
  if (containerWidth === 0) return

  const addBtnWidth = 56
  const gap = 12
  const totalItems = allFilters.length

  // Try small layout (no expand button) first
  const smallReserved = 110 + addBtnWidth + gap * 2
  const smallAvailable = containerWidth - smallReserved

  if (smallAvailable > 0) {
    let count = 6
    while (count > 1) {
      const w = (smallAvailable - gap * (count - 1)) / count
      if (w >= 140) break
      count--
    }
    const itemWidth = Math.floor((smallAvailable - gap * (count - 1)) / count)

    let totalWidth = 0
    for (let i = 0; i < totalItems; i++) {
      const f = allFilters[i]
      const isDouble = f.doubleWidth || (f.attrs?.type === 'daterange')
      const w = isDouble ? itemWidth * 2 + gap : itemWidth
      totalWidth += totalWidth === 0 ? w : w + gap
    }
    if (totalWidth <= smallAvailable) {
      visibleCount.value = totalItems
      itemWidthValue.value = itemWidth
      return
    }
  }

  // Full layout with expand button
  const btnGroupWidth = 170
  const reservedWidth = btnGroupWidth + addBtnWidth + gap * 3
  const availableWidth = containerWidth - reservedWidth

  if (availableWidth <= 0) {
    itemWidthValue.value = 170
    visibleCount.value = 0
    return
  }

  let count = 6
  while (count > 1) {
    const itemWidth = (availableWidth - gap * (count - 1)) / count
    if (itemWidth >= 140) break
    count--
  }

  const itemWidth = Math.floor((availableWidth - gap * (count - 1)) / count)
  itemWidthValue.value = itemWidth
  visibleCount.value = Math.min(totalItems, count)

  // Safety: reduce visibleCount until total fits
  while (visibleCount.value > 0) {
    let tw = 0
    for (let i = 0; i < visibleCount.value; i++) {
      const f = allFilters[i]
      const isDouble = f.doubleWidth || (f.attrs?.type === 'daterange')
      const w = isDouble ? itemWidth * 2 + gap : itemWidth
      tw += tw === 0 ? w : w + gap
    }
    if (tw <= availableWidth) break
    visibleCount.value--
  }

  // If showing all items (no expand needed), verify with small reserved
  if (visibleCount.value === totalItems && totalItems > 0) {
    const sr2 = 110 + addBtnWidth + gap * 2
    const sa2 = containerWidth - sr2
    let tw = 0
    for (let i = 0; i < totalItems; i++) {
      const f = allFilters[i]
      const isDouble = f.doubleWidth || (f.attrs?.type === 'daterange')
      const w = isDouble ? itemWidth * 2 + gap : itemWidth
      tw += tw === 0 ? w : w + gap
    }
    if (tw > sa2 && visibleCount.value > 0) {
      visibleCount.value = totalItems - 1
    }
  }
}

function initColumnHighlight() {
  const tableEl = document.querySelector('.role-list .el-table')
  if (!tableEl) return

  const headerCells = tableEl.querySelectorAll('.el-table__header .el-table__cell')
  headerCells.forEach((th, index) => {
    th.addEventListener('mouseenter', () => {
      const cellsInCol = tableEl.querySelectorAll(`.el-table__body tr td:nth-child(${index + 1})`)
      cellsInCol.forEach(cell => cell.classList.add('column-highlight'))
      th.classList.add('column-highlight')
    })
    th.addEventListener('mouseleave', () => {
      const cellsInCol = tableEl.querySelectorAll(`.el-table__body tr td:nth-child(${index + 1})`)
      cellsInCol.forEach(cell => cell.classList.remove('column-highlight'))
      th.classList.remove('column-highlight')
    })
  })
}

let resizeObserver = null

onMounted(async () => {
  await fetchData()
  await nextTick()
  calcVisibleCount()
  resizeObserver = new ResizeObserver(() => calcVisibleCount())
  if (filterBarRef.value) resizeObserver.observe(filterBarRef.value)
  await nextTick()
  initColumnHighlight()
})

// keep-alive 缓存时，返回自动刷新
onActivated(async () => {
  await fetchData()
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.role-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
}
.perm-cell {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>

<!-- Global fixed-column-header styles -->
<style>
.el-table__fixed-header-wrapper,
.el-table__fixed-header-wrapper table,
.el-table__fixed-header-wrapper table thead,
.el-table__fixed-header-wrapper table tr,
.el-table__fixed-header-wrapper th,
.el-table__fixed-header-wrapper th.el-table__cell,
.el-table__fixed-header-wrapper .cell,
.el-table__fixed-right-patch,
.el-table__fixed-right-patch table,
.el-table__fixed-right-patch table thead,
.el-table__fixed-right-patch table tr,
.el-table__fixed-right-patch th,
.el-table__fixed-right-patch th.el-table__cell,
.el-table__fixed-right-patch .cell {
  background-color: #f3f4f6 !important;
}
.el-table__fixed .column-highlight,
.el-table__fixed-right .column-highlight {
  background-color: #e8f4ff !important;
}
</style>
