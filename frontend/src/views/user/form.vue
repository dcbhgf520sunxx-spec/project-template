<template>
  <div class="user-form-page">
    <div class="form-body">
      <div class="section-title">基本信息</div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <div class="form-grid">
          <!-- 新增模式：HR搜索下拉 -->
          <template v-if="!isEdit">
            <el-form-item label="工号" prop="employee_no">
              <el-select v-model="form.employee_no" filterable remote reserve-keyword
                placeholder="输入工号或姓名搜索" :remote-method="searchHr" :loading="hrLoading"
                @change="handleHrSelect" style="width:100%">
                <el-option v-for="p in hrPersons" :key="p.employee_no"
                  :label="`${p.employee_no}·${p.real_name}`" :value="p.employee_no" />
              </el-select>
            </el-form-item>
            <el-form-item label="姓名" prop="real_name">
              <el-input v-model="form.real_name" disabled placeholder="从HR选择后自动填充" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" disabled placeholder="从HR选择后自动填充" />
            </el-form-item>
          </template>
          <!-- 编辑模式：普通输入 -->
          <template v-else>
            <el-form-item label="工号" prop="employee_no">
              <el-input v-model="form.employee_no" disabled />
            </el-form-item>
            <el-form-item label="姓名" prop="real_name">
              <el-input v-model="form.real_name" disabled />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </template>
          <el-form-item label="所属角色" prop="role_ids">
            <el-select v-model="form.role_ids" multiple placeholder="请选择角色" clearable>
              <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
            </el-select>
          </el-form-item>
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
import { ref, reactive, computed, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser, createUser, updateUser, checkPhone, checkEmployeeNo, hrSearch } from '../../api/user'
import { getAllRoles } from '../../api/role'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id && !route.path.includes('/add'))
const initialized = ref(false)
const roles = ref([])

// HR 搜索
const hrPersons = ref([])
const hrLoading = ref(false)

const form = reactive({ employee_no: '', real_name: '', phone: '', role_ids: [] })

// 从 HR 选择人员
const handleHrSelect = (val) => {
  const person = hrPersons.value.find(p => p.employee_no === val)
  if (person) {
    form.real_name = person.real_name
    form.phone = person.phone
  }
}

// 远程搜索 HR
const searchHr = async (keyword) => {
  if (!keyword || keyword.trim().length < 1) {
    hrPersons.value = []
    return
  }
  hrLoading.value = true
  try {
    const { data } = await hrSearch(keyword.trim())
    hrPersons.value = data?.data || []
  } catch (e) {
    hrPersons.value = []
    ElMessage.warning('HR系统暂不可用')
  } finally {
    hrLoading.value = false
  }
}

const validateEmployeeNo = async (rule, value, callback) => {
  if (!value) return callback()
  const excludeId = isEdit.value ? route.params.id : undefined
  const { data } = await checkEmployeeNo(value, excludeId)
  if (!data.data.available) callback(new Error('工号已存在'))
  else callback()
}

const validatePhone = async (rule, value, callback) => {
  if (!value) return callback()
  const excludeId = isEdit.value ? route.params.id : undefined
  const { data } = await checkPhone(value, excludeId)
  if (!data.data.available) callback(new Error('手机号已存在'))
  else callback()
}

const rules = {
  employee_no: [
    { required: true, message: '请输入工号', trigger: 'blur' },
    { validator: validateEmployeeNo, trigger: 'blur' },
  ],
  real_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' },
  ],
}

const loadRoles = async () => {
  try {
    const { data } = await getAllRoles()
    roles.value = data.data || []
  } catch (e) { /* ignore */ }
}

const loadData = async () => {
  if (!isEdit.value) return
  try {
    const { data } = await getUser(route.params.id)
    const d = data.data
    form.employee_no = d.employee_no
    form.real_name = d.real_name
    form.phone = d.phone
    form.role_ids = d.role_ids || []
  } catch (e) {
    ElMessage.error('获取用户详情失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const payload = {
      ...form,
      password: 'vv123456',
      status: isEdit.value ? undefined : 1,
      role_ids: form.role_ids || [],
      creator_id: currentUser.id,
      updater_id: currentUser.id,
    }
    if (isEdit.value) {
      delete payload.password
      delete payload.status
      await updateUser(route.params.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createUser(payload)
      ElMessage.success('创建成功')
    }
    router.push('/users')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || (isEdit.value ? '更新失败' : '创建失败'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => { loadRoles(); loadData(); initialized.value = true })

// keep-alive 缓存时，切换新增/编辑或不同记录时刷新
onActivated(async () => {
  if (!initialized.value) return  // 首次挂载已由 onMounted 处理
  if (!isEdit.value) {
    Object.assign(form, { employee_no: '', real_name: '', phone: '', role_ids: [] })
    if (formRef.value) formRef.value.clearValidate()
  }
  await loadData()
})

watch(() => route.params.id, async (newId, oldId) => {
  // 只有在用户管理模块路径下才响应 ID 变化
  if (route.path.startsWith('/users/') && newId !== oldId && newId) {
    await loadData()
  }
})
</script>

<style scoped>
.user-form-page {
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
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.form-grid .el-form-item {
  margin-bottom: 0;
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
</style>
