import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { enforceFixedColumnState } from '../src/components/admin/SearchTable/columnState.ts';
import { getCollapsedVisibleCount } from '../src/components/admin/CompactFilterBar/layout.ts';

test('代码声明的固定列覆盖历史列设置', () => {
  const result = enforceFixedColumnState(
    [
      { key: 'index', fixed: 'left' as const },
      { key: 'name', fixed: 'left' as const },
      { key: 'owner' },
      { key: 'option', fixed: 'right' as const }
    ],
    {
      index: { fixed: 'left' },
      name: { fixed: undefined, show: true },
      owner: { fixed: 'left', show: true },
      option: { fixed: undefined },
      legacyOptionKey: { fixed: 'left', show: true }
    }
  );
  assert.equal(result.index.fixed, 'left');
  assert.equal(result.name.fixed, 'left');
  assert.equal(result.option.fixed, 'right');
  assert.equal(result.owner.fixed, undefined);
  assert.equal(result.legacyOptionKey.fixed, undefined);
  assert.equal(result.name.show, true);
});

test('筛选收起数量取配置数量和当前一行容量的较小值', () => {
  assert.equal(getCollapsedVisibleCount(3, 5, 4), 3);
  assert.equal(getCollapsedVisibleCount(3, 5, 2), 2);
  assert.equal(getCollapsedVisibleCount(4, 5, 1), 1);
  assert.equal(getCollapsedVisibleCount(6, 4, 2), 2);
});

test('组件已接入响应式容量和受控列状态', () => {
  const filter = readFileSync(new URL('../src/components/admin/CompactFilterBar/index.tsx', import.meta.url), 'utf8');
  const table = readFileSync(new URL('../src/components/admin/SearchTable/index.tsx', import.meta.url), 'utf8');
  assert.match(filter, /ResizeObserver/);
  assert.match(filter, /getCollapsedVisibleCount/);
  assert.match(table, /enforceFixedColumnState/);
  assert.match(table, /columnsState=\{/);
  assert.match(table, /key: columnKey/);
});
