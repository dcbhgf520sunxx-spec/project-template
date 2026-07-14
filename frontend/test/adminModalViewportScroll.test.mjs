import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const modalStyles = readFileSync(new URL('../src/components/admin/AdminModal/index.css', import.meta.url), 'utf8');

test('AdminModal 将长内容限制在视口内并只滚动正文', () => {
  assert.match(modalStyles, /\.admin-modal \.ant-modal-content\s*\{[\s\S]*max-height:\s*calc\(100(?:dvh|vh)\s*-\s*32px\)/);
  assert.match(modalStyles, /\.admin-modal \.ant-modal-content\s*\{[\s\S]*display:\s*flex[\s\S]*flex-direction:\s*column[\s\S]*overflow:\s*hidden/);
  assert.match(modalStyles, /\.admin-modal \.ant-modal-body\s*\{[\s\S]*min-height:\s*0[\s\S]*overflow-y:\s*auto/);
});
