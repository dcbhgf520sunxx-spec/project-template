<template>
  <div class="workorder-list">
    <div class="table-box">
      <!-- Quick View Tabs -->
      <div class="view-tabs">
        <span :class="['tab-item', { active: viewType === 'all' }]" @click="switchView('all')">全部</span>
        <span :class="['tab-item', { active: viewType === 'mine' }]" @click="switchView('mine')">我的工单</span>
        <span class="tab-divider"></span>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-row" ref="filterBarRef" :style="{ '--filter-width': itemWidthValue + 'px' }">
          <template v-for="(f, idx) in activeFilters" :key="f.key">
            <div v-if="idx < visibleCount" class="filter-item" :class="{ 'double-width': f.attrs?.type === 'daterange' || f.doubleWidth }">
              <span class="filter-label">{{ f.label }}</span>
              <template v-if="f.tag === 'input'">
                <input v-model="filters[f.key]" :placeholder="f.placeholder || '请输入'" @keyup.enter="handleSearch">
              </template>
              <template v-else-if="f.tag === 'el-select'">
                <el-select v-model="filters[f.key]" v-bind="f.attrs || {}" style="width:100%">
                  <el-option v-for="opt in getOptions(f.key)" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </template>
              <template v-else-if="f.tag === 'el-date-picker'">
                <el-date-picker v-model="filters[f.key]" v-bind="f.attrs || {}" style="width:100%" />
              </template>
            </div>
          </template>
          <div class="btn-group-inline">
            <button class="btn btn-outline btn-sm" @click="handleSearch">搜索</button>
            <button class="btn btn-outline btn-sm" @click="handleReset">重置</button>
            <button class="btn btn-outline btn-sm" @click="expanded = !expanded">
              {{ expanded ? '收起' : '展开' }} ▾
            </button>
          </div>
          <span class="push"></span>
          <button class="btn btn-primary btn-sm add-btn" @click="$router.push('/work-orders/add')">+ 新增</button>
        </div>
        <div class="filter-row-extra" v-show="expanded && activeFilters.length > visibleCount" :style="{ '--filter-width': itemWidthValue + 'px' }">
          <template v-for="(f, idx) in activeFilters" :key="'extra-' + f.key">
            <div v-if="idx >= visibleCount" class="filter-item" :class="{ 'double-width': f.attrs?.type === 'daterange' || f.doubleWidth }">
              <span class="filter-label">{{ f.label }}</span>
              <template v-if="f.tag === 'input'">
                <input v-model="filters[f.key]" :placeholder="f.placeholder || '请输入'" @keyup.enter="handleSearch">
              </template>
              <template v-else-if="f.tag === 'el-select'">
                <el-select v-model="filters[f.key]" v-bind="f.attrs || {}" style="width:100%">
                  <el-option v-for="opt in getOptions(f.key)" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </template>
              <template v-else-if="f.tag === 'el-date-picker'">
                <el-date-picker v-model="filters[f.key]" v-bind="f.attrs || {}" style="width:100%" />
              </template>
            </div>
          </template>
        </div>
      </div>

      <!-- Table -->
      <div class="table-area">
        <el-table ref="tableRef" :data="tableData" stripe resizable border style="width:100%;height:100%"
          :header-cell-style="{ background: '#f3f4f6', fontWeight: '500', fontSize: '13px', color: '#374151' }"
          @selection-change="onSelectionChange">
          <el-table-column type="selection" width="40" fixed />
          <el-table-column label="序号" width="60" fixed align="center">
            <template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="问题描述" prop="problem_desc" min-width="240" fixed :show-overflow-tooltip="false">
            <template #header>
              <span class="sortable-header" @click="toggleSort('problem_desc')">
                问题描述 <span :class="['sort-icon', { active: isSortActive('problem_desc') }]">{{ getSortIcon('problem_desc') }}</span>
              </span>
            </template>
            <template #default="{ row }">
              <div class="desc-cell">
                <span class="link" :title="row.problem_desc || '-'" @click="goDetail(row.id)">{{ row.problem_desc || '-' }}</span>
                <span v-if="row.is_overdue === 1" class="overdue-badge">延期{{ calcOverdueDays(row.expected_resolve_date) }}天</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="问题类型" prop="problem_type" width="100" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('problem_type')">
                问题类型 <span :class="['sort-icon', { active: isSortActive('problem_type') }]">{{ getSortIcon('problem_type') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ problemTypeText(row.problem_type) }}</template>
          </el-table-column>
          <el-table-column label="跟进人" prop="follower_name" width="80" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('follower_name')">
                跟进人 <span :class="['sort-icon', { active: isSortActive('follower_name') }]">{{ getSortIcon('follower_name') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ row.follower_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="紧急程度" prop="urgency" width="70">
            <template #header>
              <span class="sortable-header" @click="toggleSort('urgency')">
                紧急程度 <span :class="['sort-icon', { active: isSortActive('urgency') }]">{{ getSortIcon('urgency') }}</span>
              </span>
            </template>
            <template #default="{ row }">
              <span :class="['priority-opt', urgencyClass(row.urgency)]">{{ urgencyText(row.urgency) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="status" width="80">
            <template #header>
              <span class="sortable-header" @click="toggleSort('status')">
                状态 <span :class="['sort-icon', { active: isSortActive('status') }]">{{ getSortIcon('status') }}</span>
              </span>
            </template>
            <template #default="{ row }">
              <span :class="['badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="提出人" prop="submitter_name" width="80" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('submitter_name')">
                提出人 <span :class="['sort-icon', { active: isSortActive('submitter_name') }]">{{ getSortIcon('submitter_name') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ row.submitter_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="提出时间" prop="submit_time" width="130" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('submit_time')">
                提出时间 <span :class="['sort-icon', { active: isSortActive('submit_time') }]">{{ getSortIcon('submit_time') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ formatDate(row.submit_time) }}</template>
          </el-table-column>
          <el-table-column label="预计完成时间" prop="expected_resolve_date" width="130" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('expected_resolve_date')">
                预计完成时间 <span :class="['sort-icon', { active: isSortActive('expected_resolve_date') }]">{{ getSortIcon('expected_resolve_date') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ formatDate(row.expected_resolve_date) }}</template>
          </el-table-column>
          <el-table-column label="创建人" prop="creator_name" width="80" resizable>
            <template #header>
              <span class="sortable-header" @click="toggleSort('creator_name')">
                创建人 <span :class="['sort-icon', { active: isSortActive('creator_name') }]">{{ getSortIcon('creator_name') }}</span>
              </span>
            </template>
            <template #default="{ row }">{{ row.creator_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" prop="created_at" width="150" resizable>
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
                <button class="btn btn-primary btn-sm" @click="$router.push(`/work-orders/edit/${row.id}`)">编辑</button>
                <button class="btn btn-outline btn-sm" @click="handleStatusChange(row)">状态变更</button>
                <el-dropdown trigger="click" @command="cmd => handleMore(cmd, row)">
                  <button class="btn btn-outline btn-sm">更多</button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="copy">复制</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <div class="batch-actions">
          <el-popover trigger="click" placement="top-start" :width="200" v-model:visible="assignPopoverVisible">
            <template #reference>
              <button class="btn btn-primary btn-sm">
                批量指派 <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </button>
            </template>
            <div class="assign-dropdown">
              <div class="assign-search">
                <input v-model="assignSearch" placeholder="搜索姓名" @click.stop>
              </div>
              <div class="assign-list">
                <div v-for="u in filteredUsers" :key="u.id" class="assign-item" @click="handleBatchAssign(u)">{{ u.real_name }}</div>
                <div v-if="filteredUsers.length === 0" class="assign-empty">无匹配人员</div>
              </div>
            </div>
          </el-popover>
          <button class="btn btn-outline btn-sm" @click="handleBatchStatus">批量状态变更</button>
          <button class="btn btn-danger-outline btn-sm" @click="handleBatchDelete">批量删除</button>
        </div>
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

    <!-- Change Status Dialog -->
    <el-dialog v-model="statusVisible" title="状态变更" width="400px" :close-on-click-modal="false">
      <el-form :model="statusForm" ref="statusFormRef" label-width="auto" class="status-form">
        <el-form-item label="当前状态">
          <span class="badge" :class="statusClass(currentRow?.status)">{{ statusText(currentRow?.status) }}</span>
        </el-form-item>
        <el-form-item label="目标状态" prop="newStatus" :rules="[{ required: true, message: '请选择目标状态', trigger: 'change' }]">
          <el-select v-model="statusForm.newStatus" placeholder="请选择" style="width:100%">
            <el-option v-for="opt in availableStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="statusForm.newStatus === 2" label="实际修复时间" prop="resolve_date" :rules="[{ required: true, message: '请选择实际修复时间', trigger: 'change' }]">
          <el-date-picker v-model="statusForm.resolve_date" type="date" placeholder="请选择" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="statusForm.newStatus === 3" label="关闭时间" prop="close_date" :rules="[{ required: true, message: '请选择关闭时间', trigger: 'change' }]">
          <el-date-picker v-model="statusForm.close_date" type="date" placeholder="请选择" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="statusForm.newStatus === 2" label="处置结果" prop="result_desc" :rules="[{ required: true, message: '请输入处置结果', trigger: 'blur' }]">
          <el-input v-model="statusForm.result_desc" type="textarea" :rows="3" placeholder="请输入处置结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible = false">取消</el-button>
        <el-button type="primary" :loading="statusLoading" @click="handleConfirmStatus">确定</el-button>
      </template>
    </el-dialog>

    <!-- Batch Status Change Dialog -->
    <el-dialog v-model="batchStatusVisible" title="批量状态变更" width="400px" :close-on-click-modal="false">
      <div v-if="batchSameStatus === false" class="batch-status-warning">
        <el-icon color="#e6a23c" :size="20"><WarningFilled /></el-icon>
        <span>选中的工单状态不一致，无法批量变更</span>
      </div>
      <el-form v-else :model="batchStatusForm" ref="batchStatusFormRef" label-width="120px" class="status-form">
        <el-form-item label="当前状态">
          <span class="badge" :class="statusClass(batchCurrentStatus)">{{ statusText(batchCurrentStatus) }}</span>
          <span class="batch-count">（共 {{ selectedRows.length }} 项）</span>
        </el-form-item>
        <el-form-item label="目标状态" prop="newStatus" :rules="[{ required: true, message: '请选择目标状态', trigger: 'change' }]">
          <el-select v-model="batchStatusForm.newStatus" placeholder="请选择" style="width:100%">
            <el-option v-for="opt in batchStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="batchStatusForm.newStatus === 2" label="实际修复时间" prop="resolve_date" :rules="[{ required: true, message: '请选择实际修复时间', trigger: 'change' }]">
          <el-date-picker v-model="batchStatusForm.resolve_date" type="date" placeholder="请选择" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="batchStatusForm.newStatus === 3" label="关闭时间" prop="close_date" :rules="[{ required: true, message: '请选择关闭时间', trigger: 'change' }]">
          <el-date-picker v-model="batchStatusForm.close_date" type="date" placeholder="请选择" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="batchStatusForm.newStatus === 2" label="处置结果" prop="result_desc" :rules="[{ required: true, message: '请输入处置结果', trigger: 'blur' }]">
          <el-input v-model="batchStatusForm.result_desc" type="textarea" :rows="3" placeholder="请输入处置结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchStatusVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchStatusLoading" :disabled="batchSameStatus === false" @click="handleConfirmBatchStatus">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: 'WorkOrderList' })
import { ref, reactive, computed, onMounted, onActivated, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, WarningFilled } from '@element-plus/icons-vue'
import { getWorkOrders, deleteWorkOrder, toggleWorkOrderStatus, updateWorkOrder } from '../../api/workOrder'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const expanded = ref(false)
const filterBarRef = ref(null)
const tableRef = ref(null)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const jumpPage = ref('')
const users = ref([])
const visibleCount = ref(5)
const itemWidthValue = ref(170)
const viewType = ref('mine')

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

const selectedRows = ref([])
const assignSearch = ref('')
const assignPopoverVisible = ref(false)
const filteredUsers = computed(() => {
  if (!assignSearch.value) return users.value
  return users.value.filter(u => u.real_name.toLowerCase().includes(assignSearch.value.toLowerCase()))
})

const batchStatusVisible = ref(false)
const batchStatusLoading = ref(false)
const batchStatusFormRef = ref(null)
const batchStatusForm = reactive({ newStatus: '', resolve_date: '', close_date: '', result_desc: '' })

const filters = ref({
  problem_desc: '', problem_type: '', urgency: '', status: '', is_overdue: '',
  follower_id: '', submitter_name: '', submit_time_range: null,
  expected_resolve_date_range: null,
})

// Unified filter array
const allFilters = [
  { label: '问题描述', key: 'problem_desc', tag: 'input', placeholder: '请输入', doubleWidth: true },
  { label: '问题类型', key: 'problem_type', tag: 'el-select', attrs: { clearable: true, placeholder: '全部' } },
  { label: '紧急程度', key: 'urgency', tag: 'el-select', attrs: { clearable: true, placeholder: '全部' } },
  { label: '状态', key: 'status', tag: 'el-select', attrs: { clearable: true, placeholder: '全部' } },
  { label: '逾期', key: 'is_overdue', tag: 'el-select', attrs: { clearable: true, placeholder: '全部' } },
  { label: '跟进人', key: 'follower_id', tag: 'el-select', attrs: { clearable: true, placeholder: '全部' }, tabOnly: true },
  { label: '提出人', key: 'submitter_name', tag: 'input', placeholder: '请输入' },
  { label: '提出时间', key: 'submit_time_range', tag: 'el-date-picker', attrs: { type: 'daterange', rangeSeparator: '至', startPlaceholder: '开始日期', endPlaceholder: '结束日期', 'value-format': 'YYYY-MM-DD' } },
  { label: '预计完成时间', key: 'expected_resolve_date_range', tag: 'el-date-picker', attrs: { type: 'daterange', rangeSeparator: '至', startPlaceholder: '开始日期', endPlaceholder: '结束日期', 'value-format': 'YYYY-MM-DD' } },
]

// Filtered by tab
const activeFilters = computed(() => {
  if (viewType.value === 'all') return allFilters
  return allFilters.filter(f => !f.tabOnly)
})

function getOptions(key) {
  if (key === 'problem_type') return [
    { label: '日常操作', value: '1' }, { label: '系统优化', value: '2' },
    { label: '故障报障', value: '3' }, { label: '后台维护', value: '4' }, { label: '其他', value: '5' }
  ]
  if (key === 'urgency') return [{ label: '低', value: '0' }, { label: '中', value: '1' }, { label: '高', value: '2' }]
  if (key === 'status') return [
    { label: '待处理', value: '0' }, { label: '处理中', value: '1' },
    { label: '已完成', value: '2' }, { label: '已关闭', value: '3' }
  ]
  if (key === 'is_overdue') return [{ label: '未逾期', value: '0' }, { label: '逾期', value: '1' }]
  if (key === 'follower_id') return users.value.map(u => ({ label: u.employee_no + '·' + u.real_name, value: u.id }))
  return []
}

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

const statusText = (s) => ({ 0: '待处理', 1: '处理中', 2: '已完成', 3: '已关闭' }[s] ?? '-')
const statusClass = (s) => ({ 0: 'badge-info', 1: 'badge-success', 2: 'badge-default', 3: 'badge-warning' }[s] ?? 'badge-default')
const problemTypeText = (id) => ({ 1: '日常操作', 2: '系统优化', 3: '故障报障', 4: '后台维护', 5: '其他' }[id] ?? '-')
const urgencyText = (u) => ({ 0: '低', 1: '中', 2: '高' }[u] ?? '-')
const urgencyClass = (u) => ({ 0: 'badge-low', 1: 'badge-medium', 2: 'badge-high' }[u] ?? 'badge-default')
const formatDateTime = (dt) => dt ? dt.replace('T', ' ').slice(0, 16) : '-'
const formatDate = (dt) => dt ? dt.slice(0, 10) : '-'
const calcOverdueDays = (date) => {
  if (!date) return 0
  const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

const statusVisible = ref(false)
const statusLoading = ref(false)
const statusFormRef = ref(null)
const currentRow = ref(null)
const statusForm = reactive({ newStatus: '', resolve_date: '', close_date: '', result_desc: '' })

const allStatusOptions = [
  { label: '待处理', value: 0 }, { label: '处理中', value: 1 },
  { label: '已完成', value: 2 }, { label: '已关闭', value: 3 },
]

// 状态流转规则
const STATUS_TRANSITIONS = {
  0: [1, 3],       // 待处理 → 处理中、已关闭
  1: [2, 3],       // 处理中 → 已完成、已关闭
  2: [3],          // 已完成 → 已关闭
  3: [],           // 已关闭 → 无
}

const availableStatusOptions = computed(() => {
  if (!currentRow.value) return []
  const currentStatus = currentRow.value.status
  const allowed = STATUS_TRANSITIONS[currentStatus] || []
  return allStatusOptions.filter(opt => allowed.includes(opt.value))
})

// 批量状态变更：检查选中项是否全部为同一状态
const batchSameStatus = computed(() => {
  if (selectedRows.value.length === 0) return true
  const statuses = [...new Set(selectedRows.value.map(r => r.status))]
  return statuses.length === 1
})

// 批量状态变更：选中项的当前状态
const batchCurrentStatus = computed(() => {
  if (!batchSameStatus.value || selectedRows.value.length === 0) return null
  return selectedRows.value[0].status
})

// 批量状态变更：根据当前状态过滤可选的目标状态
const batchStatusOptions = computed(() => {
  if (!batchSameStatus.value || batchCurrentStatus.value === null) return []
  const currentStatus = batchCurrentStatus.value
  const allowed = STATUS_TRANSITIONS[currentStatus] || []
  return allStatusOptions.filter(opt => allowed.includes(opt.value))
})

const fetchData = async () => {
  try {
    const params = { ...filters.value }
    if (params.status === '') delete params.status
    if (params.is_overdue === '') delete params.is_overdue
    if (params.urgency === '') delete params.urgency
    if (params.problem_type === '') delete params.problem_type
    if (!params.problem_desc) delete params.problem_desc
    if (!params.submitter_name) delete params.submitter_name
    if (!params.follower_id) delete params.follower_id

    // Tab filtering: "我的工单" = 跟进人为当前用户
    if (viewType.value === 'mine') {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      params.follower_id = currentUser.id
    } else {
      // "全部"视图：清除跟进人筛选
      delete params.follower_id
    }

    // Date range handling
    if (params.submit_time_range && params.submit_time_range.length === 2) {
      params.submit_time_from = params.submit_time_range[0]
      params.submit_time_to = params.submit_time_range[1]
    }
    delete params.submit_time_range

    if (params.expected_resolve_date_range && params.expected_resolve_date_range.length === 2) {
      params.expected_resolve_date_from = params.expected_resolve_date_range[0]
      params.expected_resolve_date_to = params.expected_resolve_date_range[1]
    }
    delete params.expected_resolve_date_range

    // 排序参数传给后端
    if (sortState.field && sortState.order) {
      params.sort_field = sortState.field
      params.sort_order = sortState.order
    }

    const res = await getWorkOrders(params)
    const list = res.data?.data || []
    total.value = list.length

    const start = (page.value - 1) * pageSize.value
    tableData.value = list.slice(start, start + pageSize.value)
    // Clear selection after data refresh
    nextTick(() => tableRef.value?.clearSelection())
  } catch (e) {
    ElMessage.error('获取工单列表失败')
  }
}

const handleSearch = () => { page.value = 1; fetchData() }
const handleReset = () => {
  sortState.field = null
  sortState.order = null
  filters.value = {
    problem_desc: '', problem_type: '', urgency: '', status: '', is_overdue: '',
    follower_id: '', submitter_name: '', submit_time_range: null,
    expected_resolve_date_range: null,
  }
  handleSearch()
}
const switchView = (type) => {
  sortState.field = null
  sortState.order = null
  viewType.value = type
  page.value = 1
  setTimeout(() => calcVisibleCount(), 100)
  fetchData()
}
const goDetail = (id) => {
  const listParams = { ...filters.value, viewType: viewType.value, sort_field: sortState.field, sort_order: sortState.order }
  if (viewType.value === 'mine') {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    listParams.follower_id = currentUser.id
  }
  sessionStorage.setItem('workOrderListFilters', JSON.stringify(listParams))
  router.push(`/work-orders/detail/${id}`)
}
const goPage = (pg) => { if (pg === '...' || pg < 1 || pg > totalPages.value) return; page.value = pg; fetchData() }
const onPageSizeChange = () => { page.value = 1; fetchData() }
const onJump = () => {
  const p = parseInt(jumpPage.value)
  if (!isNaN(p) && p >= 1 && p <= totalPages.value) { page.value = p; fetchData() }
  jumpPage.value = ''
}

const handleMore = (cmd, row) => {
  if (cmd === 'copy') router.push(`/work-orders/copy/${row.id}`)
  else if (cmd === 'delete') handleDelete(row)
}

const handleDelete = async (row) => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await ElMessageBox.confirm(`确定要删除此工单吗？`, '确认删除', { type: 'warning' })
    await deleteWorkOrder(row.id, { updater_id: currentUser.id })
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
  }
}

const handleStatusChange = (row) => {
  currentRow.value = row
  statusForm.newStatus = ''
  statusForm.resolve_date = ''
  statusForm.close_date = ''
  statusForm.result_desc = ''
  statusVisible.value = true
}

const handleConfirmStatus = async () => {
  const valid = await statusFormRef.value.validate().catch(() => false)
  if (!valid) return
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const statusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已关闭' }
  statusLoading.value = true
  try {
    const payload = {
      status: Number(statusForm.newStatus),
      updater_id: currentUser.id,
    }
    if (statusForm.newStatus === 2) {
      payload.resolve_date = statusForm.resolve_date || null
    }
    if (statusForm.newStatus === 3) {
      payload.close_date = statusForm.close_date || null
    }
    if (statusForm.newStatus === 2) {
      payload.result_desc = statusForm.result_desc || null
    }
    await toggleWorkOrderStatus(currentRow.value.id, payload)
    currentRow.value.status = Number(statusForm.newStatus)

    const expectedDate = currentRow.value.expected_resolve_date
    const today = new Date().toISOString().slice(0, 10)
    currentRow.value.is_overdue = (expectedDate && expectedDate < today && currentRow.value.status !== 2 && currentRow.value.status !== 3) ? 1 : 0

    if (statusForm.newStatus === 2) {
      currentRow.value.resolve_date = statusForm.resolve_date
    }
    if (statusForm.newStatus === 3) {
      currentRow.value.close_date = statusForm.close_date
    }
    if (statusForm.newStatus === 2) {
      currentRow.value.result_desc = statusForm.result_desc
    }
    ElMessage.success(`状态已更新为"${statusMap[Number(statusForm.newStatus)]}"`)
    statusVisible.value = false
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
    else ElMessage.error('状态更新失败')
  } finally {
    statusLoading.value = false
  }
}

// --- Batch Operations ---
const onSelectionChange = (rows) => { selectedRows.value = rows }

const handleBatchAssign = async (user) => {
  if (selectedRows.value.length === 0) { ElMessage.warning('请先勾选要操作的工单'); return }
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRows.value.length} 项工单指派给 ${user.real_name} 吗？`,
      '确认批量指派',
      { type: 'warning' }
    )
    assignPopoverVisible.value = false
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await Promise.all(selectedRows.value.map(row =>
      updateWorkOrder(row.id, { follower_id: user.id, updater_id: currentUser.id })
    ))
    ElMessage.success(`成功指派 ${selectedRows.value.length} 项工单给 ${user.real_name}`)
    selectedRows.value = []
    assignSearch.value = ''
    fetchData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('批量指派失败')
  }
}

const handleBatchStatus = () => {
  if (selectedRows.value.length === 0) { ElMessage.warning('请先勾选要操作的工单'); return }
  batchStatusForm.newStatus = ''
  batchStatusForm.resolve_date = ''
  batchStatusForm.close_date = ''
  batchStatusForm.result_desc = ''
  batchStatusVisible.value = true
}

const handleConfirmBatchStatus = async () => {
  const valid = await batchStatusFormRef.value.validate().catch(() => false)
  if (!valid) return
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const statusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已关闭' }
  batchStatusLoading.value = true
  try {
    const payload = {
      status: Number(batchStatusForm.newStatus),
      updater_id: currentUser.id,
    }
    if (batchStatusForm.newStatus === 2) {
      payload.resolve_date = batchStatusForm.resolve_date || null
    }
    if (batchStatusForm.newStatus === 3) {
      payload.close_date = batchStatusForm.close_date || null
    }
    if (batchStatusForm.newStatus === 2) {
      payload.result_desc = batchStatusForm.result_desc || null
    }
    await Promise.all(selectedRows.value.map(row => toggleWorkOrderStatus(row.id, payload)))
    ElMessage.success(`成功变更 ${selectedRows.value.length} 项工单状态`)
    selectedRows.value = []
    batchStatusVisible.value = false
    fetchData()
  } catch (e) {
    ElMessage.error('批量状态变更失败')
  } finally {
    batchStatusLoading.value = false
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) { ElMessage.warning('请先勾选要操作的工单'); return }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 项工单吗？`, '确认批量删除', { type: 'warning' })
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await Promise.all(selectedRows.value.map(row => deleteWorkOrder(row.id, { updater_id: currentUser.id })))
    ElMessage.success(`成功删除 ${selectedRows.value.length} 项工单`)
    selectedRows.value = []
    fetchData()
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
  }
}

