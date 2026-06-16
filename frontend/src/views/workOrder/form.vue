<template>
  <div class="workorder-form-page">
    <div class="form-body">
      <div class="section-title">基本信息</div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" :show-message="true">
        <div class="form-grid">
          <el-form-item label="问题描述" prop="problem_desc" class="span-3">
            <el-input v-model="form.problem_desc" type="textarea" :rows="4" placeholder="请输入问题描述" />
          </el-form-item>
          <el-form-item label="问题类型" prop="problem_type">
            <el-select v-model="form.problem_type" placeholder="请选择问题类型" style="width:100%">
              <el-option label="日常操作" :value="1" />
              <el-option label="系统优化" :value="2" />
              <el-option label="故障报障" :value="3" />
              <el-option label="后台维护" :value="4" />
              <el-option label="其他" :value="5" />
            </el-select>
          </el-form-item>
          <el-form-item label="紧急程度" prop="urgency">
            <el-select v-model="form.urgency" placeholder="请选择紧急程度" style="width:100%">
              <el-option :value="2" label="高">
                <span class="priority-opt priority-high">高</span>
              </el-option>
              <el-option :value="1" label="中">
                <span class="priority-opt priority-medium">中</span>
              </el-option>
              <el-option :value="0" label="低">
                <span class="priority-opt priority-low">低</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="跟进人" prop="follower_id">
            <el-select v-model="form.follower_id" filterable placeholder="请输入或选择跟进人" style="width:100%">
              <el-option v-for="u in users" :key="u.id" :label="`${u.employee_no}·${u.real_name}`" :value="u.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="提出人" prop="submitter_name">
            <el-input v-model="form.submitter_name" placeholder="请输入提出人" />
          </el-form-item>
          <el-form-item label="提出组织" prop="submitter_dept">
            <el-input v-model="form.submitter_dept" placeholder="请输入提出组织" />
          </el-form-item>
          <el-form-item label="提出时间" prop="submit_time">
            <el-date-picker v-model="form.submit_time" type="date" placeholder="请选择提出时间" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="预计完成时间" prop="expected_resolve_date">
            <el-date-picker v-model="form.expected_resolve_date" type="date" placeholder="请选择预计完成时间" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <div class="spacer"></div>
          <div class="spacer"></div>
        </div>
      </el-form>
    </div>
    <div class="form-footer">
      <el-button @click="$router.back()">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorkOrder, createWorkOrder, updateWorkOrder, getWorkOrders } from '../../api/workOrder'
import { getUsers } from '../../api/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const loadingData = ref(false)
const isEdit = computed(() => !!route.params.id && !route.path.startsWith('/work-orders/copy/'))
const isCopy = computed(() => route.path.startsWith('/work-orders/copy/'))
const initialized = ref(false)

const form = reactive({
  problem_type: '', problem_desc: '', follower_id: '',
  urgency: null, submitter_name: '', submitter_dept: '', submit_time: '',
  expected_resolve_date: '',
})

const users = ref([])

const validateProblemDesc = async (rule, value, callback) => {
  if (!value) { callback(); return }
  try {
    const { data } = await getWorkOrders({ problem_desc: value })
    const list = data?.data || []
    // 仅编辑模式排除当前记录，复制模式视为全新记录
    const excludeId = isEdit.value ? Number(route.params.id) : undefined
    // 排除当前编辑的记录，避免误报
    const currentId = route.params.id
    const duplicates = currentId ? list.filter(w => String(w.id) !== String(currentId)) : list
    if (duplicates.length > 0) {
      callback(new Error('问题描述已存在，请勿重复创建'))
    } else {
      callback()
    }
  } catch (err) {
    console.error('validateProblemDesc error:', err)
    callback(new Error('描述校验失败，请重试'))
  }
}

const rules = {
  problem_desc: [
    { required: true, message: '请输入问题描述', trigger: 'blur' },
    { validator: validateProblemDesc, trigger: 'blur' },
  ],
  problem_type: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  urgency: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],
  follower_id: [{ required: true, message: '请选择跟进人', trigger: 'change' }],
  submitter_name: [{ required: true, message: '请输入提出人', trigger: 'blur' }],
  submitter_dept: [{ required: true, message: '请输入提出组织', trigger: 'blur' }],
  submit_time: [{ required: true, message: '请选择提出时间', trigger: 'change' }],
  expected_resolve_date: [{ required: true, message: '请选择预计完成时间', trigger: 'change' }],
}

