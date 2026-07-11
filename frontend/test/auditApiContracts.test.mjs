import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const scriptPath = new URL('../scripts/audit-api-contracts.mjs', import.meta.url).pathname;

function runAudit(source) {
  const apiDir = mkdtempSync(join(tmpdir(), 'api-contract-audit-'));
  writeFileSync(join(apiDir, 'sampleApi.ts'), source);
  const result = spawnSync(process.execPath, [scriptPath, '--api-dir', apiDir], { encoding: 'utf8' });
  rmSync(apiDir, { recursive: true, force: true });
  return result;
}

test('读取对象接口缺少运行时契约时阻断', () => {
  const result = runAudit('export async function detail(){ return unwrap<Row>(request.get("/items/1")); }');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /运行时契约/);
});

test('读取数组接口缺少 arrayContract 时阻断', () => {
  const result = runAudit('export async function list(){ return unwrap<Row[]>(request.get("/items")); }');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /arrayContract/);
});

test('读取接口声明契约时允许', () => {
  const result = runAudit('const rowsContract=arrayContract(objectContract(["id"])); export async function list(){ return unwrap(request.get("/items"), rowsContract); }');
  assert.equal(result.status, 0, result.stdout);
});

test('返回 null 的写入接口允许省略契约', () => {
  const result = runAudit('export async function remove(){ return unwrap<null>(request.delete("/items/1")); }');
  assert.equal(result.status, 0, result.stdout);
});

test('返回对象的写入接口缺少契约时阻断', () => {
  const result = runAudit('export async function create(){ return unwrap<{id:number}>(request.post("/items",{})); }');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /对象返回值/);
});
