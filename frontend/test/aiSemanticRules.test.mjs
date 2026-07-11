import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('AI 页面规则明确操作列、状态动作和详情状态位置', () => {
  const rules = read('../docs/ai-development-rules.md');
  assert.match(rules, /DeleteConfirmAction/);
  assert.match(rules, /StatusChangeAction/);
  assert.match(rules, /titleTags/);
  assert.match(rules, /statusAction/);
  assert.doesNotMatch(rules, /删除、停用等危险动作使用 `ConfirmAction`/);
});

test('AI 交付链路要求语义审计和浏览器检查', () => {
  const flow = read('../docs/ai-delivery-flow.md');
  const template = read('../docs/ai-delivery-template.md');
  assert.match(flow, /JSX 语义审计/);
  assert.match(flow, /标题状态标签/);
  assert.match(template, /操作列文字动作/);
  assert.match(template, /状态操作位置/);
});

test('统一门禁包含新增的语义约束测试', () => {
  const gate = read('../scripts/verify-change.mjs');
  for (const name of [
    'statusChangeAction.test.mjs',
    'detailStatusPlacement.test.mjs',
    'obsoleteStatusFlowAction.test.mjs',
    'aiSemanticRules.test.mjs',
    'auditApiContracts.test.mjs',
    'designSystemMenuPermissions.test.mjs'
  ]) {
    assert.match(gate, new RegExp(name.replaceAll('.', '\\.')));
  }
  assert.match(gate, /audit:api-contracts/);
});

test('AI 链路要求完整地址菜单权限和状态组件溯源', () => {
  const rules = read('../docs/ai-development-rules.md');
  const agents = read('../AGENTS.md');
  assert.match(rules, /完整地址/);
  assert.match(rules, /查询参数/);
  assert.match(rules, /业务状态组件.*公共 `StatusChangeAction`/);
  assert.match(agents, /组件工作台.*独立授权/);
});
