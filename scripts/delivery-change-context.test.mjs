import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDeliveryChangeContext } from './delivery-change-context.mjs';

test('treats an exported project without Git history as its own baseline', () => {
  const context = resolveDeliveryChangeContext({
    currentRoutes: "{ path: 'orders', element: <Orders /> }",
    hasGitBaseline: false
  });

  assert.deepEqual(context, { changedFiles: [], changedRouteRoots: [] });
});

test('reports routes and files added after an existing Git baseline', () => {
  const context = resolveDeliveryChangeContext({
    currentRoutes: "{ path: 'orders', element: <Orders /> }\n{ path: 'users', element: <Users /> }",
    baseRoutes: "{ path: 'orders', element: <Orders /> }",
    statusOutput: '?? backend/db/migrations/add-users.sql\n',
    hasGitBaseline: true
  });

  assert.deepEqual(context, {
    changedFiles: ['backend/db/migrations/add-users.sql'],
    changedRouteRoots: ['/users']
  });
});
