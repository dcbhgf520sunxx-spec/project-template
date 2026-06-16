<template>
  <div class="archive-manage">
    <!-- Left: Archive Type List -->
    <div class="type-sidebar">
      <div class="sidebar-header">档案类型</div>
      <div class="sidebar-search">
        <input v-model="typeSearch" placeholder="搜索类型名称" @input="typeSearch">
      </div>
      <div class="sidebar-list">
        <div
          v-for="t in filteredTypeList" :key="t.id"
          :class="['type-item', { active: selectedTypeId === t.id }]"
          @click="selectType(t)"
        >
          <span class="type-name" :class="{ 'type-disabled': t.status === 0 }" :title="t.name">{{ t.name }}</span>
          <span v-if="t.status === 0" class="type-status-badge">停用</span>
          <div class="type-actions" @click.stop>
            <span class="action-icon" :title="'编辑'" @click="handleEditType(t)">
              <el-icon><Edit /></el-icon>
            </span>
            <span class="action-icon" :title="t.status === 1 ? '停用' : '启用'" @click="handleToggleTypeStatus(t)">
              <el-icon v-if="t.status === 1"><RemoveFilled /></el-icon>
              <el-icon v-else><CirclePlusFilled /></el-icon>
            </span>
            <span class="action-icon" :title="'删除'" @click="handleDeleteType(t)">
              <el-icon><Delete /></el-icon>
            </span>
          </div>
        </div>
        <div v-if="filteredTypeList.length === 0" class="type-empty">无匹配类型</div>
      </div>
      <div class="sidebar-footer">
        <button class="btn btn-primary btn-sm full-width" @click="handleAddType">+ 新增类型</button>
      </div>
    </div>

    <!-- Right: Archive List -->
    <div class="archive-main">
      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-row" ref="filterBarRef" :style="{ '--filter-width': itemWidthValue + 'px' }">
          <template v-for="(f, idx) in allFilters" :key="f.key">
            <div v-if="idx < visibleCount" class="filter-item">
              <span class="filter-label">{{ f.label }}</span>
              <template v-if="f.tag === 'input'">
                <input v-model="filters[f.key]" :placeholder="f.placeholder || '请输入'" @keyup.enter="handleSearch">
              </template>
              <template v-else-if="f.tag === 'el-select'">
                <el-select v-model="filters[f.key]" v-bind="f.attrs || {}" style="width:100%">
                  <el-option v-for="opt in getOptions(f.key)" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </template>
            </div>
          </template>
          <div class="btn-group-inline">
            <button class="btn btn-outline btn-sm" @click="handleSearch">搜索</button>
            <button class="btn btn-outline btn-sm" @click="handleReset">重置</button>
          </div>
          <span class="push"></span>
          <button class="btn btn-primary btn-sm add-btn" @click="handleAddArchive">+ 新增</button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-area">
        <table class="archive-table">
          <colgroup>
            <col style="width: 60px" />
            <col style="width: 120px" />
            <col style="min-width: 150px" />
            <col style="width: 80px" />
            <col style="width: 100px" />
            <col style="width: 180px" />
            <col style="width: 220px" />
          </colgroup>
          <thead>
            <tr>
              <th>序号</th>
              <th>档案编码</th>
              <th>档案名称</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <draggable
            v-model="tableData"
            tag="tbody"
            item-key="id"
            handle=".drag-handle"
            ghost-class="sortable-ghost"
            :animation="200"
            :scroll-sensitivity="60"
            @end="onDragEnd"
          >
            <template #item="{ element: row, index }">
              <tr>
                <td class="col-index"><span class="drag-handle"></span> {{ (page - 1) * pageSize + index + 1 }}</td>
                <td class="col-code">{{ row.code }}</td>
                <td class="col-name">{{ row.name }}</td>
                <td class="col-status">
                  <span :class="['badge', row.status === 1 ? 'badge-success' : 'badge-default']">
                    {{ row.status === 1 ? '启用' : '停用' }}
                  </span>
                </td>
                <td class="col-creator">{{ row.creator_name || '-' }}</td>
                <td class="col-time">{{ row.created_at }}</td>
                <td class="col-action">
                  <div class="btn-group">
                    <button class="btn btn-primary btn-sm" @click="handleEdit(row)">编辑</button>
                    <button :class="['btn btn-sm', row.status === 1 ? 'btn-danger-outline' : 'btn-success']" @click="handleToggleStatus(row)">
                      {{ row.status === 1 ? '停用' : '启用' }}
                    </button>
                    <button class="btn btn-danger btn-sm" @click="handleDelete(row)">删除</button>
                  </div>
                </td>
              </tr>
            </template>
          </draggable>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span style="flex:1"></span>
        <div class="pg-right">
          <span class="pg-info">共 {{ tableData.length }} 条</span>
          <button class="pg-btn pg-nav" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">&lt;</button>
          <button
            v-for="pg in visiblePages" :key="pg"
            :class="['pg-btn', { active: pg === page }]"
            @click="goPage(pg)"
          >{{ pg }}</button>
          <button class="pg-btn pg-nav" :disabled="page >= totalPages" @click="page = Math.min(totalPages, page + 1)">&gt;</button>
        </div>
      </div>
    </div>

    <!-- Type Form Dialog -->
    <el-dialog v-model="typeDialogVisible" :title="typeDialogTitle" width="450px" :close-on-click-modal="false">
      <el-form :model="typeForm" :rules="typeRules" ref="typeFormRef" label-width="100px">
        <el-form-item label="编码前缀" prop="code_prefix">
          <el-input v-model="typeForm.code_prefix" placeholder="如 TT" :disabled="isEditType" maxlength="10" />
          <div class="form-tip">将作为该类型下档案编码的自动生成前缀，如 TT → TT001</div>
        </el-form-item>
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="typeForm.name" placeholder="如 问题类型" maxlength="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="typeSubmitting" @click="handleTypeSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- Archive Form Dialog -->
    <el-dialog v-model="archiveDialogVisible" :title="archiveDialogTitle" width="450px" :close-on-click-modal="false">
      <el-form :model="archiveForm" :rules="archiveRules" ref="archiveFormRef" label-width="100px">
        <el-form-item label="所属类型" prop="archive_type_id">
          <el-select v-model="archiveForm.archive_type_id" placeholder="请选择" style="width:100%" :disabled="isEditArchive">
            <el-option v-for="t in typeList.filter(x=>x.status===1)" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="档案名称" prop="name">
          <el-input v-model="archiveForm.name" placeholder="请输入档案名称" maxlength="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="archiveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="archiveSubmitting" @click="handleArchiveSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: 'ArchiveList' })
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RemoveFilled, CirclePlusFilled, Delete, Edit } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { getArchiveTypes, createArchiveType, updateArchiveType, toggleArchiveTypeStatus, deleteArchiveType, checkArchiveTypePrefix } from '../../api/archiveType'
import { getArchives, createArchive, updateArchive, toggleArchiveStatus, deleteArchive, batchUpdateSort } from '../../api/archive'
import { ElMessage, ElMessageBox } from 'element-plus'

