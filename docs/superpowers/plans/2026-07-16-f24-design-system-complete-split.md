# F-24 组件工作台完整拆分实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 按现有分类和示例职责彻底拆分组件工作台大文件，保持页面行为、视觉、组件 API、权限、接口和数据库不变。

**Architecture:** `DesignSystemPage` 只负责分类参数校验、滚动复位和七个分类装配。分类入口只组合同目录示例组件；静态页面模式数据、列表样板、反馈弹层和输入示例各自独立。`DesignSystemPage.css` 只保留页面外壳，分类样式和共享示例样式按职责拆分。

**Tech Stack:** React 18、TypeScript、Ant Design、Vite、Node test runner、Playwright。

## Global Constraints

- 不改变页面文案、视觉、交互、组件 API、权限、接口和数据库。
- 不引入依赖，不创建通用抽象层，不把每张卡片拆成零碎组件。
- 状态留在真正使用它的最小示例组件中，静态 JSX 和样例数据移出分类入口。
- 分类入口文件不超过 180 行，单个子文件不超过 500 行；页面外壳样式不超过 400 行。

---

### Task 1: 结构门禁

**Files:**
- Modify: `frontend/test/designSystemPageSplit.test.mjs`

**Interfaces:**
- Consumes: 当前工作台文件结构。
- Produces: 对分类入口、子组件和样式职责的静态门禁。

- [x] 增加 Layout、Input、Feedback 子组件和分类样式存在性断言。
- [x] 增加分类入口行数、子文件行数和页面外壳样式行数门禁。
- [x] 运行 `node --test test/designSystemPageSplit.test.mjs`，确认因目标文件尚不存在而失败。

### Task 2: 页面模式

**Files:**
- Modify: `frontend/src/modules/design-system/pages/sections/LayoutSection.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/layout/layoutPatterns.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/layout/ListTemplateDemo.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/layout/LayoutPatternGallery.css`
- Create: `frontend/src/modules/design-system/pages/sections/layout/ListTemplateDemo.css`

**Interfaces:**
- `layoutPatterns: LayoutPattern[]` 提供静态页面模式定义。
- `ListTemplateDemo` 无属性，内部维护普通、批量和层级列表状态。

- [x] 把静态页面模式定义移入 `layoutPatterns.tsx`。
- [x] 把列表、批量列表和层级列表状态移入 `ListTemplateDemo.tsx`。
- [x] 让 `LayoutSection` 只渲染规范卡片和页面模式列表。

### Task 3: 输入组件

**Files:**
- Modify: `frontend/src/modules/design-system/pages/sections/InputSection.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/input/BasicInputExamples.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/input/SelectionInputExamples.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/input/ChoiceInputExamples.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/input/AdvancedInputExamples.tsx`

**Interfaces:**
- `AdvancedInputExamples` 接收现有 `richText` 和 `setRichText` 属性，其余示例在内部维护局部状态。

- [x] 基础文本和数字输入归入 `BasicInputExamples`。
- [x] 日期、下拉、树和级联归入 `SelectionInputExamples`。
- [x] 单复选、穿梭、开关、滑块和评分归入 `ChoiceInputExamples`。
- [x] 上传、颜色和富文本归入 `AdvancedInputExamples`。

### Task 4: 反馈组件

**Files:**
- Modify: `frontend/src/modules/design-system/pages/sections/FeedbackSection.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/feedback/FeedbackMessages.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/feedback/FeedbackConfirmations.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/feedback/FeedbackProgress.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/feedback/FeedbackOverlays.tsx`
- Create: `frontend/src/modules/design-system/pages/sections/feedback/FeedbackTableDrawer.tsx`

**Interfaces:**
- `FeedbackMessages` 和 `FeedbackConfirmations` 各自调用 `useAdminFeedback`。
- `FeedbackOverlays` 维护普通弹窗、状态流转和表单抽屉状态。
- `FeedbackTableDrawer` 独立维护表格筛选、分页和选择状态。

- [x] 消息、通知和横幅独立维护。
- [x] 气泡确认和弹窗确认独立维护。
- [x] 进度与加载状态独立维护。
- [x] 普通弹窗、状态流转和表单抽屉归入 `FeedbackOverlays`。
- [x] 表格抽屉的数据、筛选、分页和选择状态归入 `FeedbackTableDrawer`。

### Task 5: 样式归位与验收

**Files:**
- Modify: `frontend/src/modules/design-system/pages/DesignSystemPage.css`
- Create: `frontend/src/modules/design-system/pages/DesignSystemShared.css`
- Modify/Create: 各 section 对应 CSS。

**Interfaces:**
- `DesignSystemPage.css` 只保留工作台页面外壳。
- `DesignSystemShared.css` 只保留跨分类复用的示例卡片、标题和响应式布局。

- [x] 页面模式和列表样板样式随对应子组件迁移。
- [x] 运行结构测试、前端全部测试、lint、严格组件审计、构建和统一门禁。
- [x] 浏览器逐一检查七个分类、列表模式切换、反馈弹窗和表格抽屉。
- [x] 确认 3101/3102 返回 200，更新桌面 HTML 的最终拆分证据。
