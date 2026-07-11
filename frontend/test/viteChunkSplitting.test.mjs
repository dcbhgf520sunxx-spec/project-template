import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Vite build keeps large framework dependencies in stable cacheable groups', async () => {
  const source = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');

  assert.match(source, /rolldownOptions/);
  assert.match(source, /codeSplitting/);
  for (const name of [
    'react-vendor',
    'pro-core-vendor',
    'pro-form-vendor',
    'pro-table-vendor',
    'pro-layout-vendor',
    'pro-support-vendor',
    'antd-vendor',
    'ant-design-vendor',
    'rc-vendor',
    'charts-vendor',
    'three-vendor'
  ]) {
    assert.match(source, new RegExp(`name:\\s*['\"]${name}['\"]`));
  }
  assert.match(source, /strictExecutionOrder:\s*true/);
  assert.doesNotMatch(source, /maxSize:/);
  assert.match(source, /chunkSizeWarningLimit:\s*900/);
});
