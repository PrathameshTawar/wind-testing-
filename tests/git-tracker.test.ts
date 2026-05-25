import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';
import { GitTracker } from '../src/git';
import { cleanupPath, createTempDir, writeTextFile } from './test-utils';

function runGit(repoPath: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync('git', args, {
    cwd: repoPath,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

async function initRepo(repoPath: string): Promise<void> {
  runGit(repoPath, ['init']);
  runGit(repoPath, ['config', 'user.name', 'Test User']);
  runGit(repoPath, ['config', 'user.email', 'test@example.com']);
}

async function createCommittedFile(repoPath: string, filePath: string, contents: string): Promise<void> {
  await writeTextFile(path.join(repoPath, filePath), contents);
  runGit(repoPath, ['add', filePath]);
  runGit(repoPath, ['commit', '-m', 'initial commit']);
}

describe('GitTracker behavior tests', () => {
  let root: string;

  beforeEach(async () => {
    root = await createTempDir('git-tracker-');
  });

  afterEach(async () => {
    await cleanupPath(root);
  });

  test('1. isGitRepo returns true for an initialized repo', async () => {
    await initRepo(root);

    const tracker = new GitTracker() as any;
    await expect(tracker.isGitRepo(root)).resolves.toBe(true);
  });

  test('2. For a non-git directory, getCurrentDiff returns null / {ok:false} / empty and never throws', async () => {
    const tracker = new GitTracker() as any;

    const diff = await tracker.getCurrentDiff(root);

    expect(diff === null || typeof diff === 'object').toBe(true);
  });

  test('3. After modifying a tracked file, getCurrentDiff returns a diff containing the filename and new content', async () => {
    await initRepo(root);
    await createCommittedFile(root, 'tracked.txt', 'before');
    await writeTextFile(path.join(root, 'tracked.txt'), 'after');

    const tracker = new GitTracker() as any;
    const diff = await tracker.getCurrentDiff(root);

    expect(JSON.stringify(diff)).toContain('tracked.txt');
    expect(JSON.stringify(diff)).toContain('after');
  });

  test('4. With a clean working tree, getCurrentDiff returns an empty diff', async () => {
    await initRepo(root);
    await createCommittedFile(root, 'tracked.txt', 'before');

    const tracker = new GitTracker() as any;
    const diff = await tracker.getCurrentDiff(root);

    expect(diff).toEqual(expect.objectContaining({ changes: [] }));
  });

  test('5. An untracked new file appears somewhere in getCurrentDiff result', async () => {
    await initRepo(root);
    await createCommittedFile(root, 'tracked.txt', 'before');
    await writeTextFile(path.join(root, 'untracked.txt'), 'new content');

    const tracker = new GitTracker() as any;
    const diff = await tracker.getCurrentDiff(root);

    expect(JSON.stringify(diff)).toContain('untracked.txt');
  });

  test('6. getLatestCommit returns SHA + message + author for the most recent commit', async () => {
    await initRepo(root);
    await createCommittedFile(root, 'tracked.txt', 'before');

    const tracker = new GitTracker() as any;
    const latest = await tracker.getLatestCommit(root);

    expect(latest?.sha).toBeTruthy();
    expect(latest?.message).toContain('initial commit');
    expect(latest?.author).toBeTruthy();
  });

  test('7. On a repo with zero commits, getLatestCommit does not throw', async () => {
    await initRepo(root);

    const tracker = new GitTracker() as any;
    const latest = await tracker.getLatestCommit(root);

    expect(latest === null || typeof latest === 'object').toBe(true);
  });

  test('8. SECURITY: shell metacharacters do not create /tmp/pwned', async () => {
    const payloadPath = path.join(root, 'evil; touch /tmp/pwned');
    await initRepo(root);

    const tracker = new GitTracker() as any;
    await tracker.getCurrentDiff(payloadPath);

    await expect(fs.access('/tmp/pwned')).rejects.toThrow();
  });

  test('9. CONSISTENCY: getCurrentDiff returns the same shape on dirty and clean repos', async () => {
    await initRepo(root);
    await createCommittedFile(root, 'tracked.txt', 'before');

    const tracker = new GitTracker() as any;
    const clean = await tracker.getCurrentDiff(root);

    await writeTextFile(path.join(root, 'tracked.txt'), 'after');
    const dirty = await tracker.getCurrentDiff(root);

    expect(typeof clean).toBe(typeof dirty);
  });
});
