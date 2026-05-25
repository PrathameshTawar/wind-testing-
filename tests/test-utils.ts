import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

export async function createTempDir(prefix = 'cursor-reader-'): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, 'utf8');
}

export async function ensureBuilt(): Promise<void> {
  const tsc = require.resolve('typescript/bin/tsc');
  const result = spawnSync(process.execPath, [tsc, '-p', 'tsconfig.json'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() || '';
    throw new Error(`Build failed: ${stderr || result.error?.message || 'unknown error'}`);
  }
}

export function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function cleanupPath(filePath: string): Promise<void> {
  await fs.rm(filePath, { recursive: true, force: true });
}
