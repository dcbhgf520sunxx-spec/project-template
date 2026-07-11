import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routesSource = readFileSync(new URL('../src/app/routes.tsx', import.meta.url), 'utf8');

test('lazy route pages are rendered inside a Suspense boundary', () => {
  assert.match(routesSource, /function withRouteSuspense/);
  assert.ok(
    routesSource.includes('element: withRouteSuspense(<AiAssistant3DPage />)'),
    'top-level lazy route should be wrapped'
  );
  assert.ok(
    routesSource.includes('element: withRouteSuspense(<WorkOrderListPage />)'),
    'nested lazy route should be wrapped'
  );
});
