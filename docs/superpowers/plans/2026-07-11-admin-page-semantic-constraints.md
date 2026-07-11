# Admin Page Semantic Constraints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make list actions, detail status placement, status dialogs, and dangerous confirmations structurally consistent and automatically enforceable for every business module.

**Architecture:** Replace the obsolete combined status component with a single `StatusChangeAction` that owns `StatusFlowModal`. Extend `TemplateDetailPage` with semantic `titleTags` and `statusAction` slots, then use the TypeScript compiler API in the component audit to validate JSX structure rather than only matching component names.

**Tech Stack:** React 18, TypeScript 5, Ant Design 5, Node test runner, existing Vite and delivery verification scripts.

## Global Constraints

- Delete `StatusFlowAction` completely; do not retain a compatibility wrapper or public export.
- Do not add runtime dependencies.
- Do not add PMIS business code, one-time migration notes, trackers, or temporary scripts.
- `normal`, `success`, and `danger` targets map to blue, green, and red modal semantics.
- A detail page with `statusSection` must also use `titleTags` and `statusAction`.
- List deletes use `DeleteConfirmAction variant="text"`; multi-state changes use `StatusChangeAction variant="text"`.
- Run the unified gate with `PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/verify-change.mjs`.

---

### Task 1: Add generic TSX semantic audit rules

**Files:**
- Modify: `frontend/scripts/audit-component-usage.mjs`
- Modify: `frontend/test/auditComponentUsage.test.ts`

**Interfaces:**
- Consumes: existing `--modules-dir` and `--strict` audit CLI options.
- Produces: structural `BLOCK` findings for invalid action columns, detail status placement, direct status-modal usage, and obsolete status imports.

- [ ] **Step 1: Add failing fixture tests**

Add helper-driven cases to `auditComponentUsage.test.ts` that assert strict audit failure for:

```tsx
<OperationColumnActions><AdminButton>状态变更</AdminButton></OperationColumnActions>
<OperationColumnActions><ConfirmAction danger>删除</ConfirmAction></OperationColumnActions>
<TemplateDetailPage statusSection={{ items: [] }} actions={<StatusChangeAction />} />
<StatusFlowModal open />
```

Also add a passing generic module fixture:

```tsx
<TemplateDetailPage
  title="客户详情"
  titleTags={<StatusTag status="enabled" />}
  actions={<AdminButton>编辑</AdminButton>}
  statusSection={{ items: [{ label: '状态', value: '启用' }] }}
  statusAction={<StatusConfirmAction action="disable">停用</StatusConfirmAction>}
>
  <div />
</TemplateDetailPage>
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --experimental-strip-types --test test/auditComponentUsage.test.ts
```

Expected: the new invalid fixtures incorrectly exit with status `0`, or the valid semantic fixture is not recognized.

- [ ] **Step 3: Parse TSX with the existing TypeScript compiler API**

Import `typescript` in the audit script and create a source file per `.tsx` file:

```js
import ts from 'typescript';

function parseTsx(file, source) {
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
```

Walk JSX elements and enforce:

- `OperationColumnActions` direct actions use the approved component set.
- action components under an operation column declare `variant="text"` when applicable.
- delete semantics never use generic `ConfirmAction`.
- business modules never use `StatusFlowModal` or `StatusFlowAction`.
- `TemplateDetailPage` with `statusSection` also has `titleTags` and `statusAction`.
- `TemplateDetailPage.actions` does not contain status action components.

Keep the existing primitive and page-template rules. Print all new findings through the existing `BLOCK file:line token reason` format.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the focused command from Step 2. Expected: all audit tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/scripts/audit-component-usage.mjs frontend/test/auditComponentUsage.test.ts
git commit -m "test: enforce semantic admin page structure"
```

### Task 2: Build the canonical multi-state action and modal tones

**Files:**
- Create: `frontend/src/components/admin/StatusChangeAction/index.tsx`
- Create: `frontend/src/components/admin/StatusChangeAction/index.css`
- Modify: `frontend/src/components/admin/StatusFlowModal/index.tsx`
- Modify: `frontend/src/components/admin/StatusFlowModal/index.css`
- Modify: `frontend/src/components/admin/index.ts`
- Create: `frontend/test/statusChangeAction.test.mjs`

**Interfaces:**
- Consumes: `StatusFlowModal`, `PermissionButton`, and `StatusFlowModalFormValues`.
- Produces: `StatusChangeAction<T>` and `StatusChangeOption<T>` with `tone: 'normal' | 'success' | 'danger'`.

- [ ] **Step 1: Add failing component contract tests**

Assert that:

```text
StatusChangeAction renders PermissionButton
StatusChangeAction passes the selected option tone into StatusFlowModal
StatusFlowModal maps success to titleTone="positive"
StatusFlowModal maps danger to titleTone="danger" and danger okButtonProps
components/admin/index.ts exports StatusChangeAction
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test test/statusChangeAction.test.mjs
```

Expected: FAIL because `StatusChangeAction` does not exist and `StatusFlowModal` has no tone input.

- [ ] **Step 3: Extend StatusFlowModal**

Add:

```ts
export type StatusFlowTone = 'normal' | 'success' | 'danger';

