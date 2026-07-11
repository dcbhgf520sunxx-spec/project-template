# Semantic Audit And Workbench Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 强化页面语义和 API 契约门禁，并将组件工作台 8 个子菜单纳入可独立分配的菜单权限，同时固定基础设置位于用户权限上方。

**Architecture:** 在现有 TypeScript AST 组件审计中增加详情子节点语义和业务状态组件源码溯源；新增独立 API 契约审计脚本，避免继续扩大单一审计文件。组件工作台权限以 `pms_menu` 为真实来源，前端静态菜单只负责映射图标与结构，完整 URL（含 `category`）作为子菜单权限键。

**Tech Stack:** React 18、TypeScript、TypeScript Compiler API、Node.js test runner、Express、PostgreSQL、SQL migration、Markdown、XLSX。

## Global Constraints

- 不修改 PMIS 产品、项目业务代码。
- 不恢复 `StatusFlowAction`，业务页面不得直接使用 `StatusFlowModal`。
- 不增加新依赖，不保留兼容层，不生成一次性同步说明。
- 数据库物理表继续使用 `pms_` 前缀。
- 数据库结构已获用户确认，本轮同步初始化 SQL、migration、Markdown 和 XLSX，并允许执行 migration。
- 所有实现使用测试驱动，统一门禁使用 `PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/verify-change.mjs`。

---

### Task 1: 强化详情页状态语义

**Files:**
- Modify: `frontend/test/auditComponentUsage.test.ts`
- Modify: `frontend/scripts/audit-component-usage.mjs`

**Interfaces:**
- Consumes: `collectSemanticViolations(files)` 和 TypeScript JSX AST。
- Produces: 对 `titleTags`、`statusAction` 内容的结构校验，以及状态动作遗漏 `statusSection` 的阻断。

- [ ] **Step 1: Write the failing tests**

增加三个用例：

```ts
test('组件审计阻断普通内容冒充详情状态语义', () => {
  const result = runStrictAudit('export function DemoDetailPage(){return <TemplateDetailPage statusSection={{items:[]}} titleTags={<span>启用</span>} statusAction={<AdminButton>状态</AdminButton>} />;}');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /StatusTag/);
  assert.match(result.stdout, /状态动作/);
});

test('组件审计阻断状态动作页面遗漏状态区', () => {
  const result = runStrictAudit('export function DemoDetailPage(){return <TemplateDetailPage titleTags={<StatusTag />} statusAction={<StatusConfirmAction action="disable" />} />;}');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /statusSection/);
});

test('组件审计允许标准详情状态结构', () => {
  const result = runStrictAudit('export function DemoDetailPage(){return <TemplateDetailPage statusSection={{items:[]}} titleTags={<StatusTag />} statusAction={<StatusConfirmAction action="disable" />} />;}');
  assert.equal(result.status, 0, result.stdout);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && node --experimental-strip-types --test test/auditComponentUsage.test.ts`

Expected: 新增的两个阻断用例失败，证明当前只检查属性存在。

- [ ] **Step 3: Implement minimal AST checks**

在 `audit-component-usage.mjs` 增加：

```js
function attributeSource(node, name, sourceFile) {
  return attribute(node, name)?.initializer?.getText(sourceFile) || '';
}

const hasStatusAction = /(?:StatusConfirmAction|StatusChangeAction)/;
const hasStatusTag = /(?:StatusTag|\w+StatusTag)/;
```

规则：`titleTags` 必须匹配状态标签；`statusAction` 必须匹配标准或业务状态动作；出现 `titleTags` 或 `statusAction` 时必须存在 `statusSection`。

- [ ] **Step 4: Run tests and strict audit**

Run:

```bash
cd frontend
node --experimental-strip-types --test test/auditComponentUsage.test.ts
npm run audit:components:strict
```

Expected: 全部通过，严格审计 0 阻断。

- [ ] **Step 5: Commit**

