# 后台页面语义约束设计

## 目标

让列表操作、详情状态、删除确认和多状态流转由底座的语义组件与页面模板统一承接，并通过 TypeScript 结构审计阻止业务页面绕开。后续项目即使只依赖仓库内的 AI 开发链路，也能稳定生成符合规范的页面。

## 范围

- 收口列表普通操作、启用停用、多状态流转和删除操作的组件入口。
- 固定详情页标题标签、状态操作和右上角记录操作的位置。
- 按目标状态统一普通、正向、危险弹窗语义。
- 将约束同步到组件工作台、页面模板、AI 开发规则、交付流程和自动门禁。
- 迁移底座现有用户、工单和样板页面，保证底座自身通过新规则。

不包含具体业务项目迁移、数据库调整和历史日志聚合。PMIS 在底座完成后单独同步和整改。

## 干净底座约束

- 不保留旧组件兼容层。
- 不新增运行时依赖。
- 不新增一次性同步说明、整改追踪页或临时脚本。
- 不把 PMIS 的产品、项目业务代码放入底座。
- 新增文件只承担长期有效的组件、测试或规则职责。

## 组件设计

### 删除旧状态入口

彻底删除 `StatusFlowAction` 文件及公共导出。业务代码不得通过内部路径继续导入。

### StatusChangeAction

新增统一的多状态动作组件 `StatusChangeAction`：

- 接收当前状态、目标状态选项、当前状态展示、目标状态扩展字段和提交回调。
- 列表操作通过 `variant="text"` 使用。
- 详情操作只能通过 `TemplateDetailPage.statusAction` 传入。
- 内部统一控制 `StatusFlowModal` 的打开、关闭、目标状态和提交状态。
- 业务页面不得自行组合按钮与 `StatusFlowModal`。

### StatusFlowModal

状态选项增加 `tone: 'normal' | 'success' | 'danger'`：

- `normal` 使用蓝色信息语义。
- `success` 使用绿色正向语义。
- `danger` 使用红色警示语义和危险确认按钮。

弹窗语义随当前选中的目标状态变化。未选择目标状态时使用 `normal`。扩展字段的必填校验继续由表单承接。

### 现有语义组件分工

- 普通文字操作：`AdminTextAction`。
- 启用、停用：`StatusConfirmAction`。
- 多状态流转：`StatusChangeAction`。
- 删除：`DeleteConfirmAction`。
- 非危险但需要确认的普通动作：`ConfirmAction`。

## 详情模板设计

`TemplateDetailPage` 增加两个必需的语义位置：

- `titleTags`：渲染状态、紧急程度、逾期等标题标签。
- `statusAction`：固定渲染在“当前状态”区域内容之后。

当页面传入 `statusSection` 时，必须同时传入 `titleTags` 和 `statusAction`。`actions` 只承接编辑、复制、删除等记录级操作，不得放置状态操作。

无状态模型的详情页不要求 `titleTags` 和 `statusAction`。

## 结构审计设计

审计器使用项目现有 TypeScript 编译器 API 解析 TSX，不新增依赖。

### 操作列规则

`OperationColumnActions` 的直接动作只允许：

- `AdminTextAction`
- `StatusConfirmAction variant="text"`
- `StatusChangeAction variant="text"`
- `DeleteConfirmAction variant="text"`
- `ConfirmAction variant="text"`
- `AdminActionDropdown`

删除文案、删除标题或危险删除语义如果使用 `ConfirmAction`，直接阻断。操作列中出现普通按钮形态直接阻断。

### 详情规则

- `TemplateDetailPage` 有 `statusSection` 时必须有 `titleTags` 和 `statusAction`。
- `actions` 中禁止出现 `StatusConfirmAction`、`StatusChangeAction` 和 `StatusFlowModal`。
- 业务模块禁止直接使用 `StatusFlowModal`。
- 业务模块禁止导入或使用 `StatusFlowAction`。

### 审计范围

规则面向所有业务模块，不写死用户、工单或未来模块路径。组件工作台和组件内部为明确允许范围。

## AI 开发链路

同步维护以下长期入口：

- `AGENTS.md`：增加语义组件、详情位置和禁止内部导入规则。
- `docs/ai-development-rules.md`：增加业务场景与强制组件映射，删除模糊表述。
- `docs/ai-delivery-flow.md`：增加 JSX 结构审计和浏览器语义验收。
- `docs/ai-delivery-template.md`：增加操作列、标题标签、状态位置及三种弹窗语义检查项。
- 组件工作台：展示 `StatusChangeAction` 和蓝、绿、红三种弹窗结果。
- 页面模式详情样板：真实使用 `titleTags` 与 `statusAction`。

AI 开发固定链路为：

`AGENTS.md → ai-development-rules.md → 页面模板 → 组件工作台 → TSX 结构审计 → verify-change`

## 测试与验收

### 自动测试

- 旧 `StatusFlowAction` 文件和导出不存在。
- `StatusChangeAction` 统一控制 `StatusFlowModal`。
- 三种目标状态产生正确弹窗语义。
- 操作列错误组件、错误形态和错误删除组件会被审计阻断。
- 有状态详情缺少标题标签或状态操作会被阻断。
- 状态操作放入详情右上角会被阻断。
- 正确的任意新业务模块样例可以通过，不依赖工单路径。

### 页面验收

- 列表操作均为文字形态，超过三个动作仍由现有更多机制承接。
- 详情标题后展示状态相关标签。
- 状态操作紧跟当前状态区域，不出现在右上角。
- 普通目标弹窗为蓝色、正向目标为绿色、危险目标为红色。
- 删除、停用和多状态流转分别使用对应语义组件。

### 统一门禁

运行兼容命令：

```bash
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/verify-change.mjs
```

随后实际检查 `3101` 健康接口和 `3102` 页面。任何阻断项、构建失败或页面语义不一致都不能交付。

## 迁移顺序

1. 先补失败测试和 TSX 结构审计用例。
2. 新增 `StatusChangeAction` 并扩展 `StatusFlowModal`。
3. 扩展 `TemplateDetailPage`。
4. 迁移底座用户、工单和页面样板。
5. 删除 `StatusFlowAction`。
6. 更新组件工作台和 AI 开发链路文档。
7. 运行统一门禁和浏览器验收。

底座完成并推送后，再在 PMIS 中拉取最新底座并整改产品、项目页面。
