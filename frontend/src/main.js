import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/common.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 图标全局注册（菜单图标从数据库动态加载，必须全局注册）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus, { locale: zhCn })
app.use(router)

// 只在表格区域添加 title 提示，避免全局监听性能问题
let tableObserver = null
const startTableObserver = () => {
  const tableArea = document.querySelector('.table-area')
  if (!tableArea) {
    setTimeout(startTableObserver, 500)
    return
  }
  tableObserver = new MutationObserver(() => {
    tableArea.querySelectorAll('td:not([title-auto])').forEach(td => {
      const text = td.textContent?.trim()
      if (text && text !== '-') {
        td.setAttribute('title', text)
        td.setAttribute('title-auto', '')
      }
    })
  })
  tableObserver.observe(tableArea, { childList: true, subtree: true })
}
startTableObserver()

app.mount('#app')
