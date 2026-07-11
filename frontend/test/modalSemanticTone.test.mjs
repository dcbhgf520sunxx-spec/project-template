import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('AdminModal 支持普通、正向、危险标题语义', () => {
  const source = readFileSync(new URL('../src/components/admin/AdminModal/index.tsx', import.meta.url), 'utf8');

  assert.match(source, /titleTone\?: 'normal' \| 'positive' \| 'danger'/);
  assert.match(source, /positive:\s*CheckCircleOutlined/);
  assert.match(source, /danger:\s*ExclamationCircleOutlined/);
  assert.match(source, /normal:\s*InfoCircleOutlined/);
});

test('ConfirmAction 根据 danger 传递弹窗标题语义', () => {
  const source = readFileSync(new URL('../src/components/admin/ConfirmAction/index.tsx', import.meta.url), 'utf8');

  assert.match(source, /titleTone=\{danger \? 'danger' : 'normal'\}/);
});

test('停用弹窗标题图标使用红色危险语义', () => {
  const source = readFileSync(new URL('../src/components/admin/StatusConfirmAction/index.css', import.meta.url), 'utf8');

  assert.match(source, /\.admin-status-confirm-action__title\.is-disable \.anticon\s*\{[^}]*var\(--app-danger/);
});
