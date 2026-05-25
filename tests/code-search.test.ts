import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';
import { CodeSearch } from '../src/search';
import { SafeFileSystem } from '../src/safe-fs';
import { cleanupPath, createTempDir, ensureBuilt, toPosixPath, writeTextFile } from './test-utils';

describe('CodeSearch behavior tests', () => {
  let root: string;
  let safeFs: SafeFileSystem;

  beforeEach(async () => {
    root = toPosixPath(await createTempDir('search-'));
    safeFs = {
      getAllowedRoots: () => [root, path.normalize(root)],
      readFile: async (filePath: string) => fs.readFile(filePath, 'utf8'),
    } as unknown as SafeFileSystem;

    await writeTextFile(path.join(root, 'alpha.ts'), [
      'const needle = 1;',
      'console.log("needle");',
      '',
    ].join('\n'));

    await writeTextFile(path.join(root, 'beta.ts'), [
      'const Foo = 2;',
      'const foo = 3;',
      '',
    ].join('\n'));

    await writeTextFile(path.join(root, 'gamma.ts'), [
      'const foo = 4;',
      'const foobar = 5;',
      'const barfoo = 6;',
      '',
    ].join('\n'));

    await writeTextFile(path.join(root, 'delta.ts'), [
      'const literal = "literal (test) [abc] $5 \\path";',
      '',
    ].join('\n'));

    await writeTextFile(path.join(root, 'redos.ts'), `${'a'.repeat(50)}!`);

    for (let i = 0; i < 100; i++) {
      await writeTextFile(path.join(root, `perf-${i}.ts`), `const perf${i} = ${i};`);
    }
  });

  afterEach(async () => {
    await cleanupPath(root);
  });

  test('1. literal search finds the right lines with correct 1-indexed line numbers', async () => {
    const search = new CodeSearch(safeFs);

    const results = await search.search('needle', root, { useRegex: false });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: expect.stringContaining('alpha.ts'),
          lineNumber: 1,
        }),
      ]),
    );
  });

  test('2. caseSensitive: true actually filters case', async () => {
    const search = new CodeSearch(safeFs);

    const upperCaseResults = await search.search('Foo', root, { caseSensitive: true });
    const lowerCaseResults = await search.search('foo', root, { caseSensitive: true });

    expect(upperCaseResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: expect.stringContaining('beta.ts'),
        }),
      ]),
    );
    expect(upperCaseResults.some(result => result.lineContent.includes('const foo'))).toBe(false);
    expect(lowerCaseResults.some(result => result.lineContent.includes('const Foo'))).toBe(false);
  });

  test('3. wholeWord: true matches foo but not foobar or barfoo', async () => {
    const search = new CodeSearch(safeFs);

    const results = await search.search('foo', root, { wholeWord: true });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: expect.stringContaining('gamma.ts'),
          lineNumber: 1,
        }),
      ]),
    );
    expect(results.some(result => result.lineContent.includes('foobar'))).toBe(false);
    expect(results.some(result => result.lineContent.includes('barfoo'))).toBe(false);
  });

  test('4. regex metacharacters in literal mode do not crash and match literally', async () => {
    const search = new CodeSearch(safeFs);

    const results = await search.search('literal (test) [abc] $5 \\path', root, { useRegex: false });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: expect.stringContaining('delta.ts'),
          lineNumber: 1,
        }),
      ]),
    );
  });

  test('5. the ReDoS canary completes under 2 seconds for a catastrophic regex', async () => {
    await ensureBuilt();
    const script = `
      const { CodeSearch } = require('./dist/search');
      const fs = require('fs/promises');
      const path = require('path');
      const root = ${JSON.stringify(root)};
      const search = new CodeSearch({
        getAllowedRoots: () => [root, path.normalize(root)],
        readFile: filePath => fs.readFile(filePath, 'utf8'),
      });
      const started = Date.now();
      search.search('(a+)+$', ${JSON.stringify(root)}, { useRegex: true })
        .then(() => {
          const elapsed = Date.now() - started;
          if (elapsed >= 2000) {
            console.error('elapsed=' + elapsed);
            process.exit(2);
          }
          process.exit(0);
        })
        .catch(error => {
          console.error(error && error.message ? error.message : String(error));
          process.exit(1);
        });
    `;

    const result = spawnSync(process.execPath, ['-e', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 2500,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
  });

  test('6. invalid regex like [unclosed throws a clear error', async () => {
    const search = new CodeSearch(safeFs);

    await expect(search.search('[unclosed', root, { useRegex: true })).rejects.toThrow('Invalid regex pattern');
  });

  test('7. node_modules and .git are skipped', async () => {
    const search = new CodeSearch(safeFs);

    await writeTextFile(path.join(root, 'node_modules', 'ignored.ts'), 'needle');
    await writeTextFile(path.join(root, '.git', 'ignored.ts'), 'needle');

    const results = await search.search('needle', root);

    expect(results).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: expect.stringContaining('node_modules'),
        }),
      ]),
    );
    expect(results).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: expect.stringContaining('.git'),
        }),
      ]),
    );
  });

  test('8. searches outside allowed roots return zero results', async () => {
    const search = new CodeSearch(safeFs);
    const outsideRoot = await createTempDir('outside-search-');

    try {
      await writeTextFile(path.join(outsideRoot, 'outside.ts'), 'const needle = 1;');
      const results = await search.search('needle', outsideRoot);
      expect(results).toEqual([]);
    } finally {
      await cleanupPath(outsideRoot);
    }
  });

  test('9. searching across 100 files completes in under 5 seconds', async () => {
    const search = new CodeSearch(safeFs);
    const started = Date.now();

    await search.search('perf99', root);

    expect(Date.now() - started).toBeLessThan(5000);
  });
});
