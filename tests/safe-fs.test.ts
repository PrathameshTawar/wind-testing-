import fs from 'fs/promises';
import path from 'path';
import { SafeFileSystem } from '../src/safe-fs';
import { cleanupPath, createTempDir, toPosixPath, writeTextFile } from './test-utils';

async function makeDirLink(target: string, linkPath: string): Promise<void> {
  await fs.mkdir(path.dirname(linkPath), { recursive: true });
  await fs.symlink(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
}

describe('SafeFileSystem security tests', () => {
  let root: string;

  beforeEach(async () => {
    root = await createTempDir('sfs-');
  });

  afterEach(async () => {
    await cleanupPath(root);
  });

  test('1. Reading a normal file inside the allowed root works', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const filePath = path.join(allowedRoot, 'ok.txt');
    await writeTextFile(filePath, 'hello from inside');

    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile(filePath)).resolves.toBe('hello from inside');
  });

  test('2. ../ traversal that escapes the allowed root is rejected', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const outsideFile = path.join(root, 'outside-data.txt');
    await writeTextFile(outsideFile, 'should not read');

    const safeFs = new SafeFileSystem([allowedRoot]);
    const traversalPath = path.join(allowedRoot, '..', 'outside-data.txt');

    await expect(safeFs.readFile(traversalPath)).rejects.toThrow();
  });

  test('3. Absolute paths outside the allowed root (/etc/passwd) are rejected', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile('/etc/passwd')).rejects.toThrow();
  });

  test('4. PREFIX SPOOFING: sibling /tmp/x/allowed-evil is not readable', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const evilRoot = path.join(root, 'allowed-evil');
    const evilFile = path.join(evilRoot, 'data.txt');
    await writeTextFile(evilFile, 'malicious sibling');

    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile(evilFile)).rejects.toThrow();
  });

  test('5. SYMLINK ESCAPE: symlink inside root pointing outside is rejected', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const outsideDir = path.join(root, 'outside');
    const outsideFile = path.join(outsideDir, 'data.txt');
    await writeTextFile(outsideFile, 'outside data');

    const safeFs = new SafeFileSystem([allowedRoot]);
    const symlinkPath = path.join(allowedRoot, 'escape-link');
    await makeDirLink(outsideDir, symlinkPath);

    await expect(safeFs.readFile(path.join(symlinkPath, 'data.txt'))).rejects.toThrow();
  });

  test('6. A symlinked directory inside the allowed root pointing outside must not be walkable', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const outsideDir = path.join(root, 'outside');
    const outsideFile = path.join(outsideDir, 'data.txt');
    await writeTextFile(outsideFile, 'outside data');

    const symlinkDir = path.join(allowedRoot, 'linked-outside');
    await makeDirLink(outsideDir, symlinkDir);

    const safeFs = new SafeFileSystem([allowedRoot]);
    const files = await safeFs.getAllFiles(allowedRoot);

    expect(files).not.toContain(outsideFile);
  });

  test('7. A chain of symlinks where only the final target is outside is rejected', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const outsideDir = path.join(root, 'outside');
    const outsideFile = path.join(outsideDir, 'data.txt');
    await writeTextFile(outsideFile, 'outside data');

    const symlinkTwo = path.join(allowedRoot, 'link-two');
    const symlinkOne = path.join(allowedRoot, 'link-one');

    await makeDirLink(outsideDir, symlinkTwo);
    await makeDirLink(symlinkTwo, symlinkOne);

    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile(path.join(symlinkOne, 'data.txt'))).rejects.toThrow();
  });

  test('8. Chokepoint bypass with ./../ is rejected even if raw string contains the root', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const outsideFile = path.join(root, 'outside', 'data.txt');
    await writeTextFile(outsideFile, 'outside data');

    const bypassPath = `${toPosixPath(allowedRoot)}/./../outside/data.txt`;
    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile(bypassPath)).rejects.toThrow();
  });

  test('9. .env files are blocked at root and nested', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const rootEnv = path.join(allowedRoot, '.env');
    const nestedEnv = path.join(allowedRoot, 'nested', '.env');
    await writeTextFile(rootEnv, 'TOP=1');
    await writeTextFile(nestedEnv, 'NESTED=1');

    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile(rootEnv)).rejects.toThrow();
    await expect(safeFs.readFile(nestedEnv)).rejects.toThrow();
  });

  test('10. .environment-setup.md is NOT blocked', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const filePath = path.join(allowedRoot, '.environment-setup.md');
    await writeTextFile(filePath, 'allowed');

    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile(filePath)).resolves.toBe('allowed');
  });

  test('11. Files > 5MB are rejected with a size error', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const filePath = path.join(allowedRoot, 'large.bin');
    await writeTextFile(filePath, Buffer.alloc(5 * 1024 * 1024 + 1).toString('utf8'));

    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile(filePath)).rejects.toThrow(/size/i);
  });

  test('12. Null bytes in paths are rejected', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const filePath = path.join(allowedRoot, 'ok.txt');
    await writeTextFile(filePath, 'hello');

    const safeFs = new SafeFileSystem([allowedRoot]);

    await expect(safeFs.readFile(`${filePath}\0bad`)).rejects.toThrow();
  });

  test('13. walkDirectory does not escape via symlinks during recursion', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const outsideDir = path.join(root, 'outside');
    const outsideFile = path.join(outsideDir, 'data.txt');
    await writeTextFile(outsideFile, 'outside data');

    const symlinkDir = path.join(allowedRoot, 'linked-outside');
    await makeDirLink(outsideDir, symlinkDir);

    const safeFs = new SafeFileSystem([allowedRoot]);
    const files = await safeFs.getAllFiles(allowedRoot);

    expect(files).not.toContain(outsideFile);
  });

  test('14. walkDirectory terminates on symlink loops within 10 seconds', async () => {
    const allowedRoot = path.join(root, 'allowed');
    const loopDir = path.join(allowedRoot, 'loop');
    await fs.mkdir(allowedRoot, { recursive: true });
    await makeDirLink(allowedRoot, loopDir);

    const safeFs = new SafeFileSystem([allowedRoot]);
    const started = Date.now();
    await safeFs.getAllFiles(allowedRoot);

    expect(Date.now() - started).toBeLessThan(10_000);
  });

  test('15. Empty allowedRoots rejects everything', async () => {
    const filePath = path.join(root, 'allowed', 'ok.txt');
    await writeTextFile(filePath, 'hello');

    const safeFs = new SafeFileSystem([]);

    await expect(safeFs.readFile(filePath)).rejects.toThrow();
  });
});
