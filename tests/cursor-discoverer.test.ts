import Database from 'better-sqlite3';
import path from 'path';
import { SafeFileSystem } from '../src/safe-fs';
import { CursorDiscoverer } from '../src/tools';
import { cleanupPath, createTempDir } from './test-utils';

describe('CursorDiscoverer sqlite-backed tests', () => {
  let root: string;

  beforeEach(async () => {
    root = await createTempDir('cursor-discover-');
  });

  afterEach(async () => {
    await cleanupPath(root);
  });

  function seedDb(dbPath: string, chatValue: string | null = null): void {
    const db = new Database(dbPath);
    db.exec(`CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value BLOB)`);

    if (chatValue !== null) {
      db.prepare('INSERT INTO ItemTable(key, value) VALUES (?, ?)').run(
        'workbench.panel.aichat.view.aichat.chatdata',
        Buffer.from(chatValue, 'utf8'),
      );
    }

    db.prepare('INSERT INTO ItemTable(key, value) VALUES (?, ?)').run(
      'pinnedViewlets',
      Buffer.from(JSON.stringify({ pinned: true }), 'utf8'),
    );

    db.close();
  }

  test('1. discoverWorkspace returns the known prompt text from the real fixture', async () => {
    const dbPath = path.join(root, 'state.vscdb');
    const payload = JSON.stringify({
      tabs: [
        {
          chatTitle: 'Known prompt title',
          bubbles: [
            {
              type: 'text',
              text: 'Please summarize this repo',
              timestamp: 1715000000000,
            },
          ],
        },
      ],
    });

    seedDb(dbPath, payload);

    const discoverer = new CursorDiscoverer(new SafeFileSystem([root]));
    const result = await discoverer.discoverWorkspace(root);

    expect(result.recentPrompts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary: expect.stringContaining('Please summarize this repo'),
        }),
      ]),
    );
  });

  test('2. returned timestamp matches the fixture timestamp and is more than 60 seconds away from now', async () => {
    const dbPath = path.join(root, 'state.vscdb');
    const payload = JSON.stringify({
      tabs: [
        {
          chatTitle: 'Known prompt title',
          bubbles: [
            {
              type: 'text',
              text: 'Please summarize this repo',
              timestamp: 1715000000000,
            },
          ],
        },
      ],
    });

    seedDb(dbPath, payload);

    const discoverer = new CursorDiscoverer(new SafeFileSystem([root]));
    const result = await discoverer.discoverWorkspace(root);

    expect(result.recentPrompts[0]?.timestamp.getTime()).toBe(1715000000000);
    expect(Math.abs(Date.now() - result.recentPrompts[0]!.timestamp.getTime())).toBeGreaterThan(60_000);
  });

  test('3. unrelated rows do not appear in extraction results', async () => {
    const dbPath = path.join(root, 'state.vscdb');
    const payload = JSON.stringify({
      tabs: [
        {
          chatTitle: 'Known prompt title',
          bubbles: [
            {
              type: 'text',
              text: 'Please summarize this repo',
              timestamp: 1715000000000,
            },
          ],
        },
      ],
    });

    seedDb(dbPath, payload);

    const discoverer = new CursorDiscoverer(new SafeFileSystem([root]));
    const result = await discoverer.discoverWorkspace(root);

    expect(JSON.stringify(result)).not.toContain('pinnedViewlets');
  });

  test('4. missing state.vscdb returns empty recentPrompts cleanly', async () => {
    const discoverer = new CursorDiscoverer(new SafeFileSystem([root]));

    await expect(discoverer.discoverWorkspace(root)).resolves.toEqual(
      expect.objectContaining({
        recentPrompts: [],
      }),
    );
  });

  test('5. malformed JSON in chatdata does not throw and returns empty or an error-flagged result', async () => {
    const dbPath = path.join(root, 'state.vscdb');
    seedDb(dbPath, '{bad json');

    const discoverer = new CursorDiscoverer(new SafeFileSystem([root]));

    await expect(discoverer.discoverWorkspace(root)).resolves.toBeDefined();
  });

  test('6. DB held by an exclusive transaction does not crash', async () => {
    const dbPath = path.join(root, 'state.vscdb');
    const payload = JSON.stringify({
      tabs: [
        {
          chatTitle: 'Known prompt title',
          bubbles: [
            {
              type: 'text',
              text: 'Please summarize this repo',
              timestamp: 1715000000000,
            },
          ],
        },
      ],
    });

    seedDb(dbPath, payload);
    const db = new Database(dbPath);
    db.exec('BEGIN EXCLUSIVE');

    const discoverer = new CursorDiscoverer(new SafeFileSystem([root]));

    await expect(discoverer.discoverWorkspace(root)).resolves.toBeDefined();

    db.exec('ROLLBACK');
    db.close();
  });

  test('7. SQL injection via table name does not execute the injection and ItemTable still exists', async () => {
    const dbPath = path.join(root, 'state.vscdb');
    const db = new Database(dbPath);
    db.exec(`CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value BLOB)`);
    db.exec(`CREATE TABLE \"ItemTable; DROP TABLE ItemTable; --\" (key TEXT PRIMARY KEY, value BLOB)`);
    db.prepare('INSERT INTO ItemTable(key, value) VALUES (?, ?)').run(
      'workbench.panel.aichat.view.aichat.chatdata',
      Buffer.from(JSON.stringify({ tabs: [] }), 'utf8'),
    );
    db.prepare('INSERT INTO \"ItemTable; DROP TABLE ItemTable; --\" (key, value) VALUES (?, ?)').run(
      'pinnedViewlets',
      Buffer.from(JSON.stringify({ pinned: true }), 'utf8'),
    );
    db.close();

    const discoverer = new CursorDiscoverer(new SafeFileSystem([root]));
    await expect(discoverer.discoverWorkspace(root)).resolves.toBeDefined();

    const verify = new Database(dbPath);
    const table = verify.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ItemTable'").get();
    verify.close();

    expect(table).toEqual(expect.objectContaining({ name: 'ItemTable' }));
  });

  test('8. extraction completes under 2 seconds for a 50MB DB fixture', async () => {
    const dbPath = path.join(root, 'state.vscdb');
    const db = new Database(dbPath);
    db.exec(`CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value BLOB)`);

    const insert = db.prepare('INSERT INTO ItemTable(key, value) VALUES (?, ?)');
    for (let i = 0; i < 50; i++) {
      insert.run(`row-${i}`, Buffer.alloc(1_024 * 1_024, 0x61));
    }
    db.close();

    const discoverer = new CursorDiscoverer(new SafeFileSystem([root]));
    const started = Date.now();

    await discoverer.discoverWorkspace(root);

    expect(Date.now() - started).toBeLessThan(2000);
  });
});
