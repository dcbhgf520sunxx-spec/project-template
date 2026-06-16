<template>
  <div class="user-detail-page" v-loading="loading">
    <div class="detail-body">
      <!-- 基本信息 -->
      <div class="section-title">基本信息</div>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">工号</div>
            <div class="info-value">{{ user.employee_no }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">姓名</div>
            <div class="info-value">{{ user.real_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">手机号</div>
            <div class="info-value">{{ user.phone || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">所属角色</div>
            <div class="info-value">{{ roles.map(r => r.name).join('、') || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">状态</div>
            <div class="info-value">
              <span :class="['badge', user.status === 1 ? 'badge-success' : 'badge-default']">
                {{ user.status === 1 ? '启用' : '停用' }}
              </span>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 单据信息 -->
      <div class="section-title" style="margin-top: 24px">单据信息</div>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">创建人</div>
            <div class="info-value">{{ user.creator_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ user.created_at || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">更新人</div>
            <div class="info-value">{{ user.updater_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">更新时间</div>
            <div class="info-value">{{ user.updated_at || '-' }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="detail-footer">
      <el-button @click="$router.back()">返回</el-button>
      <el-button type="primary" @click="$router.push(`/users/edit/${route.params.id}`)">编辑</el-button>
      <el-button v-if="user.status === 1" type="danger" plain @click="handleToggleStatus">停用</el-button>
      <el-button v-else type="success" @click="handleToggleStatus">启用</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUser, toggleUserStatus } from '../../api/user'
import { getAllRoles } from '../../api/role'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const user = ref({})
const roles = ref([])
const allRoles = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await getUser(route.params.id)
    user.value = data.data || {}
    // Ensure allRoles is loaded before filtering
    if (allRoles.value.length === 0) {
      const { data: roleData } = await getAllRoles()
      allRoles.value = roleData.data || []
    }
    roles.value = allRoles.value.filter(r => user.value.role_ids?.includes(r.id))
  } catch (e) {
    ElMessage.error('获取用户详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// keep-alive 缓存时，切换用户时刷新数据
watch(() => route.params.id, async (newId) => {
  if (newId && route.path.startsWith('/users/detail/')) {
    await loadData()
  }
})

const handleToggleStatus = async () => {
  const action = user.value.status === 1 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, `确认${action}`, { type: 'warning' })
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await toggleUserStatus(route.params.id, user.value.status === 1 ? 0 : 1, currentUser.id)
    user.value.status = user.value.status === 1 ? 0 : 1
    ElMessage.success(`${action}成功`)
  } catch (e) { /* cancelled */ }
}
</script>

<style scoped>
.user-detail-page {
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
.detail-footer {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}
.info-card {
  padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px;
}
.info-label { font-size: 11px; color: #64748b; margin-bottom: 2px; }
.info-value { font-size: 13px; font-weight: 500; }
.badge { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 3px; font-size: 11px; font-weight: 500; }
.badge-default { background: #f1f5f9; color: #64748b; }
.badge-success { background: #dcfce7; color: #16a34a; }
</style>
