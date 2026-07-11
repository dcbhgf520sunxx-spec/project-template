import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const scriptPath = new URL('../scripts/audit-component-usage.mjs', import.meta.url).pathname;

test('组件审计阻断绕开 TemplateListPage 的业务列表', () => {
  const modulesDir = mkdtempSync(join(tmpdir(), 'component-audit-'));
  const pagePath = join(modulesDir, 'ArchivePage.tsx');
  writeFileSync(pagePath, 'export function ArchivePage() { return <SearchTable />; }');

  try {
    const result = spawnSync(process.execPath, [scriptPath, '--strict', '--modules-dir', modulesDir], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /TemplateListPage/);
  } finally {
    rmSync(modulesDir, { recursive: true, force: true });
  }
});

test('组件审计阻断在 AdminDrawer 中直接拼 TemplateListPage', () => {
  const modulesDir = mkdtempSync(join(tmpdir(), 'component-audit-'));
  const pagePath = join(modulesDir, 'RelatedRecordPage.tsx');
  writeFileSync(pagePath, 'export function RelatedRecordPage() { return <AdminDrawer><TemplateListPage /></AdminDrawer>; }');

  try {
    const result = spawnSync(process.execPath, [scriptPath, '--strict', '--modules-dir', modulesDir], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /TemplateDrawerTable/);
  } finally {
    rmSync(modulesDir, { recursive: true, force: true });
  }
});

test('组件审计阻断业务页直接使用 antd Tree', () => {
  const modulesDir = mkdtempSync(join(tmpdir(), 'component-audit-'));
  const pagePath = join(modulesDir, 'RoleFormPage.tsx');
  writeFileSync(pagePath, 'export function RoleFormPage() { return <Tree checkable />; }');

  try {
    const result = spawnSync(process.execPath, [scriptPath, '--strict', '--modules-dir', modulesDir], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /AdminTree/);
  } finally {
    rmSync(modulesDir, { recursive: true, force: true });
  }
});

test('组件审计阻断业务页直接使用 ProForm.Item', () => {
  const modulesDir = mkdtempSync(join(tmpdir(), 'component-audit-'));
  const pagePath = join(modulesDir, 'WorkOrderFormPage.tsx');
  writeFileSync(pagePath, 'export function WorkOrderFormPage() { return <ProForm.Item name="problemDesc" />; }');

  try {
    const result = spawnSync(process.execPath, [scriptPath, '--strict', '--modules-dir', modulesDir], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /AdminProForm/);
  } finally {
    rmSync(modulesDir, { recursive: true, force: true });
  }
});

test('组件审计阻断业务页直接使用 antd Button', () => {
  const modulesDir = mkdtempSync(join(tmpdir(), 'component-audit-'));
  const pagePath = join(modulesDir, 'UserDetailPage.tsx');
  writeFileSync(pagePath, 'export function UserDetailPage() { return <Button onClick={() => {}}>返回</Button>; }');

  try {
    const result = spawnSync(process.execPath, [scriptPath, '--strict', '--modules-dir', modulesDir], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /AdminButton/);
  } finally {
    rmSync(modulesDir, { recursive: true, force: true });
  }
});

test('组件审计阻断业务页直接使用 Typography.Text', () => {
  const modulesDir = mkdtempSync(join(tmpdir(), 'component-audit-'));
  const pagePath = join(modulesDir, 'WorkOrderTemplatePage.tsx');
  writeFileSync(pagePath, 'export function WorkOrderTemplatePage() { return <Typography.Text type="warning">状态不一致</Typography.Text>; }');

  try {
    const result = spawnSync(process.execPath, [scriptPath, '--strict', '--modules-dir', modulesDir], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /AdminText/);
  } finally {
    rmSync(modulesDir, { recursive: true, force: true });
  }
});

test('组件审计阻断 FormPage 绕开 TemplateFormPage', () => {
  const modulesDir = mkdtempSync(join(tmpdir(), 'component-audit-'));
  writeFileSync(join(modulesDir, 'CustomerFormPage.tsx'), 'export function CustomerFormPage() { return <PageShell><AdminInput /></PageShell>; }');

  try {
    const result = spawnSync(process.execPath, [scriptPath, '--strict', '--modules-dir', modulesDir], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /TemplateFormPage/);
  } finally {
    rmSync(modulesDir, { recursive: true, force: true });
  }
});

test('组件审计阻断 DetailPage 绕开 TemplateDetailPage', () => {
  const modulesDir = mkdtempSync(join(tmpdir(), 'component-audit-'));
  writeFileSync(join(modulesDir, 'CustomerDetailPage.tsx'), 'export function CustomerDetailPage() { return <PageShell><AdminCard /></PageShell>; }');

  try {
    const result = spawnSync(process.execPath, [scriptPath, '--strict', '--modules-dir', modulesDir], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /TemplateDetailPage/);
  } finally {
    rmSync(modulesDir, { recursive: true, force: true });
  }
});
