<template>
  <div class="workorder-detail-page" v-loading="loading">
    <div class="detail-body">
      <!-- 基本信息 -->
      <div class="section-title">基本信息</div>
      <el-row :gutter="16">
        <el-col :span="24">
          <div class="info-card">
            <div class="info-label">问题描述</div>
            <div class="info-value info-value-multiline">{{ workOrder.problem_desc || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">问题类型</div>
            <div class="info-value">{{ problemTypeText(workOrder.problem_type) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">紧急程度</div>
            <div class="info-value">
              <span :class="['badge', urgencyClass(workOrder.urgency)]">{{ urgencyText(workOrder.urgency) }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">状态</div>
            <div class="info-value">
              <span :class="['badge', statusClass(workOrder.status)]">{{ statusText(workOrder.status) }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">逾期</div>
            <div class="info-value">
              <span v-if="workOrder.status !== 2 && workOrder.status !== 3">
                <span v-if="workOrder.is_overdue === 1" class="badge badge-danger">延期{{ calcOverdueDays(workOrder.expected_resolve_date) }}天</span>
                <span v-else class="badge badge-default">未逾期</span>
              </span>
              <span v-else class="badge badge-default">-</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">跟进人</div>
            <div class="info-value">{{ workOrder.follower_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">提出人</div>
            <div class="info-value">{{ workOrder.submitter_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">提出组织</div>
            <div class="info-value">{{ workOrder.submitter_dept || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">提出时间</div>
            <div class="info-value">{{ formatDate(workOrder.submit_time) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">预计完成时间</div>
            <div class="info-value">{{ formatDate(workOrder.expected_resolve_date) }}</div>
          </div>
        </el-col>
        <el-col :span="6" v-if="workOrder.status === 2">
          <div class="info-card">
            <div class="info-label">实际修复时间</div>
            <div class="info-value">{{ formatDate(workOrder.resolve_date) }}</div>
          </div>
        </el-col>
        <el-col :span="6" v-if="workOrder.status === 3">
          <div class="info-card">
            <div class="info-label">关闭时间</div>
            <div class="info-value">{{ formatDate(workOrder.close_date) }}</div>
          </div>
        </el-col>
        <el-col :span="24" v-if="workOrder.status === 2">
          <div class="info-card">
            <div class="info-label">处置结果</div>
            <div class="info-value info-value-multiline">{{ workOrder.result_desc || '-' }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 历史记录 -->
      <div class="section-title history-title" style="margin-top: 24px">
        历史记录
        <span class="history-toggle-all" @click="toggleAllHistory" v-if="history.length > 1">
          <el-icon :size="14"><Minus v-if="allExpanded" /><Plus v-else /></el-icon>
        </span>
      </div>
      <div class="history-list">
        <template v-if="history.length === 0">
          <div class="history-empty">暂无记录</div>
        </template>
        <template v-else>
          <div v-for="(item, idx) in history" :key="idx">
            <div class="history-row">
              <div class="history-node">
                <div class="node-circle" :class="{ 'is-latest': idx === 0 }">
                  <span v-if="idx === 0" class="node-check">✓</span>
                  <span v-else class="node-num">{{ history.length - idx }}</span>
                </div>
              </div>
              <div class="history-text">
                <span class="ht-time">{{ item.time }}</span>，由 <b>{{ item.user }}</b> {{ item.title }}。
                <span v-if="item.details && item.details.length" class="ht-expand" @click="item._expanded = !item._expanded">
                  {{ item._expanded ? '－' : '＋' }}
                </span>
              </div>
            </div>
            <div v-if="item._expanded && item.details && item.details.length" class="history-details">
              <div v-for="(d, di) in item.details" :key="di" class="detail-line">
                修改了 <b class="detail-field">{{ d.field }}</b>，旧值为 "{{ d.oldVal || '空' }}"，新值为 "{{ d.newVal || '空' }}"。
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 单据信息 -->
      <div class="section-title" style="margin-top: 24px">单据信息</div>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">创建人</div>
            <div class="info-value">{{ workOrder.creator_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ workOrder.created_at || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">更新人</div>
            <div class="info-value">{{ workOrder.updater_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">更新时间</div>
            <div class="info-value">{{ workOrder.updated_at || '-' }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="detail-footer">
      <el-button @click="$router.back()">返回</el-button>
      <el-button type="primary" @click="$router.push(`/work-orders/edit/${route.params.id}`)">编辑</el-button>
      <el-button @click="handleStatusChange">状态变更</el-button>
      <el-button type="danger" @click="handleDelete">删除</el-button>
    </div>

    <!-- Change Status Dialog -->
    <el-dialog v-model="statusVisible" title="状态变更" width="400px" :close-on-click-modal="false">
      <el-form :model="statusForm" ref="statusFormRef" label-width="auto" class="status-form">
        <el-form-item label="当前状态">
          <span class="badge" :class="statusClass(workOrder.status)">{{ statusText(workOrder.status) }}</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorkOrder, getWorkOrderHistory, toggleWorkOrderStatus, deleteWorkOrder } from '../../api/workOrder'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Minus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const workOrder = ref({})
const history = ref([])
const allExpanded = ref(false)

const statusVisible = ref(false)
const statusLoading = ref(false)
const statusFormRef = ref(null)
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
  const currentStatus = workOrder.value.status
  const allowed = STATUS_TRANSITIONS[currentStatus] || []
  return allStatusOptions.filter(opt => allowed.includes(opt.value))
})

const toggleAllHistory = () => {
  allExpanded.value = !allExpanded.value
  history.value.forEach(h => h._expanded = allExpanded.value)
}

const statusText = (s) => ({ 0: '待处理', 1: '处理中', 2: '已完成', 3: '已关闭' }[s] ?? '-')
const statusClass = (s) => ({ 0: 'badge-info', 1: 'badge-success', 2: 'badge-default', 3: 'badge-warning' }[s] ?? 'badge-default')
const problemTypeText = (id) => ({ 1: '日常操作', 2: '系统优化', 3: '故障报障', 4: '后台维护', 5: '其他' }[id] ?? '-')
const urgencyText = (u) => ({ 0: '低', 1: '中', 2: '高' }[u] ?? '-')
const urgencyClass = (u) => ({ 0: 'badge-low', 1: 'badge-medium', 2: 'badge-high' }[u] ?? 'badge-default')
const formatDate = (dt) => dt ? dt.slice(0, 10) : '-'
const calcOverdueDays = (date) => {
  if (!date) return 0
  const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await getWorkOrder(route.params.id)
    workOrder.value = data.data || {}
  } catch (e) {
    ElMessage.error('获取工单详情失败')
  } finally {
    loading.value = false
  }
}

const loadHistory = async () => {
  try {
    const { data } = await getWorkOrderHistory(route.params.id)
    history.value = (data?.data || []).map(h => ({ ...h, _expanded: false }))
    allExpanded.value = false
  } catch (e) { /* ignore */ }
}

onMounted(async () => {
  await loadData()
  await loadHistory()
})

// 监听路由变化，切换工单时刷新数据
watch(() => route.params.id, async (newId) => {
  if (newId && route.path.startsWith('/work-orders/detail/')) {
    loading.value = true
    await loadData()
    await loadHistory()
  }
})

const handleStatusChange = () => {
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
    await toggleWorkOrderStatus(route.params.id, payload)
    workOrder.value.status = Number(statusForm.newStatus)

    const expectedDate = workOrder.value.expected_resolve_date
    const today = new Date().toISOString().slice(0, 10)
    workOrder.value.is_overdue = (expectedDate && expectedDate < today && workOrder.value.status !== 2 && workOrder.value.status !== 3) ? 1 : 0

    if (statusForm.newStatus === 2) {
      workOrder.value.resolve_date = statusForm.resolve_date
    }
    if (statusForm.newStatus === 3) {
      workOrder.value.close_date = statusForm.close_date
    }
    if (statusForm.newStatus === 2) {
      workOrder.value.result_desc = statusForm.result_desc
    }
    ElMessage.success(`状态已更新为"${statusMap[Number(statusForm.newStatus)]}"`)
    statusVisible.value = false
    // Reload history to show the new status change
    await loadHistory()
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
    else ElMessage.error('状态更新失败')
  } finally {
    statusLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await ElMessageBox.confirm('确定要删除此工单吗？', '确认删除', { type: 'warning' })
    await deleteWorkOrder(route.params.id, { updater_id: currentUser.id })
    ElMessage.success('删除成功')
    router.back()
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
  }
}
</script>

<style scoped>
.workorder-detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.detail-body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  background: #fff;
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #0f172a;
  margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;
}
.section-title::before {
  content: ''; display: inline-block; width: 3px; height: 16px;
  background: #3b82f6; border-radius: 2px; flex-shrink: 0;
}
.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.history-toggle-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
  margin-left: -4px;
}
.history-toggle-all:hover {
  color: #3b82f6;
  background: #f1f5f9;
}

/* History list */
.history-list { padding: 4px 0 8px; position: relative; }
.history-list::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 12px;
  bottom: 12px;
  width: 1.5px;
  background: #e5e7eb;
  z-index: 0;
}
.history-empty { color: #94a3b8; font-size: 13px; text-align: center; padding: 16px 0; }

.history-row {
  position: relative;
  display: flex;
  align-items: center;
  padding: 2px 0;
  gap: 10px;
}

.history-node {
  width: 20px;
  flex-shrink: 0;
  z-index: 1;
}
.node-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #9ca3af;
  background: #fff;
  z-index: 2;
  flex-shrink: 0;
  position: relative;
}
.node-circle.is-latest {
  border-color: #e5e7eb;
  background: #fff;
  color: #67c23a;
}
.node-check { font-size: 12px; font-weight: 700; line-height: 1; }
.node-num { font-size: 11px; font-weight: 500; }

.history-text {
  font-size: 13px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  line-height: 1;
  transform: translateY(1px);
}
.history-text b { font-weight: 600; color: #111827; }
.ht-time { color: #6b7280; font-size: 13px; white-space: nowrap; }

.ht-expand {
  width: 16px;
  height: 16px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  flex-shrink: 0;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;
  background: #fff;
  transition: all 0.15s;
  line-height: 1;
}
.ht-expand:hover { border-color: #3b82f6; color: #3b82f6; }

.history-details {
  margin-left: 30px;
  padding: 6px 0 8px;
}
.detail-line {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.8;
}
.detail-line b.detail-field {
  font-weight: 600;
  color: #374151;
}

.info-card {
  padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px;
}
.info-label { font-size: 11px; color: #64748b; margin-bottom: 2px; }
.info-value { font-size: 13px; font-weight: 500; }
.info-value-multiline { white-space: pre-wrap; word-break: break-word; }
.badge { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 3px; font-size: 11px; font-weight: 500; }
.badge-default { background: #f1f5f9; color: #64748b; }
.badge-success { background: #dcfce7; color: #16a34a; }
.badge-info { background: #e0f2fe; color: #0369a1; }
.badge-warning { background: #fef3c7; color: #d97706; }
.badge-danger { background: #fee2e2; color: #dc2626; }
.badge-low { background: #dbeafe; color: #2563eb; }
.badge-medium { background: #fef3c7; color: #d97706; }
.badge-high { background: #fee2e2; color: #dc2626; }

.detail-footer {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
