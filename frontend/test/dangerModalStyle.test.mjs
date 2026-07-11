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

test('危险确认弹窗统一带危险样式容器和警示区样式', () => {
  const source = read('src/components/admin/ConfirmAction/index.tsx');
  const css = read('src/components/admin/ConfirmAction/index.css');

  assert.match(
    source,
    /const modalClassName = danger \? 'admin-confirm-action-modal is-danger' : 'admin-confirm-action-modal';/,
    'ConfirmAction danger 弹窗应统一挂载危险样式容器'
  );
  assert.match(source, /className=\{modalClassName\}/, 'AdminModal 应使用统一弹窗 className');
  assert.match(css, /\.admin-confirm-action-modal\.is-danger/, '应提供危险弹窗统一样式');
  assert.match(css, /\.admin-confirm-action__danger-risk/, '应提供危险警示区统一样式');
});

test('危险确认弹窗保持普通尺寸和轻量警示样式', () => {
  const css = read('src/components/admin/ConfirmAction/index.css');

  assert.match(css, /font-size: 16px;\n  font-weight: 650;\n  line-height: 24px;/, '危险弹窗标题保持常规标题尺寸');
  assert.doesNotMatch(css, /font-size: 22px;/, '危险弹窗标题不应使用大号字体');
  assert.match(css, /\.admin-confirm-action__description\.is-danger \{\n  color: var\(--app-steel\);\n\}/, '危险弹窗正文不应单独放大');
  assert.match(css, /font-size: 20px;/, '危险图标应使用图标本身的单圆圈');
  assert.doesNotMatch(css, /border: 1px solid var\(--app-danger\);/, '危险图标不应额外叠加 CSS 外圈');
  assert.match(css, /\.admin-confirm-action__danger-risk \{[\s\S]*font-weight: 400;/, '红色警示框文字不应加粗');
  assert.doesNotMatch(css, /height: 40px;/, '危险弹窗按钮不应被单独放大');
});

test('删除确认使用统一危险内容和警示区', () => {
  const source = read('src/components/admin/DeleteConfirmAction/index.tsx');

  assert.match(source, /admin-confirm-action__danger-content/);
  assert.match(source, /admin-confirm-action__danger-risk/);
  assert.match(source, /删除后无法恢复，请谨慎操作。/);
});

test('停用确认使用统一危险内容和警示区', () => {
  const source = read('src/components/admin/StatusConfirmAction/index.tsx');

  assert.match(source, /admin-confirm-action__danger-content/);
  assert.match(source, /admin-confirm-action__danger-risk/);
  assert.match(source, /停用后将暂不可用，请谨慎操作。/);
});
