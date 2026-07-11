import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDetailNeighborPath, createDetailNeighborContext } from '../src/components/admin/DetailNeighborNav/detailNeighbors.ts';

test('详情邻居导航按路由根和记录 id 生成详情路径', () => {
  assert.equal(buildDetailNeighborPath('/work-orders', 12), '/work-orders/12');
  assert.equal(buildDetailNeighborPath('/work-orders/', '13'), '/work-orders/13');
});

test('详情邻居上下文保留模块、路由和查询参数', () => {
  const context = createDetailNeighborContext({
    moduleKey: 'work-order',
    routeBase: '/work-orders',
    params: {
      status: 1,
      sort_field: 'submit_time',
      sort_order: 'ascend'
    }
  });

  assert.equal(context.moduleKey, 'work-order');
  assert.equal(context.routeBase, '/work-orders');
  assert.deepEqual(context.params, {
    status: 1,
    sort_field: 'submit_time',
    sort_order: 'ascend'
  });
  assert.equal(typeof context.savedAt, 'number');
});