```bash
git add frontend/scripts/audit-component-usage.mjs frontend/test/auditComponentUsage.test.ts
git commit -m "test: enforce detail status semantics"
```

---

### Task 2: 溯源业务状态动作组件

**Files:**
- Modify: `frontend/test/auditComponentUsage.test.ts`
- Modify: `frontend/scripts/audit-component-usage.mjs`

**Interfaces:**
- Consumes: 操作列和详情中名称以 `StatusChangeAction`、`StatusConfirmAction` 结尾的 JSX 标签。
- Produces: `resolveImportedComponentSource(sourceFile, componentName)`，定位相对路径导入的业务组件源码并验证公共组件入口。

- [ ] **Step 1: Write failing source-trace tests**

测试临时模块目录中同时写业务页和业务组件：

```ts
writeAuditFile(modulesDir, 'customer/components/CustomerStatusChangeAction.tsx',
  'export function CustomerStatusChangeAction(){return <AdminButton>状态变更</AdminButton>}');
writeAuditFile(modulesDir, 'customer/pages/CustomerListPage.tsx',
  'import { CustomerStatusChangeAction } from "../components/CustomerStatusChangeAction"; export function CustomerListPage(){return <OperationColumnActions><CustomerStatusChangeAction variant="text" /></OperationColumnActions>}');
```