type StatusFlowModalProps<T extends StatusFlowValue = StatusFlowValue> = {
  tone?: StatusFlowTone;
  confirming?: boolean;
  // existing props remain
};
```

Map tone inside `AdminModal`:

```tsx
titleTone={tone === 'success' ? 'positive' : tone}
confirmLoading={confirming}
okButtonProps={{ danger: tone === 'danger', disabled: targetValue === undefined }}
```

- [ ] **Step 4: Implement StatusChangeAction**

The component owns `open`, `target`, and `confirming`, and uses `App.useApp()` for failure feedback. Its option contract is:

```ts
export type StatusChangeOption<T extends StatusFlowValue> = StatusFlowModalOption<T> & {
  tone: StatusFlowTone;
};
```

Its button contract supports `variant?: 'button' | 'text'`, `permission`, current display, modal labels, `renderExtra`, and async `onConfirm`. Text mode uses `PermissionButton type="link" size="small" className="admin-text-action"`.

On successful confirmation, close and reset the target. On failure, call `message.error(error instanceof Error ? error.message : '操作失败，请稍后重试')`, keep the modal open, and clear `confirming` in `finally`.

- [ ] **Step 5: Run focused and full frontend tests**

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test test/statusChangeAction.test.mjs
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/admin/StatusChangeAction frontend/src/components/admin/StatusFlowModal frontend/src/components/admin/index.ts frontend/test/statusChangeAction.test.mjs
git commit -m "feat: add semantic status change action"
```

### Task 3: Make detail status placement semantic and migrate baseline pages

**Files:**
- Modify: `frontend/src/components/admin/TemplateDetailPage/index.tsx`
- Modify: `frontend/src/components/admin/TemplateDetailPage/index.css`
- Modify: `frontend/src/modules/user/pages/UserDetailPage.tsx`
- Modify: `frontend/src/modules/work-order/pages/WorkOrderDetailPage.tsx`
- Modify: `frontend/src/modules/work-order-template/pages/WorkOrderTemplateDetailPage.tsx`
- Modify: `frontend/test/templatePageState.test.mjs`
- Modify: `frontend/test/workOrderDetailNeighborPlacement.test.mjs`
- Create: `frontend/test/detailStatusPlacement.test.mjs`

**Interfaces:**
- Consumes: existing `TemplateDetailPage` callers and status components.
- Produces: `titleTags?: ReactNode` and `statusAction?: ReactNode` rendered by the template.

- [ ] **Step 1: Add failing placement tests**

Assert that `TemplateDetailPage`:

```text
passes titleTags into PageShell titleExtra
renders statusAction inside the current-status side section
does not require either prop for details without statusSection
```

Assert that user, work-order, and work-order-template details pass `titleTags` and `statusAction`, and no longer place status actions in `actions` or custom `statusSection.children` wrappers.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test test/detailStatusPlacement.test.mjs test/templatePageState.test.mjs test/workOrderDetailNeighborPlacement.test.mjs
```

- [ ] **Step 3: Extend TemplateDetailPage**

Add semantic props:

```ts
titleTags?: ReactNode;
statusAction?: ReactNode;
```

Use `titleTags` as the canonical `PageShell.titleExtra`. Render `statusAction` in a dedicated `.admin-template-detail-page__status-action` container after status-section content. Remove `titleExtra` from `TemplateDetailPageProps` and migrate every bottom-layer detail caller so two competing title APIs cannot remain.

- [ ] **Step 4: Migrate baseline details**

- User detail: title status tag; enable/disable action in `statusAction`; header keeps edit only.
- Work order detail: code, status, urgency, and overdue in `titleTags`; status button in `statusAction`; header keeps edit, copy, delete.
- Work-order template detail: same structure as the real work-order page.

- [ ] **Step 5: Run focused tests, strict audit, and build**

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test test/detailStatusPlacement.test.mjs test/templatePageState.test.mjs test/workOrderDetailNeighborPlacement.test.mjs
npm run audit:components:strict
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/admin/TemplateDetailPage frontend/src/modules/user/pages/UserDetailPage.tsx frontend/src/modules/work-order/pages/WorkOrderDetailPage.tsx frontend/src/modules/work-order-template/pages/WorkOrderTemplateDetailPage.tsx frontend/test
git commit -m "feat: enforce semantic detail status placement"
```

### Task 4: Delete the obsolete component and update the workbench

**Files:**
- Delete: `frontend/src/components/admin/StatusFlowAction/index.tsx`
- Delete: `frontend/src/components/admin/StatusFlowAction/index.css`
- Modify: `frontend/src/components/admin/index.ts`
- Modify: `frontend/src/modules/design-system/pages/demos/OverlayTemplateDemo.tsx`
- Modify: `frontend/src/modules/design-system/pages/DesignSystemPage.tsx`
- Modify: `frontend/test/overlayTemplateDemo.test.mjs`
- Create: `frontend/test/obsoleteStatusFlowAction.test.mjs`

