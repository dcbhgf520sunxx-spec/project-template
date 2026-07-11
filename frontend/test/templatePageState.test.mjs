import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const formTemplateSource = read('src/components/admin/TemplateFormPage/index.tsx');
const detailTemplateSource = read('src/components/admin/TemplateDetailPage/index.tsx');
const formDemoSource = read('src/modules/design-system/pages/demos/FormTemplateDemo.tsx');
const detailDemoSource = read('src/modules/design-system/pages/demos/DetailTemplateDemo.tsx');

test('表单模板通过原生提交事件统一点击和回车提交', () => {
  assert.ok(formTemplateSource.includes('htmlType="submit"'));
  assert.ok(formTemplateSource.includes('form={formId}'));
  assert.equal(formTemplateSource.includes('validateFields()'), false);
  assert.ok(formTemplateSource.includes('onSubmit={handleSubmit}'));
});

test('表单和详情模板统一承接错误、不存在和重试状态', () => {
  for (const source of [formTemplateSource, detailTemplateSource]) {
    assert.ok(source.includes('error?: ReactNode'));
    assert.ok(source.includes('notFound?: boolean'));
    assert.ok(source.includes('onRetry?: () => void'));
    assert.ok(source.includes('<AdminEmptyState'));
  }
});

test('详情模板内置返回列表动作并统一包裹操作栏', () => {
  assert.ok(detailTemplateSource.includes('onBack?: () => void'));
  assert.ok(detailTemplateSource.includes("backText = '返回列表'"));
  assert.ok(detailTemplateSource.includes('<ActionBar>'));
  assert.ok(detailTemplateSource.includes('actions : null'));
});

test('页面模式展示表单和详情异常状态', () => {
  assert.ok(formDemoSource.includes("'error'"));
  assert.ok(formDemoSource.includes("'notFound'"));
  assert.ok(detailDemoSource.includes("'error'"));
  assert.ok(detailDemoSource.includes("'notFound'"));
});
