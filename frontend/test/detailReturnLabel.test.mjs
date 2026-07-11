import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const detailPageFiles = [
  'src/modules/user/pages/UserDetailPage.tsx',
  'src/modules/role/pages/RoleDetailPage.tsx',
  'src/modules/work-order/pages/WorkOrderDetailPage.tsx',
  'src/modules/work-order-template/pages/WorkOrderTemplateDetailPage.tsx',
  'src/modules/design-system/pages/demos/DetailTemplateDemo.tsx'
];

test('详情页返回按钮统一显示返回列表', () => {
  for (const file of detailPageFiles) {
    const source = readFileSync(join(new URL('..', import.meta.url).pathname, file), 'utf8');
    assert.doesNotMatch(source, />返回</, `${file} 不应再显示“返回”`);
  }
});
