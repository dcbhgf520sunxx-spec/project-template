import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const frontendRoot = new URL('../', import.meta.url);

test('独立 3D 助手原型路由、模块和专用依赖已彻底移除', () => {
  const routes = readFileSync(new URL('src/app/routes.tsx', frontendRoot), 'utf8');
  const vite = readFileSync(new URL('vite.config.ts', frontendRoot), 'utf8');
  const pkg = JSON.parse(readFileSync(new URL('package.json', frontendRoot), 'utf8'));

  assert.doesNotMatch(routes, /ai-assistant-3d|AiAssistant3DPage/);
  assert.equal(existsSync(new URL('src/modules/ai-assistant-3d', frontendRoot)), false);
  assert.equal(pkg.dependencies['@react-three/fiber'], undefined);
  assert.equal(pkg.dependencies.three, undefined);
  assert.equal(pkg.devDependencies['@types/three'], undefined);
  assert.doesNotMatch(vite, /three-vendor/);
});
