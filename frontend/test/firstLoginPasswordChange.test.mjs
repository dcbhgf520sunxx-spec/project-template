import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const modalUrl = new URL('../src/modules/account/components/PasswordChangeModal.tsx', import.meta.url);
const loginPage = readFileSync(new URL('../src/modules/auth/pages/LoginPage.tsx', import.meta.url), 'utf8');
const authStore = readFileSync(new URL('../src/stores/authStore.ts', import.meta.url), 'utf8');
const adminLayout = readFileSync(new URL('../src/layouts/AdminLayout/index.tsx', import.meta.url), 'utf8');
const passwordModal = existsSync(modalUrl) ? readFileSync(modalUrl, 'utf8') : '';

test('首次登录必须完成改密后才能进入业务页面', () => {
  assert.match(loginPage, /result\.first_login === 1/);
  assert.match(loginPage, /<PasswordChangeModal[\s\S]*forced/);
  assert.match(authStore, /mustChangePassword/);
  assert.match(adminLayout, /if \(mustChangePassword\)[\s\S]*<Navigate to="\/login" replace/);
});

test('首次改密允许关闭并退出登录，保存时禁用关闭', () => {
  assert.match(passwordModal, /closable=\{!saving\}/);
  assert.match(passwordModal, /maskClosable=\{!forced && !saving\}/);
  assert.match(passwordModal, /cancelText=\{forced \? '退出登录'/);
  assert.match(loginPage, /onCancel=\{exitFirstLogin\}/);
  assert.match(passwordModal, /changeCurrentPassword/);
});
