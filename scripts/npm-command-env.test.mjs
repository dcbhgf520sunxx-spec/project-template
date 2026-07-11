import assert from 'node:assert/strict';
import test from 'node:test';
import { getNpmCommandEnv, shouldUseArm64Node } from './npm-command-env.mjs';

test('npm 子命令优先使用指定 Node 目录', () => {
  const env = getNpmCommandEnv({ PATH: '/usr/local/opt/node@24/bin:/usr/bin' }, '/usr/local/bin/npm');

  assert.equal(env.PATH, '/usr/local/bin:/usr/local/opt/node@24/bin:/usr/bin');
});

test('Rosetta 下使用 arm64 Node 执行门禁', () => {
  assert.equal(shouldUseArm64Node({ platform: 'darwin', arch: 'x64', translated: true, nodeExists: true }), true);
  assert.equal(shouldUseArm64Node({ platform: 'darwin', arch: 'arm64', translated: false, nodeExists: true }), false);
  assert.equal(shouldUseArm64Node({ platform: 'darwin', arch: 'x64', translated: false, nodeExists: true }), false);
});
