import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('停用状态操作默认使用 danger 语义', () => {
  const source = readFileSync(new URL('../src/components/admin/StatusConfirmAction/index.tsx', import.meta.url), 'utf8');

  assert.match(source, /danger=\{[^}]*action\s*===\s*'disable'/);
});

test('组件工作台的批量删除示例使用红色危险按钮', () => {
  const source = readFileSync(new URL('../src/modules/design-system/pages/DesignSystemPage.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /<AdminButton size="small"[^>]*>批量删除<\/AdminButton>/);
});