const typeList = ref([])
const typeSearch = ref('')
const selectedTypeId = ref(null)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(20)
const filterBarRef = ref(null)
const visibleCount = ref(5)
const itemWidthValue = ref(170)
const filters = ref({ code: '', name: '', status: '' })
const archiveCounts = ref({})

// Unified filter array
const allFilters = [
  { label: '档案编码', key: 'code', tag: 'input', placeholder: '请输入' },
  { label: '档案名称', key: 'name', tag: 'input', placeholder: '请输入' },
  { label: '状态', key: 'status', tag: 'el-select', attrs: { clearable: true, placeholder: '全部' } },
]

function getOptions(key) {
  if (key === 'status') return [{ label: '启用', value: '1' }, { label: '停用', value: '0' }]
  return []
}

function calcVisibleCount() {
  if (!filterBarRef.value) return
  const container = filterBarRef.value
  const containerWidth = container.clientWidth
  if (containerWidth === 0) return

  const addBtnWidth = 56
  const gap = 12
  const totalItems = allFilters.length

  // Archive has no expand button, always use small button group
  const btnGroupWidth = 110
  const reservedWidth = btnGroupWidth + addBtnWidth + gap * 2
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
}

let resizeObserver = null

watch(selectedTypeId, () => {
  page.value = 1
  fetchArchives()
  setTimeout(() => calcVisibleCount(), 100)
})

// Type dialog
const typeDialogVisible = ref(false)
const typeDialogTitle = ref('新增档案类型')
const isEditType = ref(false)
const typeSubmitting = ref(false)
const typeFormRef = ref(null)
const typeForm = reactive({ code_prefix: '', name: '' })

const validatePrefix = async (rule, value, callback) => {
  if (!value) return callback()
  const excludeId = isEditType.value ? typeForm._id : undefined
  const { data } = await checkArchiveTypePrefix(value, excludeId)
  if (!data.data.available) callback(new Error('编码前缀已存在'))
  else callback()
}

