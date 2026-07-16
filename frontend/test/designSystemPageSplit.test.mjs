import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pageRoot = new URL('../src/modules/design-system/pages/', import.meta.url);

function read(relativePath) {
  return readFileSync(new URL(relativePath, pageRoot), 'utf8');
}

test('组件工作台按分类拆分，主页面只负责分类装配', () => {
  const page = read('DesignSystemPage.tsx');
  const sections = [
    ['LayoutSection.tsx', 'LayoutSection.css', '<LayoutSection />'],
    ['DisplaySection.tsx', 'DisplaySection.css', '<DisplaySection />'],
    ['FeedbackSection.tsx', 'FeedbackSection.css', '<FeedbackSection />']
  ];

  for (const [componentFile, styleFile, usage] of sections) {
    const section = read(`sections/${componentFile}`);
    read(`sections/${styleFile}`);
    assert.match(section, new RegExp(`import './${styleFile.replace('.', '\\.')}'`));
    assert.ok(page.includes(usage), `${componentFile} 应由主页面直接装配`);
  }

  assert.ok(page.split('\n').length <= 130, 'DesignSystemPage.tsx 应只保留分类装配职责');
  for (const implementationDetail of [
    'layoutPatterns',
    'displayTableColumns',
    'StatusFlowModal',
    'TemplateDrawerTable',
    'useAdminFeedback'
  ]) {
    assert.ok(!page.includes(implementationDetail), `主页面不应继续持有 ${implementationDetail}`);
  }
});
