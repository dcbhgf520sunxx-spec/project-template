import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import test from 'node:test';
import { createServer } from 'vite';

test('版本页面展示本项目当前版本、空历史和折叠历史摘要', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { ReleaseNotesPage } = await server.ssrLoadModule('/src/modules/release-notes/pages/ReleaseNotesPage.tsx');
    const { currentRelease, releaseNotes } = await server.ssrLoadModule('/src/modules/release-notes/releaseNotes.ts');
    const markup = renderToStaticMarkup(createElement(ReleaseNotesPage));
    assert.ok(markup.includes(currentRelease.version));
    assert.ok(markup.includes(currentRelease.summary));
    assert.match(markup, /本次更新/);
    assert.match(markup, /新增功能/);
    assert.doesNotMatch(markup, /class="ant-tag[^"]*"[^>]*>安全与稳定性</);
    assert.match(markup, /暂无历史版本/);
    const history = { version: 'v2026.11.04.1', releasedAt: '2026-11-04', summary: '历史回归条目', features: ['历史功能内容'], improvements: [], fixes: [], security: [] };
    releaseNotes.push(history);
    try {
      const withHistory = renderToStaticMarkup(createElement(ReleaseNotesPage));
      assert.equal(withHistory.split(history.version).length - 1, 1);
      assert.equal(withHistory.split(history.summary).length - 1, 1);
      assert.ok(withHistory.includes(history.releasedAt));
      assert.doesNotMatch(withHistory, /暂无历史版本/);
    } finally {
      releaseNotes.pop();
    }
  } finally {
    await server.close();
  }
});