const typeRules = {
  code_prefix: [
    { required: true, message: '请输入编码前缀', trigger: 'blur' },
    { validator: validatePrefix, trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
}

const filteredTypeList = computed(() => {
  if (!typeSearch.value) return typeList.value
  return typeList.value.filter(t => t.name.toLowerCase().includes(typeSearch.value.toLowerCase()))
})

// Archive dialog
const archiveDialogVisible = ref(false)
const archiveDialogTitle = ref('新增档案')
const isEditArchive = ref(false)
const archiveSubmitting = ref(false)
const archiveFormRef = ref(null)
const archiveForm = reactive({ archive_type_id: null, name: '' })
const archiveRules = {
  archive_type_id: [{ required: true, message: '请选择所属类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入档案名称', trigger: 'blur' }],
}

const totalPages = computed(() => Math.max(1, Math.ceil(tableData.value.length / pageSize.value)))
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return tableData.value.slice(start, start + pageSize.value)
})
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

const getArchiveCount = (typeId) => archiveCounts.value[typeId] || 0

// --- Type CRUD ---
const loadTypes = async () => {
  try {
    const { data } = await getArchiveTypes()
    typeList.value = data?.data || []
    // Load archive counts
    for (const t of typeList.value) {
      const { data: ad } = await getArchives({ archive_type_id: t.id })
      archiveCounts.value[t.id] = (ad?.data || []).length
    }
    if (!selectedTypeId.value && typeList.value.length > 0) {
      selectedTypeId.value = typeList.value[0].id
    }
  } catch (e) { ElMessage.error('获取档案类型失败') }
}

const selectType = (t) => { selectedTypeId.value = t.id; page.value = 1; fetchArchives() }

const handleAddType = () => {
  isEditType.value = false
  typeDialogTitle.value = '新增档案类型'
  Object.assign(typeForm, { code_prefix: '', name: '' })
  typeDialogVisible.value = true
}

const handleEditType = (t) => {
  isEditType.value = true
  typeDialogTitle.value = '编辑档案类型'
  Object.assign(typeForm, { code_prefix: t.code_prefix, name: t.name })
  typeForm._id = t.id
  typeDialogVisible.value = true
}

const handleTypeSubmit = async () => {
  const valid = await typeFormRef.value.validate().catch(() => false)
  if (!valid) return
  typeSubmitting.value = true
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const payload = { ...typeForm, creator_id: currentUser.id, updater_id: currentUser.id }
    if (isEditType.value) {
      await updateArchiveType(typeForm._id, payload)
      ElMessage.success('更新成功')
    } else {
      const res = await createArchiveType(payload)
      ElMessage.success(`创建成功，编码：${res.data?.data?.code || ''}`)
    }
    typeDialogVisible.value = false
    loadTypes()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || (isEditType.value ? '更新失败' : '创建失败'))
  } finally {
    typeSubmitting.value = false
  }
}

