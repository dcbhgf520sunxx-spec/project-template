<template>
  <div class="layout-container">
    <div :class="['layout-aside', { 'is-collapsed': collapsed }]">
      <div class="logo">
        <img class="logo-icon-img" src="/sidebar-logo.png" alt="logo" />
        <span v-if="!collapsed" class="logo-text">项目管理系统</span>
        <el-icon class="collapse-btn" @click="collapsed = !collapsed">
          <Expand v-if="collapsed" />
          <Fold v-else />
        </el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#0f172a"
        text-color="#94a3b8"
        active-text-color="#fff"
        :router="true"
        :collapse="collapsed"
        :collapse-transition="false"
      >
        <template v-for="item in menuList" :key="item.id">
          <!-- 一级菜单：有子菜单 -->
          <el-sub-menu v-if="item.children?.length" :index="String(item.id)">
            <template #title>
              <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.name }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.id" :index="child.path">
              <span>{{ child.name }}</span>
            </el-menu-item>
          </el-sub-menu>
          <!-- 一级菜单：无子菜单 -->
          <el-tooltip v-else :content="item.name" placement="right" :disabled="!collapsed">
            <el-menu-item :index="item.path">
              <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.name }}</span>
            </el-menu-item>
          </el-tooltip>
        </template>
      </el-menu>
    </div>
    <div class="layout-right">
      <div class="layout-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="(item, idx) in breadcrumbs" :key="idx" :to="item.to || undefined">{{ item.label }}</el-breadcrumb-item>
        </el-breadcrumb>
        <!-- 详情页上下条导航 -->
        <div class="neighbors-nav" v-if="currentDetailModule">
          <button class="nav-arrow" :disabled="!neighbors.prevId" @click="goNeighbor(neighbors.prevId)">← 上一条</button>
          <span class="nav-position">第 {{ neighbors.ordinal }} / {{ neighbors.total }} 条</span>
          <button class="nav-arrow" :disabled="!neighbors.nextId" @click="goNeighbor(neighbors.nextId)">下一条 →</button>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-trigger">
              <el-avatar :size="32" style="background: #3b82f6">{{ currentUser.real_name?.charAt(0) }}</el-avatar>
              <span>{{ currentUser.real_name }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePwd">更改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="layout-main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
    </div>

    <!-- Change Password Dialog -->
    <el-dialog v-model="pwdVisible" title="更改密码" width="400px" :close-on-click-modal="false">
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="80px">
        <el-form-item label="原密码" prop="old_password">
          <el-input v-model="pwdForm.old_password" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="pwdForm.new_password" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="pwdForm.confirm_password" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
    <!-- AI 问数悬浮按钮 -->
    <AiChatbotButton />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { changePassword } from '../api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Fold, Expand } from '@element-plus/icons-vue'
import AiChatbotButton from '../components/AiChatbotButton.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const collapsed = ref(false)
const currentUser = ref({ real_name: '张三' })
const userMenus = ref([])

// 详情页上下条导航（仅 work-orders）
const DETAIL_MODULES = {
  '/work-orders/detail/': { api: '/api/work-orders/neighbors', route: '/work-orders/detail/', listKey: 'workOrderListFilters' },
}

const currentDetailModule = computed(() => {
  for (const prefix of Object.keys(DETAIL_MODULES)) {
    if (route.path.startsWith(prefix)) return prefix
  }
  return ''
})

const neighbors = reactive({ prevId: null, nextId: null, ordinal: 0, total: 0 })

const goNeighbor = (neighborId) => {
  if (neighborId && currentDetailModule.value) {
    router.push(`${DETAIL_MODULES[currentDetailModule.value].route}${neighborId}`)
  }
}

// 加载邻居数据
const loadNeighbors = async (detailId) => {
  const mod = DETAIL_MODULES[currentDetailModule.value]
  if (!mod) return
  try {
    const token = localStorage.getItem('token')
    let filters = {}
    try {
      filters = JSON.parse(sessionStorage.getItem(mod.listKey) || '{}')
    } catch (e) {}

    // 清理空值和无效参数
    const validApiKeys = {
      '/api/work-orders/neighbors': new Set(['problem_desc', 'system_id', 'problem_type', 'urgency', 'status', 'is_overdue', 'follower_id', 'submitter_name', 'submit_time_from', 'submit_time_to', 'expected_resolve_date_from', 'expected_resolve_date_to', 'sort_field', 'sort_order']),
    }
    const allowed = validApiKeys[mod.api] || new Set()
    const cleanFilters = {}
    for (const [k, v] of Object.entries(filters)) {
      if (!allowed.has(k)) continue
      if (v === '' || v === null || v === undefined || v === 'null') continue
      cleanFilters[k] = v
    }

    const params = { id: detailId, ...cleanFilters }

    // 邻居查询
    const res = await axios.get(mod.api, { params, headers: { Authorization: `Bearer ${token}` } })
    const data = res.data
    const prevId = data.data?.prevId || null
    const nextId = data.data?.nextId || null

    // 序号计算：先尝试带筛选，找不到则用全量数据兜底
    let listRes = await axios.get(mod.api.replace('/neighbors', ''), {
      params: { ...cleanFilters, page: 1, pageSize: 2000 },
      headers: { Authorization: `Bearer ${token}` },
    })
    let listData = listRes.data?.data || {}
    let list = listData.list || listData || []
    let idx = list.findIndex(item => item.id === Number(detailId))

    // 兜底：如果当前记录不在筛选结果中，用全量数据重新计算
    if (idx < 0 && Object.keys(cleanFilters).length > 0) {
      listRes = await axios.get(mod.api.replace('/neighbors', ''), {
        params: { page: 1, pageSize: 2000 },
        headers: { Authorization: `Bearer ${token}` },
      })
      listData = listRes.data?.data || {}
      list = listData.list || listData || []
      idx = list.findIndex(item => item.id === Number(detailId))
    }

    const total = listData.total || list.length
    neighbors.prevId = prevId
    neighbors.nextId = nextId
    neighbors.ordinal = idx >= 0 ? idx + 1 : 0
    neighbors.total = total
  } catch (e) {
    neighbors.prevId = null
    neighbors.nextId = null
    neighbors.ordinal = 0
    neighbors.total = 0
  }
}

// 监听路由变化
watch(
  () => route.fullPath,
  (newPath) => {
    const mod = DETAIL_MODULES[currentDetailModule.value]
    if (mod) {
      const id = newPath.split('/').pop()
      loadNeighbors(id)
    }
  },
  { immediate: true }
)

function loadUser() {
  try {
    const raw = localStorage.getItem('user')
    currentUser.value = raw ? JSON.parse(raw) : { real_name: '张三' }
  } catch { currentUser.value = { real_name: '张三' } }
}

function loadMenus() {
  try {
    const raw = localStorage.getItem('menus')
    const menus = raw ? JSON.parse(raw) : []
    const allowedCodes = new Set(['work_order', 'base_settings', 'archive', 'user_auth', 'user', 'role'])
    const allowedPaths = new Set(['/work-orders', '/archive', '/users', '/roles'])
    userMenus.value = menus.filter(m => allowedCodes.has(m.code) || allowedPaths.has(m.path))
    localStorage.setItem('menus', JSON.stringify(userMenus.value))
  } catch {
    userMenus.value = []
  }
}

loadUser()
loadMenus()

// 将平铺菜单转为树形（只保留 type=1 目录和 type=2 菜单）
const menuList = computed(() => {
  const filtered = userMenus.value.filter(m => m.type === 1 || m.type === 2)
  const map = {}
  const roots = []
  filtered.forEach(m => { map[m.id] = { ...m, children: [] } })
  filtered.forEach(m => {
    if (m.parent_id === 0) {
      roots.push(map[m.id])
    } else if (map[m.parent_id]) {
      map[m.parent_id].children.push(map[m.id])
    }
  })
  return roots
})

// 收集所有可访问的路径，用于 activeMenu 匹配
const allowedPaths = computed(() => {
  const paths = new Set()
  userMenus.value.forEach(m => {
    if (m.path && (m.type === 1 || m.type === 2)) paths.add(m.path)
  })
  return paths
})

const activeMenu = computed(() => {
  const path = route.path
  if (allowedPaths.value.has(path)) return path
  // 子页面（add/edit/detail）匹配父级列表页
  if (path.startsWith('/users/') && allowedPaths.value.has('/users')) return '/users'
  if (path.startsWith('/roles/') && allowedPaths.value.has('/roles')) return '/roles'
  if (path.startsWith('/work-orders/') && allowedPaths.value.has('/work-orders')) return '/work-orders'
  if (path === '/archive' && allowedPaths.value.has('/archive')) return '/archive'
  return '/users'
})

const breadcrumbs = computed(() => {
  const path = route.path
  const items = []
  if (path.startsWith('/users/add') || path.startsWith('/users/edit/')) {
    items.push({ label: '用户管理', to: '/users' })
    items.push({ label: (path.startsWith('/users/edit/') ? '编辑用户' : '新增用户'), to: '' })
  } else if (path.startsWith('/users/detail/')) {
    items.push({ label: '用户管理', to: '/users' })
    items.push({ label: '用户详情', to: '' })
  } else if (path.startsWith('/roles/add') || path.startsWith('/roles/edit/')) {
    items.push({ label: '角色管理', to: '/roles' })
    items.push({ label: (path.startsWith('/roles/edit/') ? '编辑角色' : '新增角色'), to: '' })
  } else if (path.startsWith('/roles/detail/')) {
    items.push({ label: '角色管理', to: '/roles' })
    items.push({ label: '角色详情', to: '' })
  } else if (path.startsWith('/work-orders/add') || path.startsWith('/work-orders/edit/') || path.startsWith('/work-orders/copy/')) {
    items.push({ label: '运维工单', to: '/work-orders' })
    if (path.startsWith('/work-orders/copy/')) {
      items.push({ label: '复制工单', to: '' })
    } else {
      items.push({ label: (path.startsWith('/work-orders/edit/') ? '编辑工单' : '新增工单'), to: '' })
    }
  } else if (path.startsWith('/work-orders/detail/')) {
    items.push({ label: '运维工单', to: '/work-orders' })
    items.push({ label: '工单详情', to: '' })
  } else if (path === '/archive') {
    items.push({ label: '基础档案', to: '' })
  } else {
    items.push({ label: route.meta.title || '用户管理', to: '' })
  }
  return items
})

// Change password
const pwdVisible = ref(false)
const pwdLoading = ref(false)
const pwdFormRef = ref(null)
const pwdForm = reactive({ old_password: '', new_password: '', confirm_password: '' })

const validateConfirm = (rule, value, callback) => {
  if (value !== pwdForm.new_password) callback(new Error('两次密码不一致'))
  else callback()
}

const pwdRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

const handleCommand = async (cmd) => {
  if (cmd === 'changePwd') {
    pwdForm.old_password = ''
    pwdForm.new_password = ''
    pwdForm.confirm_password = ''
    pwdVisible.value = true
  } else if (cmd === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' }).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('menus')
      router.push('/login')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  }
}

const handleChangePassword = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  const userId = currentUser.value.id
  if (!userId) return ElMessage.error('用户信息异常，请重新登录')
  pwdLoading.value = true
  try {
    await changePassword({ id: userId, old_password: pwdForm.old_password, new_password: pwdForm.new_password })
    ElMessage.success('密码修改成功')
    pwdVisible.value = false
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '修改失败')
  } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.layout-container {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  overflow: hidden;
}
.layout-aside {
  width: 180px;
  min-width: 180px;
  height: 100%;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s, min-width 0.3s;
}
.layout-aside.is-collapsed {
  width: 64px;
  min-width: 64px;
}
.layout-right {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.layout-header {
  height: 46px;
  min-height: 46px;
  max-height: 46px;
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 12px;
}

/* 详情页上下条导航 */
.neighbors-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.neighbors-nav .nav-arrow {
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  color: #3b82f6;
  cursor: pointer;
  transition: color 0.15s;
  white-space: nowrap;
}
.neighbors-nav .nav-arrow:hover { color: #2563eb; }
.neighbors-nav .nav-arrow:disabled {
  color: #cbd5e1;
  cursor: default;
  pointer-events: none;
}
.neighbors-nav .nav-position {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
}
.layout-main {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.logo {
  height: 46px;
  min-height: 46px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  gap: 8px;
  transition: padding 0.3s;
}
.logo-icon-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  object-fit: contain;
}
.logo-text { white-space: nowrap; flex: 1; font-size: 14px; transition: opacity 0.2s; }
.collapse-btn {
  cursor: pointer;
  font-size: 18px;
  flex-shrink: 0;
  transition: transform 0.3s;
  opacity: 0.7;
}
.collapse-btn:hover { opacity: 1; color: #3b82f6; }
.user-info { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px; }
.user-trigger { display: flex; align-items: center; gap: 8px; cursor: pointer; }
:deep(.el-menu) { border-right: none; flex: 1; overflow-y: auto; }
:deep(.el-sub-menu .el-menu-item) { padding-left: 60px !important; min-height: 40px; }
:deep(.el-menu-item.is-active) {
  background: #3b82f6 !important; color: #fff !important;
  border-radius: 0 8px 8px 0 !important;
  margin-right: 12px !important;
}
.layout-aside.is-collapsed :deep(.el-menu-item.is-active) {
  border-radius: 8px !important;
  margin-right: 0 !important;
}

/* 折叠状态图标对齐 */
.layout-aside.is-collapsed :deep(.el-menu-item),
.layout-aside.is-collapsed :deep(.el-sub-menu__title) {
  justify-content: center;
  padding: 0 !important;
}
.layout-aside.is-collapsed :deep(.el-menu-item .el-icon),
.layout-aside.is-collapsed :deep(.el-sub-menu__title .el-icon) {
  margin-right: 0 !important;
}
.layout-aside.is-collapsed :deep(.el-menu-item span:not(.el-tooltip)),
.layout-aside.is-collapsed :deep(.el-sub-menu__title span:not(.el-tooltip)) {
  display: none;
}
:deep(.el-sub-menu .el-menu-item.is-active) { padding-left: 60px !important; }
:deep(.el-menu-item.is-active .el-icon) { color: #fff !important; }
</style>
