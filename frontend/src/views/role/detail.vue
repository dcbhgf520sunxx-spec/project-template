<template>
  <div class="role-detail-page" v-loading="loading">
    <div class="detail-body">
      <!-- 基本信息 -->
      <div class="section-title">基本信息</div>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">角色编码</div>
            <div class="info-value">{{ role.code }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">角色名称</div>
            <div class="info-value">{{ role.name }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">角色描述</div>
            <div class="info-value info-value-multiline">{{ role.description || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">创建人</div>
            <div class="info-value">{{ role.creator_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ role.created_at || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">更新人</div>
            <div class="info-value">{{ role.updater_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">更新时间</div>
            <div class="info-value">{{ role.updated_at || '-' }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 菜单权限 -->
      <div class="section-title" style="margin-top: 24px">菜单权限</div>
      <el-tree
        :data="menuTree"
        :props="{ label: 'name', children: 'children' }"
        :default-checked-keys="checkedMenuIds"
        show-checkbox
        disabled
        default-expand-all
        node-key="id"
        style="max-width: 400px;"
      />

      <!-- 单据信息 -->
      <div class="section-title" style="margin-top: 24px">单据信息</div>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">创建人</div>
            <div class="info-value">{{ role.creator_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ role.created_at || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">更新人</div>
            <div class="info-value">{{ role.updater_name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-card">
            <div class="info-label">更新时间</div>
            <div class="info-value">{{ role.updated_at || '-' }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="detail-footer">
      <el-button @click="$router.back()">返回</el-button>
      <el-button type="primary" @click="$router.push(`/roles/edit/${route.params.id}`)">编辑</el-button>
      <el-button type="danger" @click="handleDelete">删除</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRole, deleteRole } from '../../api/role'
import { getMenus, getRoleMenus } from '../../api/menu'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const role = ref({})
const allMenus = ref([])
const menuTree = ref([])
const checkedMenuIds = ref([])

function buildTree(menus) {
  const map = {}
  const roots = []
  menus.forEach(m => { map[m.id] = { ...m, children: [] } })
  menus.forEach(m => {
    if (m.parent_id === 0) {
      roots.push(map[m.id])
    } else {
      map[m.parent_id]?.children.push(map[m.id])
    }
  })
  return roots
}

const loadMenus = async () => {
  try {
    const { data } = await getMenus()
    allMenus.value = data.data || []
    menuTree.value = buildTree(allMenus.value)
  } catch (e) { /* ignore */ }
}

const loadRoleMenus = async () => {
  try {
    const { data } = await getRoleMenus(route.params.id)
    checkedMenuIds.value = data.data || []
  } catch (e) { /* ignore */ }
}

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await getRole(route.params.id)
    role.value = data.data || {}
  } catch (e) {
    ElMessage.error('获取角色详情失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除此角色吗？删除后不可恢复。', '确认删除', { type: 'warning' })
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    await deleteRole(route.params.id, { updater_id: currentUser.id })
    ElMessage.success('删除成功')
    router.push('/roles')
  } catch (e) {
    if (e.response?.data?.message) ElMessage.error(e.response.data.message)
  }
}

onMounted(async () => {
  await loadMenus()
  await loadData()
  await loadRoleMenus()
})

// keep-alive 缓存时，切换角色时刷新数据
watch(() => route.params.id, async (newId) => {
  if (newId && route.path.startsWith('/roles/detail/')) {
    await loadData()
    await loadRoleMenus()
  }
})
</script>

<style scoped>
.role-detail-page {
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
.info-value-multiline { white-space: pre-wrap; word-break: break-word; }
:deep(.el-tree) {
  pointer-events: none;
  opacity: 0.75;
}
</style>
