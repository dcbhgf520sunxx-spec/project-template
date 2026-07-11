import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('StatusChangeAction 统一承接状态入口和状态弹窗', () => {
  const source = read('src/components/admin/StatusChangeAction/index.tsx');
  assert.match(source, /PermissionButton/);
  assert.match(source, /<StatusFlowModal/);
  assert.match(source, /selectedOption\?\.tone \|\| 'normal'/);
  assert.match(source, /variant === 'text'/);
  assert.match(source, /admin-text-action/);
});

test('StatusFlowModal 根据目标状态映射普通正向危险语义', () => {
  const source = read('src/components/admin/StatusFlowModal/index.tsx');
  assert.match(source, /StatusFlowTone = 'normal' \| 'success' \| 'danger'/);
  assert.match(source, /titleTone=\{tone === 'success' \? 'positive' : tone\}/);
  assert.match(source, /danger: tone === 'danger'/);
  assert.match(source, /confirmLoading=\{confirming\}/);
});

test('组件公共入口只导出新的状态动作', () => {
  const source = read('src/components/admin/index.ts');
  assert.match(source, /export \* from '\.\/StatusChangeAction'/);
});
