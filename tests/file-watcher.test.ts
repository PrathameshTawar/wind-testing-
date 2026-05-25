import path from 'path';
import { FileWatcher, FileChangeEvent } from '../src/watcher';
import { cleanupPath, createTempDir, writeTextFile } from './test-utils';

function waitForEvent(watcher: FileWatcher, eventType: string, timeout = 5000): Promise<FileChangeEvent> {
  return new Promise((resolve, reject) => {
    const off = watcher.on(eventType as any, event => {
      off();
      clearTimeout(timer);
      resolve(event);
    });

    const timer = setTimeout(() => {
      off();
      reject(new Error(`Timed out waiting for ${eventType}`));
    }, timeout);
  });
}

describe('FileWatcher real chokidar tests', () => {
  let root: string;

  beforeEach(async () => {
    root = await createTempDir('watcher-');
  });

  afterEach(async () => {
    await cleanupPath(root);
  });

  test('1. Detect file add', async () => {
    const watcher = new FileWatcher();
    await watcher.startWatching([root]);

    const filePath = path.join(root, 'new.txt');
    const addPromise = waitForEvent(watcher, 'add');
    await writeTextFile(filePath, 'hello');

    const event = await addPromise;
    expect(event.filePath).toBe(path.normalize(filePath));

    await watcher.stopWatching();
  });

  test('2. Detect file change', async () => {
    const watcher = new FileWatcher();
    const filePath = path.join(root, 'change.txt');
    await writeTextFile(filePath, 'before');

    await watcher.startWatching([root]);
    const changePromise = waitForEvent(watcher, 'change');
    await writeTextFile(filePath, 'after');

    const event = await changePromise;
    expect(event.filePath).toBe(path.normalize(filePath));

    await watcher.stopWatching();
  });

  test('3. Detect file delete', async () => {
    const watcher = new FileWatcher();
    const filePath = path.join(root, 'delete.txt');
    await writeTextFile(filePath, 'gone');

    await watcher.startWatching([root]);
    const deletePromise = waitForEvent(watcher, 'unlink');
    await cleanupPath(filePath);

    const event = await deletePromise;
    expect(event.filePath).toBe(path.normalize(filePath));

    await watcher.stopWatching();
  });

  test('4. Files inside node_modules emit zero events', async () => {
    const watcher = new FileWatcher();
    await watcher.startWatching([root]);

    const events: string[] = [];
    watcher.on('all', event => events.push(event.type));

    const nodeModulesFile = path.join(root, 'node_modules', 'pkg', 'index.js');
    await writeTextFile(nodeModulesFile, 'module.exports = 1;');

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(events).toEqual([]);

    await watcher.stopWatching();
  });

  test('5. Files inside .git emit zero events', async () => {
    const watcher = new FileWatcher();
    await watcher.startWatching([root]);

    const events: string[] = [];
    watcher.on('all', event => events.push(event.type));

    const gitFile = path.join(root, '.git', 'config');
    await writeTextFile(gitFile, '[core]\n');

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(events).toEqual([]);

    await watcher.stopWatching();
  });

  test('6. Debounce test: rapid rewrites do not exceed 2 change events', async () => {
    const watcher = new FileWatcher();
    const filePath = path.join(root, 'debounce.txt');
    await writeTextFile(filePath, 'start');

    await watcher.startWatching([root]);

    const changeEvents: string[] = [];
    watcher.on('change', () => changeEvents.push('change'));

    for (let i = 0; i < 5; i++) {
      await writeTextFile(filePath, `version-${i}`);
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    expect(changeEvents.length).toBeLessThanOrEqual(2);

    await watcher.stopWatching();
  });

  test('7. start() is idempotent — calling it twice does not double emit', async () => {
    const watcher = new FileWatcher();
    await watcher.startWatching([root]);
    await watcher.startWatching([root]);

    const filePath = path.join(root, 'idempotent.txt');
    const addPromise = waitForEvent(watcher, 'add');
    await writeTextFile(filePath, 'hello');

    const event = await addPromise;
    expect(event.filePath).toBe(path.normalize(filePath));

    await watcher.stopWatching();
  });

  test('8. stop() releases the watcher; no events after stop', async () => {
    const watcher = new FileWatcher();
    await watcher.startWatching([root]);
    await watcher.stopWatching();

    const events: string[] = [];
    watcher.on('all', event => events.push(event.type));

    const filePath = path.join(root, 'after-stop.txt');
    await writeTextFile(filePath, 'hello');

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(events).toEqual([]);
  });

  test('9. start() with a non-existent path resolves cleanly without crashing', async () => {
    const watcher = new FileWatcher();

    await expect(watcher.startWatching([path.join(root, 'missing')])).resolves.toBeUndefined();

    await watcher.stopWatching();
  });

  test('10. Watching workspace A does NOT emit events when files in workspace B change', async () => {
    const workspaceA = path.join(root, 'a');
    const workspaceB = path.join(root, 'b');
    const watcher = new FileWatcher();
    await watcher.startWatching([workspaceA]);

    const events: string[] = [];
    watcher.on('all', event => events.push(event.type));

    const filePath = path.join(workspaceB, 'ignored.txt');
    await writeTextFile(filePath, 'hello');

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(events).toEqual([]);

    await watcher.stopWatching();
  });
});
