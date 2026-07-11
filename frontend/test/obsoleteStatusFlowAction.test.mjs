import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('旧 StatusFlowAction 已彻底删除且公共入口不再导出', () => {
  assert.equal(existsSync('src/components/admin/StatusFlowAction'), false);
  const barrel = readFileSync('src/components/admin/index.ts', 'utf8');
  assert.doesNotMatch(barrel, /StatusFlowAction/);
  assert.match(barrel, /StatusChangeAction/);
});