// Calculate visible count for filter bar
function calcVisibleCount() {
  if (!filterBarRef.value) return
  const container = filterBarRef.value
  const containerWidth = container.clientWidth
  if (containerWidth === 0) return

  const addBtnWidth = 56
  const gap = 12
  const totalItems = activeFilters.value.length

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
      const f = activeFilters.value[i]
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
      const f = activeFilters.value[i]
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
      const f = activeFilters.value[i]
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
  const tableEl = document.querySelector('.workorder-list .el-table')
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

/** 从路由参数初始化筛选条件（用于 deep link，首页跳转等） */
const applyRouteQuery = () => {
  const q = route.query
  // _t 是 dashboard 加的时间戳，用于强制触发导航
  if (!q.viewType && !q.status && !q.is_overdue && !q.follower_id && !q.problem_desc && !q._t) return false

  // dashboard 跳过来的（带 _t），先清空所有筛选条件
  if (q._t) {
    filters.value = { problem_desc: '', problem_type: '', urgency: '', status: '', is_overdue: '', follower_id: '', submitter_name: '', submit_time_range: null, expected_resolve_date_range: null }
    page.value = 1
  }

  if (q.viewType) viewType.value = q.viewType
  if (q.follower_id && !q.viewType) { filters.value.follower_id = q.follower_id }
  if (q.status !== undefined) filters.value.status = q.status
  if (q.is_overdue !== undefined) filters.value.is_overdue = q.is_overdue
  if (q.problem_desc) filters.value.problem_desc = q.problem_desc
  return true
}

let resizeObserver = null

onMounted(async () => {
  applyRouteQuery()

  // Restore filters from sessionStorage (keep-alive cache)
  try {
    const cached = JSON.parse(sessionStorage.getItem('workOrderListFilters') || '{}')
    if (Object.keys(cached).length > 0) {
      const restoreKeys = ['problem_desc', 'problem_type', 'urgency', 'status', 'is_overdue', 'follower_id', 'submitter_name', 'submit_time_range', 'expected_resolve_date_range']
      for (const key of restoreKeys) {
        if (cached[key] !== undefined) filters.value[key] = cached[key]
      }
      if (cached.viewType) viewType.value = cached.viewType
      sessionStorage.removeItem('workOrderListFilters')
    }
  } catch (e) { /* ignore */ }

  await loadData()
  await fetchData()
  await nextTick()
  calcVisibleCount()
  resizeObserver = new ResizeObserver(() => calcVisibleCount())
  if (filterBarRef.value) resizeObserver.observe(filterBarRef.value)
  await nextTick()
  initColumnHighlight()
})

onActivated(async () => {
  // 从 dashboard 跳转过来的 deep link，应用路由参数
  const hasRouteQuery = applyRouteQuery()

  // 不再从 sessionStorage 恢复筛选条件（会导致 tab 切换后数据不正确）
  await fetchData()
  await nextTick()
  calcVisibleCount()
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

watch(viewType, () => {
  setTimeout(() => calcVisibleCount(), 100)
})

async function loadData() {
  // Load users
  try {
    const { getUsers } = await import('../../api/user')
    const { data } = await getUsers()
    users.value = (data?.data || []).filter(u => u.status === 1)
  } catch (e) { /* ignore */ }
}
</script>

<style scoped>
.workorder-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
}

/* WorkOrder-specific badges */
.badge-low { background: #dbeafe; color: #2563eb; }
.badge-medium { background: #fef3c7; color: #d97706; }
.badge-high { background: #fee2e2; color: #dc2626; }

.priority-opt {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.priority-high { background: #fee2e2; color: #dc2626; }
.priority-medium { background: #fef3c7; color: #d97706; }
.priority-low { background: #dbeafe; color: #2563eb; }

/* WorkOrder-specific pagination with batch actions */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Batch assign dropdown */
.assign-dropdown { max-width: 200px; }
.assign-search { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
.assign-search input {
  width: 100%;
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.assign-search input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.assign-list { max-height: 240px; overflow-y: auto; }
.assign-item {
  padding: 6px 12px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.assign-item:hover { background: #eff6ff; color: #3b82f6; }
.assign-empty {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

/* 批量状态变更 */
.batch-status-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fef3c7;
  border-radius: 8px;
  color: #92400e;
  font-size: 14px;
}
.batch-count {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 4px;
}
</style>

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
