import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const rules = readFileSync('../docs/ai-development-rules.md', 'utf8');

test('AI 开发规则提供状态流转矩阵测试样板', () => {
  assert.match(rules, /statusTransitions/);
  assert.match(rules, /允许的来源状态和目标状态/);
  assert.match(rules, /禁止的跨级或反向流转/);
  assert.match(rules, /附加字段/);
  assert.match(rules, /前端可选目标.*后端校验/);
});
