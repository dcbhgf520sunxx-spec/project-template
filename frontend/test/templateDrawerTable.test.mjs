import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const templateUrl = new URL('../src/components/admin/TemplateDrawerTable/index.tsx', import.meta.url);
const templateSource = existsSync(templateUrl) ? readFileSync(templateUrl, 'utf8') : '';
const componentExports = readFileSync(new URL('../src/components/admin/index.ts', import.meta.url), 'utf8');
const workbenchSource = readFileSync(
  new URL('../src/modules/design-system/pages/DesignSystemPage.tsx', import.meta.url),
  'utf8'
);
const searchTableSource = readFileSync(
  new URL('../src/components/admin/SearchTable/index.tsx', import.meta.url),
  'utf8'
);

test('抽屉表格模板复用内嵌列表模板', () => {
  assert.ok(templateSource.includes('<AdminDrawer'));
  assert.ok(templateSource.includes('<TemplateListPage<T, P>'));
  assert.ok(templateSource.includes('embedded'));
  assert.ok(componentExports.includes("export * from './TemplateDrawerTable'"));
});

test('组件工作台通过抽屉表格模板和列表数据 Hook 组装示例', () => {
  assert.ok(workbenchSource.includes('<TemplateDrawerTable<DrawerTableRecord>'));
  assert.ok(workbenchSource.includes('ComponentEntry name="AdminModal / AdminDrawer / TemplateDrawerTable / StatusFlowModal"'));
  assert.ok(workbenchSource.includes('useTemplateListPageData({\n    rows: tableDrawerFilteredRows'));
  assert.ok(workbenchSource.includes('onChange: handleTableDrawerTableChange'));
  assert.equal(workbenchSource.includes('useDrawerTableScrollY'), false);
});

test('表格支持独立 preferenceKey 隔离列宽、密度和列设置', () => {
  assert.ok(searchTableSource.includes('preferenceKey?: string'));
  assert.ok(searchTableSource.includes("preferenceKey || location.pathname"));
});

test('抽屉表格批量删除使用统一 DeleteConfirmAction', () => {
  const drawerTemplateSource = workbenchSource.slice(workbenchSource.indexOf('<TemplateDrawerTable<DrawerTableRecord>'));

  assert.ok(drawerTemplateSource.includes('<DeleteConfirmAction'));
  assert.equal(drawerTemplateSource.includes('<ConfirmAction'), false);
});
