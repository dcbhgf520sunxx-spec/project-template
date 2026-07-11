import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const componentSource = readFileSync(
  new URL('../src/components/admin/DetailNeighborNav/index.tsx', import.meta.url),
  'utf8'
);

test('详情条目切换只显示箭头，并用简洁数字展示当前位置', () => {
  assert.equal(componentSource.includes('>\n        上一条\n'), false);
  assert.equal(componentSource.includes('>\n        下一条\n'), false);
  assert.equal(componentSource.includes('`第 ${ordinal} / ${total} 条`'), false);
  assert.ok(componentSource.includes('`${ordinal} / ${total}`'));
  assert.ok(componentSource.includes('aria-label="上一条"'));
  assert.ok(componentSource.includes('aria-label="下一条"'));
});
