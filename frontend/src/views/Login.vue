<template>
  <div class="login-page">
    <div class="login-box">
      <h2 class="login-title">项目管理系统</h2>
      <el-form :model="form" :rules="rules" ref="formRef" @keyup.enter="handleLogin">
        <el-form-item prop="account">
          <el-input v-model="form.account" placeholder="工号或手机号" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleLogin" style="width: 100%">登录</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 首登强制改密弹窗 -->
    <el-dialog v-model="firstLoginVisible" title="首次登录请修改密码" width="400px" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false">
      <el-form :model="changeForm" :rules="changeRules" ref="changeFormRef" label-width="100px">
        <el-form-item label="原密码" prop="old_password">
          <el-input v-model="changeForm.old_password" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="changeForm.new_password" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="changeForm.confirm_password" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="changeLoading" @click="handleChangePassword" style="width: 100%">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login, changePassword } from '../api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({ account: '', password: '' })

const rules = {
  account: [{ required: true, message: '请输入工号或手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 首登改密状态
const firstLoginVisible = ref(false)
const changeLoading = ref(false)
const changeFormRef = ref(null)
const changeForm = reactive({ old_password: '', new_password: '', confirm_password: '' })
const changeRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirm_password: [{ required: true, message: '请确认新密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const { data } = await login(form)
    const result = data.data || data
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))
    localStorage.setItem('menus', JSON.stringify(result.menus || []))

    if (result.first_login === 1) {
      // 首次登录：拦截跳转，弹出改密弹窗
      firstLoginVisible.value = true
    } else {
      ElMessage.success('登录成功')
      router.push('/work-orders')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const handleChangePassword = async () => {
  const valid = await changeFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (changeForm.new_password !== changeForm.confirm_password) {
    return ElMessage.error('两次输入的新密码不一致')
  }

  changeLoading.value = true
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    await changePassword({ id: user.id, old_password: changeForm.old_password, new_password: changeForm.new_password })
    ElMessage.success('密码修改成功')
    firstLoginVisible.value = false
    // 直接登录进入系统，无需重新登录
    router.push('/work-orders')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '修改失败')
  } finally {
    changeLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 1;
}
.login-box {
  width: 380px;
  padding: 40px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.login-title {
  text-align: center;
  margin: 0 0 32px;
  font-size: 22px;
  color: #0f172a;
}
</style>
