<template>
  <div class="role-form-page">
    <div class="form-body">
      <div class="section-title">基本信息</div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" :show-message="true">
        <div class="form-grid">
          <el-form-item label="角色编码" prop="code">
            <el-input v-model="form.code" :disabled="isEdit" placeholder="请输入角色编码" maxlength="50" />
          </el-form-item>
          <el-form-item label="角色名称" prop="name" class="item-name">
            <el-input v-model="form.name" placeholder="请输入角色名称" maxlength="50" />
          </el-form-item>
          <div class="spacer"></div>
          <el-form-item label="描述" prop="description" class="span-2">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入角色描述" />
          </el-form-item>
        </div>
      </el-form>

      <!-- 菜单权限：仅编辑模式显示 -->
      <div v-if="isEdit" class="menu-section">
        <div class="section-title">菜单权限</div>
        <el-tree
          ref="treeRef"
          :data="menuTree"
          :props="{ label: 'name', children: 'children' }"
          show-checkbox
          node-key="id"
          default-expand-all
          :check-strictly="false"
          style="max-width: 400px;"
        />
      </div>
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
import { getRole, createRole, updateRole, checkCode } from '../../api/role'
import { getMenus, getRoleMenus, saveRoleMenus } from '../../api/menu'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const treeRef = ref(null)
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id && !route.path.includes('/add'))
const initialized = ref(false)

const form = reactive({ code: '', name: '', description: '' })

const allMenus = ref([])
const menuTree = ref([])
const assignedMenuIds = ref([])

const validateCode = async (rule, value, callback) => {
  if (!value) { callback(); return }
  try {
    const { data } = await checkCode(value, route.params.id)
    if (!data.data.available) callback(new Error('角色编码已存在'))
    else callback()
  } catch (e) { callback() }
}

const rules = {
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { validator: validateCode, trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

// 将平铺菜单转为树形
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
  if (!isEdit.value) return
  try {
    const { data } = await getRoleMenus(route.params.id)
    assignedMenuIds.value = data.data || []
  } catch (e) { /* ignore */ }
}

const loadData = async () => {
  if (!isEdit.value) return
  try {
    const { data } = await getRole(route.params.id)
    Object.assign(form, data.data)
  } catch (e) {
    ElMessage.error('获取角色详情失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    // 保存基本信息
    const payload = { ...form, creator_id: currentUser.id, updater_id: currentUser.id }
    if (isEdit.value) {
      await updateRole(route.params.id, payload)
    } else {
      const res = await createRole(payload)
      if (res.data?.data?.id) route.params.id = res.data.data.id
    }

    // 保存菜单权限：只保存真正勾选的，不包含半勾选的父节点
    const checkedKeys = treeRef.value?.getCheckedKeys() || []
    await saveRoleMenus(route.params.id, checkedKeys, currentUser.id)

    ElMessage.success('保存成功')
    router.push('/roles')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || (isEdit.value ? '更新失败' : '创建失败'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadMenus()
  await loadData()
  await loadRoleMenus()
  if (isEdit.value) {
    await nextTick()
    treeRef.value?.setCheckedKeys(assignedMenuIds.value, false)
  }
  initialized.value = true
})

// keep-alive 缓存时，切换新增/编辑或不同记录时刷新
onActivated(async () => {
  if (!initialized.value) return  // 首次挂载已由 onMounted 处理
  if (!isEdit.value) {
    Object.assign(form, { code: '', name: '', description: '' })
    if (formRef.value) formRef.value.clearValidate()
    if (treeRef.value) treeRef.value?.setCheckedKeys([], false)
  } else {
    await loadData()
    await loadRoleMenus()
    await nextTick()
    treeRef.value?.setCheckedKeys(assignedMenuIds.value, false)
  }
})

watch(() => route.params.id, async (newId, oldId) => {
  // 只有在角色管理模块路径下才响应 ID 变化
  if (route.path.startsWith('/roles/') && newId !== oldId && newId) {
    await loadData()
    await loadRoleMenus()
    if (isEdit.value) {
      await nextTick()
      treeRef.value?.setCheckedKeys(assignedMenuIds.value, false)
    }
  }
})
</script>

<style scoped>
.role-form-page {
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
.form-grid .spacer {
  visibility: hidden;
}
.form-grid .span-2 {
  grid-column: span 2;
}
.form-grid .el-form-item {
  margin-bottom: 0;
  align-items: flex-start;
}
.form-grid .item-name {
  min-width: 200px;
}
.menu-section {
  margin-top: 24px;
  padding-top: 0;
  border-top: none;
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
</style>