const handleToggleTypeStatus = async (t) => {
  const action = t.status === 1 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}${t.name}吗？`, `确认${action}`, { type: 'warning' })
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await toggleArchiveTypeStatus(t.id, { status: t.status === 1 ? 0 : 1, updater_id: currentUser.id })
    t.status = t.status === 1 ? 0 : 1
    ElMessage.success(`${action}成功`)
  } catch (e) { /* cancelled */ }
}

const handleDeleteType = async (t) => {
  try {
    await ElMessageBox.confirm(`确定要删除类型 ${t.name} 吗？`, '确认删除', { type: 'warning' })
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await deleteArchiveType(t.id, { updater_id: currentUser.id })
    ElMessage.success('删除成功')
    if (selectedTypeId.value === t.id) {
      selectedTypeId.value = typeList.value.find(x => x.id !== t.id)?.id || null
    }
    loadTypes()
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
  }
}

// --- Archive CRUD ---
const fetchArchives = async () => {
  if (!selectedTypeId.value) { tableData.value = []; return }
  try {
    const params = { archive_type_id: selectedTypeId.value, ...filters.value }
    if (params.status === '') delete params.status
    if (!params.code) delete params.code
    if (!params.name) delete params.name
    const { data } = await getArchives(params)
    tableData.value = (data?.data || []).sort((a, b) => a.sort_order - b.sort_order)
  } catch (e) { ElMessage.error('获取档案列表失败') }
}

const handleAddArchive = () => {
  isEditArchive.value = false
  archiveDialogTitle.value = '新增档案'
  Object.assign(archiveForm, { archive_type_id: selectedTypeId.value, name: '' })
  archiveDialogVisible.value = true
}

const handleEdit = (row) => {
  isEditArchive.value = true
  archiveDialogTitle.value = '编辑档案'
  Object.assign(archiveForm, { archive_type_id: row.archive_type_id, name: row.name })
  archiveForm._id = row.id
  archiveDialogVisible.value = true
}

const handleArchiveSubmit = async () => {
  const valid = await archiveFormRef.value.validate().catch(() => false)
  if (!valid) return
  archiveSubmitting.value = true
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const payload = { ...archiveForm, creator_id: currentUser.id, updater_id: currentUser.id }
    if (isEditArchive.value) {
      await updateArchive(archiveForm._id, payload)
      ElMessage.success('更新成功')
    } else {
      const res = await createArchive(payload)
      ElMessage.success(`创建成功，编码：${res.data?.data?.code || ''}`)
    }
    archiveDialogVisible.value = false
    fetchArchives()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || (isEditArchive.value ? '更新失败' : '创建失败'))
  } finally {
    archiveSubmitting.value = false
  }
}

const handleToggleStatus = async (row) => {
  const action = row.status === 1 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action} ${row.name} 吗？`, `确认${action}`, { type: 'warning' })
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await toggleArchiveStatus(row.id, { status: row.status === 1 ? 0 : 1, updater_id: currentUser.id })
    row.status = row.status === 1 ? 0 : 1
    ElMessage.success(`${action}成功`)
  } catch (e) { /* cancelled */ }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除档案 ${row.name} 吗？`, '确认删除', { type: 'warning' })
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await deleteArchive(row.id, { updater_id: currentUser.id })
    ElMessage.success('删除成功')
    fetchArchives()
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
  }
}

const handleSearch = () => { page.value = 1; fetchArchives() }
const handleReset = () => { filters.value = { code: '', name: '', status: '' }; handleSearch() }
const goPage = (pg) => { if (pg === '...' || pg < 1 || pg > totalPages.value) return; page.value = pg }

function onDragEnd() {
  // vuedraggable automatically updates tableData array
  // We just need to save the new order to backend
  const updates = tableData.value.map((r, idx) => ({ id: r.id, sort_order: idx + 1 }))
  batchUpdateSort({ items: updates })
    .then(() => ElMessage.success('排序已更新'))
    .catch(() => ElMessage.error('排序更新失败'))
}

onMounted(async () => {
  await loadTypes()
  await fetchArchives()
  await nextTick()
  calcVisibleCount()
  resizeObserver = new ResizeObserver(() => calcVisibleCount())
  if (filterBarRef.value) resizeObserver.observe(filterBarRef.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.archive-manage {
  height: 100%;
  display: flex;
  gap: 0;
  padding: 6px;
  box-sizing: border-box;
}

/* Left sidebar */
.type-sidebar {
  width: 220px;
  min-width: 220px;
  background: #fff;
  border-radius: 8px 0 0 8px;
  border: 1px solid #e2e8f0;
  border-right: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidebar-header {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.sidebar-search {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.sidebar-search input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.sidebar-search input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
}
.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  transition: all 0.15s;
  border-left: 3px solid transparent;
}
.type-item:hover { background: #f1f5f9; }
.type-item.active {
  background: #eff6ff;
  color: #3b82f6;
  font-weight: 600;
  border-left-color: #3b82f6;
}
.type-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.type-disabled { color: #94a3b8; }
.type-status-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #94a3b8;
  margin-left: 6px;
  flex-shrink: 0;
}
.type-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.type-item:hover .type-actions { opacity: 1; }
.type-item.active .type-actions { opacity: 1; }
.action-icon {
  cursor: pointer;
  color: #94a3b8;
  font-size: 14px;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s;
}
.action-icon:hover { color: #3b82f6; background: #e0f2fe; }
.sidebar-footer {
  height: 40px;
  padding: 0 12px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.type-empty {
  padding: 12px 16px;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}

/* Right main area */
.archive-main {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 0 8px 8px 0;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.archive-main .pagination {
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* Archive-specific table */
.table-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.archive-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.archive-table thead th {
  background: #f3f4f6;
  font-weight: 500;
  font-size: 13px;
  color: #374151;
  padding: 10px 12px;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #e5e7eb;
}
.archive-table tbody tr {
  transition: background-color 0.15s;
}
.archive-table tbody tr:hover {
  background-color: #e8f4ff !important;
}
.archive-table tbody tr:nth-child(even) {
  background-color: #f8fafc;
}
.archive-table tbody td {
  font-size: 13px;
  color: #1f2937;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.archive-table .col-index { text-align: center; }
.archive-table .col-name,
.archive-table .col-code,
.archive-table .col-creator,
.archive-table .col-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sortable-ghost {
  opacity: 0.3;
  display: table-row;
}
.sortable-chosen {
  display: table-row;
  background-color: #fff !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
.drag-handle {
  cursor: grab;
  user-select: none;
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
  color: #94a3b8;
  font-size: 14px;
}
.drag-handle::before {
  content: '☰';
}
.drag-handle:active {
  cursor: grabbing;
}

.full-width { width: 100%; }
.form-tip { font-size: 12px; color: #94a3b8; margin-top: 4px; line-height: 1.4; }
</style>
