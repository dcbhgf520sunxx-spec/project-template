import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

test('运维工单列表单条删除必须走 DeleteConfirmAction', () => {
  const listSource = read('src/modules/work-order/pages/WorkOrderListPage.tsx');
  const columnsSource = read('src/modules/work-order/pages/WorkOrderListColumns.tsx');

  assert.doesNotMatch(listSource, /title="确认删除"[\s\S]*okButtonProps=\{\{ danger: true \}\}/, '列表单条删除不应直接用 AdminModal + danger 按钮');
  assert.match(columnsSource, /DeleteConfirmAction/, '列表操作列应使用 DeleteConfirmAction');
  assert.match(columnsSource, /entityName="工单"/);
  assert.match(columnsSource, /targetName=\{record\.problemDesc\}/);
});

test('运维工单批量删除使用 DeleteConfirmAction 默认危险内容结构', () => {
  const source = read('src/modules/work-order/pages/useWorkOrderBatchActions.tsx');

  assert.match(source, /<DeleteConfirmAction/);
  assert.match(source, /entityName="选中的"/);
  assert.match(source, /targetName=\{`\$\{selectedRecords\.length\} 项工单`\}/);
  assert.doesNotMatch(source, /work-order-list-page__batch-delete-risk/, '批量删除不应自定义业务风险样式');
});

test('运维工单详情删除必须走 DeleteConfirmAction', () => {
  const source = read('src/modules/work-order/pages/WorkOrderDetailPage.tsx');

  assert.match(source, /DeleteConfirmAction/, '详情页应导入并使用 DeleteConfirmAction');
  assert.doesNotMatch(source, /<ConfirmAction\s+danger/, '详情删除不应只走通用 ConfirmAction danger');
  assert.match(source, /entityName="工单"/);
  assert.match(source, /targetName=\{detail\.problemDesc\}/);
});
