import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

test('frontend write APIs never submit creator or updater identity fields', async () => {
  const apiDirectory = new URL('../src/api/', import.meta.url);
  const apiFiles = (await readdir(apiDirectory)).filter((file) => file.endsWith('Api.ts'));
  for (const file of apiFiles) {
    const source = await readFile(new URL(file, apiDirectory), 'utf8');
    assert.doesNotMatch(source, /\bcreator_id\s*:/, `${file} still submits creator_id`);
    assert.doesNotMatch(source, /\bupdater_id\s*:/, `${file} still submits updater_id`);
  }
});