**Interfaces:**
- Consumes: `StatusChangeAction` from Task 2.
- Produces: no public or filesystem entry for `StatusFlowAction`; workbench examples for normal, success, and danger status targets.

- [ ] **Step 1: Add the failing removal and workbench tests**

Assert that the old directory and barrel export do not exist, while the workbench contains `StatusChangeAction` plus options using all three tones.

- [ ] **Step 2: Run and verify RED**

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test test/obsoleteStatusFlowAction.test.mjs test/overlayTemplateDemo.test.mjs
```

- [ ] **Step 3: Remove the old component and migrate demos**

Delete both obsolete files and the export. Replace direct business-style demo triggers with `StatusChangeAction`; retain a direct `StatusFlowModal` example only in the component workbench area where the modal itself is being demonstrated.

- [ ] **Step 4: Run focused and full frontend tests**

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test test/obsoleteStatusFlowAction.test.mjs test/overlayTemplateDemo.test.mjs
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test
```

- [ ] **Step 5: Commit**

```bash
git add -A frontend/src/components/admin/StatusFlowAction frontend/src/components/admin/index.ts frontend/src/modules/design-system frontend/test
git commit -m "refactor: remove obsolete status flow action"
```

### Task 5: Harden the AI delivery chain

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/ai-development-rules.md`
- Modify: `docs/ai-delivery-flow.md`
- Modify: `docs/ai-delivery-template.md`
- Modify: `scripts/verify-change.mjs`
- Create: `frontend/test/aiSemanticRules.test.mjs`

**Interfaces:**
- Consumes: final component names and template props from Tasks 2–4.
- Produces: durable AI instructions and a unified gate that always runs the new semantic tests.

- [ ] **Step 1: Add failing documentation contract tests**

Assert that the durable rules mention exact mappings for:

```text
AdminTextAction
StatusConfirmAction variant="text"
StatusChangeAction variant="text"
DeleteConfirmAction variant="text"
TemplateDetailPage.titleTags
TemplateDetailPage.statusAction
normal / success / danger
```

Assert that the old `StatusFlowAction` and the ambiguous statement “危险动作使用 ConfirmAction” are absent.

- [ ] **Step 2: Run and verify RED**

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test test/aiSemanticRules.test.mjs
```

- [ ] **Step 3: Update durable AI rules**

- `AGENTS.md`: component semantic mapping, detail placement, and no internal-path bypass.
- `ai-development-rules.md`: exact scenario-to-component table and detail requirements.
- `ai-delivery-flow.md`: mandatory JSX structure audit and browser semantic checks.
- `ai-delivery-template.md`: checklist for text actions, delete/disable/status components, title tags, status location, and modal tone.
- `verify-change.mjs`: include all new semantic tests in its frontend test command.

- [ ] **Step 4: Run documentation tests and the unified gate**

```bash
cd frontend
PATH=/usr/local/bin:$PATH /usr/local/bin/node --test test/aiSemanticRules.test.mjs
cd ..
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/verify-change.mjs
```

Expected: component audit reports zero blocking/warning findings, frontend and backend tests pass, and the frontend production build succeeds.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md docs/ai-development-rules.md docs/ai-delivery-flow.md docs/ai-delivery-template.md scripts/verify-change.mjs frontend/test/aiSemanticRules.test.mjs
git commit -m "docs: enforce semantic admin page delivery"
```

### Task 6: Browser acceptance, service health, and delivery

**Files:**
- No source files expected.

**Interfaces:**
- Consumes: completed bottom-layer implementation.
- Produces: verified local acceptance evidence and a clean Git branch ready for GitHub.

- [ ] **Step 1: Verify the component workbench**

Open the component workbench and confirm:

- `StatusChangeAction` is visible.
- normal target uses blue title semantics.
- success target uses green title semantics.
- danger target uses red title semantics and danger confirmation.

- [ ] **Step 2: Verify baseline list and detail pages**

Check work-order list and user/work-order details:

- list actions are text actions and overflow behavior remains unchanged.
- title tags appear immediately after the detail title.
- status actions appear in the current-status side section.
- edit/copy/delete remain in the top-right record action area.

- [ ] **Step 3: Re-run final verification and health checks**

```bash
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/verify-change.mjs
curl -f http://127.0.0.1:3101/api/health
curl -f http://127.0.0.1:3102/
git status --short --branch
```

Expected: unified gate passes, both URLs return HTTP 200, and the worktree is clean except for intentional commits not yet pushed.

- [ ] **Step 4: Push after verification**

```bash
git push origin master
```

Expected: GitHub `master` contains the complete bottom-layer semantic constraint implementation. PMIS migration begins only after this push succeeds.
