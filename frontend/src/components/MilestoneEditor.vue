<template>
  <el-dialog v-model="visible" :title="`里程碑 - ${projectName}`" width="900px" :close-on-click-modal="false" class="milestone-dialog">
    <div class="milestone-empty">
      里程碑功能在当前模板中不可用
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  projectId: Number,
  projectName: String,
})
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
})

watch(visible, (v) => { emit('update:modelValue', v) })
</script>

<style scoped>
.milestone-dialog :deep(.el-dialog__body) {
  padding: 16px 20px 12px;
}

.milestone-empty {
  text-align: center;
  padding: 40px 0;
  color: #94a3b8;
  font-size: 14px;
}
</style>
