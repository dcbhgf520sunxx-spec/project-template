<template>
  <div class="ai-chatbot-wrapper">
    <el-tooltip content="AI 问数" placement="left" :disabled="isOpen">
      <div class="ai-chatbot-button" @click="handleToggle" :class="{ 'is-hover': isHover, 'is-open': isOpen }">
        <el-icon v-if="!isOpen && !loading" :size="18"><ChatLineRound /></el-icon>
        <el-icon v-if="loading" :size="18" class="spinning"><Loading /></el-icon>
        <el-icon v-if="isOpen && !loading" :size="18"><Close /></el-icon>
      </div>
    </el-tooltip>

    <transition name="chat-slide">
      <div v-if="isOpen" class="ai-chatbot-panel" :class="{ 'is-maximized': isMaximized }">
        <div class="ai-chatbot-header">
          <span>AI 问数</span>
          <div class="header-actions">
            <el-icon class="action-btn" :title="isMaximized ? '还原' : '最大化'" @click="isMaximized = !isMaximized">
              <FullScreen v-if="!isMaximized" />
              <Aim v-else />
            </el-icon>
            <el-icon class="close-btn" @click="handleClose"><Close /></el-icon>
          </div>
        </div>

        <!-- 成功：加载 iframe -->
        <iframe v-if="ticket" :src="iframeSrc" width="100%" height="100%" style="border: none;" allow="clipboard-write"></iframe>

        <!-- 失败：降级提示 -->
        <div v-else class="ai-chatbot-fallback">
          <el-icon :size="40" color="#94a3b8"><Warning /></el-icon>
          <p class="fallback-title">AI 问数暂不可用</p>
          <p class="fallback-desc">{{ errorMsg || '当前网络环境无法访问 AI 问数服务，请确认部署到内网环境后重试。' }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChatLineRound, Close, Loading, Warning, FullScreen, Aim } from '@element-plus/icons-vue'
import request from '../api/request'
import { ElMessage } from 'element-plus'

const isHover = ref(false)
const isOpen = ref(false)
const isMaximized = ref(false)
const loading = ref(false)
const ticket = ref('')
const errorMsg = ref('')

const iframeSrc = computed(() => {
  if (!ticket.value) return ''
  return `http://183.129.242.90:3100/embed/97f351f5-8d4d-d5d1-0a2d-37ec8707d75f?ticket=${ticket.value}`
})

// 关闭时还原最大化状态
function handleClose() {
  isOpen.value = false
  isMaximized.value = false
}

async function handleToggle() {
  if (isOpen.value) {
    handleClose()
    return
  }

  loading.value = true
  errorMsg.value = ''
  ticket.value = ''

  try {
    const { data } = await request.post('/api/auth/sso/ticket')
    ticket.value = data.data.ticket
    isOpen.value = true
  } catch (e) {
    if (e.response?.status === 401) {
      ElMessage.error('请先登录')
    } else {
      errorMsg.value = e.response?.data?.message || '无法连接 AI 问数服务'
      isOpen.value = true
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ai-chatbot-wrapper {
  position: fixed;
  right: 20px;
  bottom: 80px;
  z-index: 9999;
}

.ai-chatbot-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  animation: float 3s ease-in-out infinite;
}
.ai-chatbot-button.is-hover {
  transform: scale(1.08) !important;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  animation-play-state: paused;
}
.ai-chatbot-button:active {
  transform: scale(0.95) !important;
}
.ai-chatbot-button.is-open {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.spinning {
  animation: spin 1s linear infinite;
}

/* Panel */
.ai-chatbot-panel {
  position: absolute;
  bottom: 48px;
  right: 0;
  width: 450px;
  height: 680px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  background: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;
}

.ai-chatbot-panel.is-maximized {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  z-index: 10000;
}

.ai-chatbot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}
.ai-chatbot-header .header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ai-chatbot-header .action-btn,
.ai-chatbot-header .close-btn {
  cursor: pointer;
  font-size: 16px;
  opacity: 0.8;
  transition: opacity 0.15s;
}
.ai-chatbot-header .action-btn:hover,
.ai-chatbot-header .close-btn:hover { opacity: 1; }

/* Fallback */
.ai-chatbot-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 24px;
  text-align: center;
}
.fallback-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin: 16px 0 8px;
}
.fallback-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
}

/* Transition */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.chat-slide-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
.chat-slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
