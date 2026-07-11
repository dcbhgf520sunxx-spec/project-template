import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/modules/work-order/pages/WorkOrderDetailPage.tsx', import.meta.url), 'utf8');

test('工单详情上一条下一条放在标题栏中间，不单独占用详情内容行', () => {
  assert.equal(source.includes('neighborNav={'), false);
  const titleCenterIndex = source.indexOf('titleCenter={');
  const detailNeighborIndex = source.indexOf('<DetailNeighborNav');

  assert.ok(titleCenterIndex >= 0, '应保留详情标题中间区');
  assert.ok(detailNeighborIndex > titleCenterIndex, '详情邻居导航应放进 titleCenter 内');
});