const loadData = async () => {
  loadingData.value = true
  // Load users
  try {
    const { data } = await getUsers()
    users.value = (data?.data || []).filter(u => u.status === 1)
  } catch (e) { /* ignore */ }

  // Copy mode: load source data, exclude current record from uniqueness check
  if (isCopy.value) {
    try {
      const { data } = await getWorkOrder(route.params.id)
      const d = data.data || {}
      Object.assign(form, {
        problem_type: d.problem_type || '',
        problem_desc: d.problem_desc || '',
        follower_id: d.follower_id || '',
        urgency: d.urgency ?? null,
        submitter_name: d.submitter_name || '',
        submitter_dept: d.submitter_dept || '',
        submit_time: d.submit_time ? d.submit_time.slice(0, 10) : '',
        expected_resolve_date: d.expected_resolve_date ? d.expected_resolve_date.slice(0, 10) : '',
      })
      // Ensure source user is in dropdowns
      if (d.follower_id && !users.value.find(u => u.id === d.follower_id)) {
        const allUsers = await getUsers()
        const usr = (allUsers.data?.data || []).find(u => u.id === d.follower_id)
        if (usr) users.value.push(usr)
      }
    } catch (e) {
      ElMessage.error('获取源工单失败')
    }
    loadingData.value = false
    await nextTick()
    if (formRef.value) formRef.value.clearValidate()
    return
  }

  // Load existing data if editing
  if (isEdit.value) {
    try {
      const { data } = await getWorkOrder(route.params.id)
      const d = data.data || {}
      Object.assign(form, {
        problem_type: d.problem_type || '',
        problem_desc: d.problem_desc || '',
        follower_id: d.follower_id || '',
        urgency: d.urgency ?? null,
        submitter_name: d.submitter_name || '',
        submitter_dept: d.submitter_dept || '',
        submit_time: d.submit_time ? d.submit_time.slice(0, 10) : '',
        expected_resolve_date: d.expected_resolve_date ? d.expected_resolve_date.slice(0, 10) : '',
      })
    } catch (e) {
      console.error('获取工单详情失败:', e)
      ElMessage.error(e.response?.data?.message || '获取工单详情失败')
      router.back()
    }
  } else {
    // New mode: reset form
    Object.assign(form, {
      problem_type: '', problem_desc: '', follower_id: '',
      urgency: null, submitter_name: '', submitter_dept: '', submit_time: '',
      expected_resolve_date: '',
    })
  }
  loadingData.value = false
  await nextTick()
  if (formRef.value) formRef.value.clearValidate()
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const payload = {
      ...form,
      creator_id: currentUser.id,
      updater_id: currentUser.id,
    }

    if (isEdit.value) {
      await updateWorkOrder(route.params.id, payload)
      ElMessage.success('更新成功')
    } else {
      const res = await createWorkOrder(payload)
      ElMessage.success('创建成功')
    }
    router.push('/work-orders')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || (isEdit.value ? '更新失败' : '创建失败'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadData()
  initialized.value = true
})

// keep-alive 缓存时，切换新增/编辑或不同记录时刷新
onActivated(async () => {
  if (!initialized.value) return  // 首次挂载已由 onMounted 处理

  if (!isEdit.value && !isCopy.value) {
    Object.assign(form, { problem_type: '', problem_desc: '', follower_id: '', urgency: null, submitter_name: '', submitter_dept: '', submit_time: '', expected_resolve_date: '' })
    if (formRef.value) formRef.value.clearValidate()
  }
  await loadData()
})

watch(() => route.params.id, async (newId, oldId) => {
  if (route.path.startsWith('/work-orders/edit/') && newId !== oldId && newId) {
    await loadData()
  }
})
</script>

<style scoped>
.workorder-form-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.form-body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  background: #fff;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.form-grid .spacer { visibility: hidden; }
.form-grid .span-2 { grid-column: span 2; }
.form-grid .span-3 { grid-column: span 3; }
.form-grid .el-form-item {
  margin-bottom: 0;
  align-items: flex-start;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}
.section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 16px;
  background: #3b82f6;
  border-radius: 2px;
  flex-shrink: 0;
}
.form-footer {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}
.priority-opt {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}
.priority-high { background: #fee2e2; color: #dc2626; }
.priority-medium { background: #fef3c7; color: #d97706; }
.priority-low { background: #dbeafe; color: #2563eb; }
</style>
