import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('router enables startTransition compatibility for lazy route changes', async () => {
  const source = await readFile(new URL('../src/app/router.tsx', import.meta.url), 'utf8');
  assert.match(source, /<RouterProvider[\s\S]*future=\{\{\s*v7_startTransition:\s*true\s*\}\}/);
});
