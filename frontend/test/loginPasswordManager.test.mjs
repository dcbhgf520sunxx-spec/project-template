import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const source = readFileSync(resolve(root, 'src/modules/auth/pages/LoginPage.tsx'), 'utf8');

test('登录表单提供浏览器密码管理器可识别的标准语义', () => {
  assert.match(source, /<form[^>]*autoComplete="on"/);
  assert.match(source, /id="login-username"/);
  assert.match(source, /name="username"/);
  assert.match(source, /autoComplete="username"/);
  assert.match(source, /id="login-password"/);
  assert.match(source, /name="password"/);
  assert.match(source, /autoComplete="current-password"/);
});