预期阻断；另增加内部渲染 `<StatusChangeAction {...props} />` 的允许用例。

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && node --experimental-strip-types --test test/auditComponentUsage.test.ts`

Expected: 伪业务状态组件错误通过，测试失败。

- [ ] **Step 3: Implement import-source tracing**

只处理相对路径导入，依次解析 `.tsx`、`.ts`、`/index.tsx`、`/index.ts`。若业务状态动作不是公共组件本身，则其源码必须直接包含：

```tsx
<StatusChangeAction
```

或：

```tsx
<StatusConfirmAction
```

无法定位源码或内部未使用对应公共组件均阻断，不维护模块白名单。

- [ ] **Step 4: Run tests and strict audit**

Run:

```bash
cd frontend
node --experimental-strip-types --test test/auditComponentUsage.test.ts
npm run audit:components:strict
```

Expected: 伪封装阻断、标准封装通过、项目当前业务页 0 阻断。

- [ ] **Step 5: Commit**

```bash
git add frontend/scripts/audit-component-usage.mjs frontend/test/auditComponentUsage.test.ts
git commit -m "feat: trace business status actions"
```

---

### Task 3: 增加读取接口运行时契约审计

**Files:**
- Create: `frontend/scripts/audit-api-contracts.mjs`
- Create: `frontend/test/auditApiContracts.test.mjs`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: `frontend/src/api/**/*.{ts,tsx}` 中的 `unwrap` 调用。
- Produces: `npm run audit:api-contracts`，读取接口缺少契约时退出码为 1。

- [ ] **Step 1: Write failing audit tests**

覆盖：

```js
assertAuditFails('export async function list(){ return unwrap(request.get("/items")); }', /运行时契约/);
assertAuditFails('export async function list(){ return unwrap<Row[]>(request.get("/items")); }', /arrayContract/);
assertAuditPasses('const contract=arrayContract(objectContract(["id"])); export async function list(){ return unwrap(request.get("/items"), contract); }');
assertAuditPasses('export async function remove(){ return unwrap<null>(request.delete("/items/1")); }');
assertAuditFails('export async function create(){ return unwrap<{id:number}>(request.post("/items",{})); }', /id/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && node --test test/auditApiContracts.test.mjs`

Expected: FAIL，因为审计脚本尚不存在。

- [ ] **Step 3: Implement API AST audit**

使用 TypeScript Compiler API：

- 获取 `unwrap` 调用参数。
- `request.get` 必须有第二个契约参数。
- 非 GET 调用返回 `null` 时允许无契约。
- 非 GET 调用声明对象/数组返回时必须有契约。
- 输出 `BLOCK 文件:行 unwrap 读取接口必须声明运行时契约`。

在 `package.json` 增加：

```json
"audit:api-contracts": "node scripts/audit-api-contracts.mjs"
```

- [ ] **Step 4: Repair current template API contracts**

对审计发现的底座 API 缺口补充 `objectContract` / `arrayContract`。仅修改实际缺失处，不改变接口字段转换和业务行为。

- [ ] **Step 5: Run tests and audit**

Run:

```bash
cd frontend
node --test test/auditApiContracts.test.mjs
npm run audit:api-contracts
npm run build
```

Expected: 测试通过、审计 0 阻断、构建成功。

- [ ] **Step 6: Commit**

```bash
git add frontend/scripts/audit-api-contracts.mjs frontend/test/auditApiContracts.test.mjs frontend/package.json frontend/src/api
git commit -m "feat: audit frontend response contracts"
```

---

### Task 4: 将组件工作台纳入独立菜单权限

**Files:**
- Create: `backend/db/migrations/20260711_add_design_system_menus.sql`
- Modify: `backend/db/init/001_schema.sql`
- Modify: `frontend/src/layouts/AdminLayout/index.tsx`
- Modify: `frontend/src/modules/design-system/categories.ts`
- Create: `frontend/test/designSystemMenuPermissions.test.mjs`
- Modify: `backend/test/menuPermission.test.js` or create when absent

**Interfaces:**
- Consumes: `pms_menu`、登录返回的 `menus`、`designCategoryNavItems`。
- Produces: 组件工作台父目录和 8 个可独立授权的二级菜单，完整 URL 权限过滤与直达拦截。

- [ ] **Step 1: Write failing menu permission tests**

前端测试断言：

```js
assert.match(layoutSource, /design_system_overview/);
assert.match(layoutSource, /location\.search/);
assert.doesNotMatch(layoutSource, /adminOnlyMenuItems/);
assert.match(layoutSource, /\/system\/design-system\?category=base/);
```

后端测试验证菜单树自动补父级，但不会自动补未授权兄弟节点。

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd frontend && node --test test/designSystemMenuPermissions.test.mjs
cd ../backend && node --test test/menuPermission.test.js
```

Expected: FAIL，因为工作台仍是管理员写死菜单。

- [ ] **Step 3: Add database menus**

菜单 code 固定为：

```text
design_system
design_system_overview
design_system_samples
design_system_foundation
design_system_layout
design_system_base
design_system_input
design_system_feedback
design_system_display
```

路径分别为完整分类 URL，页面样板为 `/samples/work-order`。migration 使用 `ON CONFLICT (code) DO UPDATE`，并为管理员角色补全 `pms_role_menu`。

- [ ] **Step 4: Replace admin-only frontend filtering**

删除 `adminOnlyMenuItems` 和 `isAdminOnlyPage` 特判。组件工作台进入统一菜单声明；权限键使用当前 `pathname + search`，`/system/design-system` 规范化为 `?category=overview`。父级仅在至少一个授权子菜单存在时显示，直达未授权分类跳转到首个可访问菜单。

- [ ] **Step 5: Run focused tests**

Run:

```bash
cd frontend && node --test test/designSystemMenuPermissions.test.mjs
cd ../backend && node --test test/menuPermission.test.js
```

Expected: 全部通过。

- [ ] **Step 6: Commit**

```bash
git add backend/db frontend/src frontend/test backend/test
git commit -m "feat: add workbench menu permissions"
```

---

### Task 5: 调整基础设置与用户权限顺序并同步数据库文档

**Files:**
- Modify: `backend/db/init/001_schema.sql`
- Modify: `backend/db/migrations/20260711_add_design_system_menus.sql`
- Modify: `frontend/src/layouts/AdminLayout/index.tsx`
- Modify: `frontend/test/designSystemMenuPermissions.test.mjs`
- Modify: `docs/数据库表结构.md`
- Modify: `docs/数据库表结构.xlsx`

**Interfaces:**
- Consumes: 一级菜单 `sort_order` 和前端静态声明顺序。
- Produces: `首页 → 运维工单 → 基础设置 → 用户权限 → 组件工作台`。

- [ ] **Step 1: Add failing order assertions**

测试提取源码位置和 SQL `sort_order`，断言 `base_settings` 位于 `user_auth` 之前、`design_system` 位于最后。

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && node --test test/designSystemMenuPermissions.test.mjs`

Expected: FAIL，当前用户权限在基础设置之前。

- [ ] **Step 3: Update frontend and SQL order**

固定排序值：

```text
home=5
work_order=10
base_settings=20
user_auth=30
design_system=40
```

子菜单分别使用所在父级后的连续排序区间。

- [ ] **Step 4: Update database documentation**

在 Markdown 和 XLSX 的 `pms_menu` 说明中记录组件工作台 code/path 和排序口径；使用既有表结构工作簿格式，不新增临时工作表。

- [ ] **Step 5: Verify docs and focused tests**

Run: `cd frontend && node --test test/designSystemMenuPermissions.test.mjs`

Expected: 菜单权限与顺序测试全部通过。

- [ ] **Step 6: Commit**

```bash
git add backend/db frontend/src/layouts frontend/test docs/数据库表结构.md docs/数据库表结构.xlsx
git commit -m "feat: order primary menus consistently"
```

---

### Task 6: 更新 AI 链路、统一门禁并完成验收

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/ai-development-rules.md`
- Modify: `docs/ai-delivery-flow.md`
- Modify: `docs/ai-delivery-template.md`
- Modify: `scripts/verify-change.mjs`
- Create: `frontend/test/statusTransitionContractTemplate.test.mjs`

**Interfaces:**
- Consumes: Tasks 1-5 的审计命令和菜单权限契约。
- Produces: 克隆底座后自动执行的完整交付门禁。

- [ ] **Step 1: Write failing AI-chain assertions**

测试要求门禁包含 `audit:api-contracts`、新测试文件和菜单权限测试；开发规则包含业务状态流转矩阵、附加字段校验、完整 URL 菜单权限。

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && node --test test/aiSemanticRules.test.mjs test/statusTransitionContractTemplate.test.mjs`

Expected: FAIL，因为统一门禁和文档尚未加入新规则。

- [ ] **Step 3: Update docs and verify-change**

将新增测试、`npm run audit:api-contracts`、菜单权限检查加入 `scripts/verify-change.mjs`；文档明确状态矩阵测试样板和菜单查询参数权限规则。

- [ ] **Step 4: Check and execute migration**

Run:

```bash
cd backend
npm run db:migrate -- --check
npm run db:migrate
```

Expected: 仅显示并执行 `20260711_add_design_system_menus.sql`，记录进入 `pms_migrations`。

- [ ] **Step 5: Run complete gate**

Run:

```bash
cd /Users/sunxinxin/Documents/Project/project-template
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/verify-change.mjs
```

Expected: 前后端测试通过、组件和 API 审计 0 阻断、前端构建成功。

- [ ] **Step 6: Restart and verify services**

使用现有 launchctl 服务重启前后端，确认：

```bash
curl -f http://127.0.0.1:3101/api/health
curl -f http://127.0.0.1:3102/
```

Expected: 两者 200，健康接口显示数据库已连接。

- [ ] **Step 7: Browser smoke test**

管理员验证全部工作台菜单；创建或使用测试角色验证只授权单个分类时只显示对应子菜单，修改查询参数不能进入未授权分类；同时核对基础设置位于用户权限上方。

- [ ] **Step 8: Commit and push**

```bash
git add AGENTS.md docs scripts frontend/test
git commit -m "docs: enforce semantic and menu permission delivery"
git push origin master
```
