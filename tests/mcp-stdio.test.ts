import path from 'path';
import fs from 'fs';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { ensureBuilt, cleanupPath, createTempDir, writeTextFile } from './test-utils';

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: unknown;
}

class McpStdioClient {
  private readonly proc: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<number, { resolve: (value: JsonRpcResponse) => void; reject: (reason?: unknown) => void; timer: NodeJS.Timeout }>();
  private nextId = 1;
  private stdoutBuffer = '';

  parseFailures = 0;

  constructor(proc: ChildProcessWithoutNullStreams) {
    this.proc = proc;
    this.proc.stdout.on('data', chunk => this.handleStdout(chunk.toString('utf8')));
  }

  private handleStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    const lines = this.stdoutBuffer.split(/\r?\n/);
    this.stdoutBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      try {
        const message = JSON.parse(line) as JsonRpcResponse;
        const pending = this.pending.get(message.id ?? -1);
        if (pending) {
          clearTimeout(pending.timer);
          this.pending.delete(message.id ?? -1);
          if (message.error) {
            pending.reject(message.error);
          } else {
            pending.resolve(message);
          }
        }
      } catch {
        this.parseFailures += 1;
      }
    }
  }

  async initialize(): Promise<JsonRpcResponse> {
    return this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'jest-client',
        version: '1.0.0',
      },
    });
  }

  async sendRequest(method: string, params: unknown): Promise<JsonRpcResponse> {
    const id = this.nextId++;
    const payload = { jsonrpc: '2.0', id, method, params };

    this.proc.stdin.write(`${JSON.stringify(payload)}\n`);

    return new Promise<JsonRpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for response for ${method}`));
      }, 5000);

      this.pending.set(id, { resolve, reject, timer });
    });
  }

  async close(): Promise<void> {
    this.proc.kill('SIGTERM');
    await new Promise<void>(resolve => this.proc.once('exit', () => resolve()));
  }
}

async function spawnServer(root: string): Promise<McpStdioClient> {
  const rootServer = path.join(process.cwd(), 'dist', 'server.js');
  const nestedServer = path.join(process.cwd(), 'dist', 'src', 'server.js');
  const serverPath = fs.existsSync(rootServer) ? rootServer : nestedServer;

  const proc = spawn(process.execPath, [serverPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CURSOR_READER_ROOTS: root,
    },
    stdio: 'pipe',
  });

  const client = new McpStdioClient(proc);
  await client.initialize();
  return client;
}

describe('MCP stdio integration tests', () => {
  let root: string;

  beforeAll(async () => {
    await ensureBuilt();
  });

  beforeEach(async () => {
    root = await createTempDir('mcp-stdio-');
    await writeTextFile(path.join(root, 'searchable.ts'), 'const needle = 1;');
  });

  afterEach(async () => {
    if (root) {
      await cleanupPath(root);
    }
  });

  test('1. After initialize handshake, tools/list returns the documented tools', async () => {
    const client = await spawnServer(root);

    const response = await client.sendRequest('tools/list', {});
    const result = response.result as { tools?: Array<{ name: string; description: string; inputSchema: { type: string } }> };

    expect(result.tools?.map(tool => tool.name)).toEqual([
      'list_projects',
      'get_project_tree',
      'read_file',
      'search_code',
      'get_recent_changes',
      'get_latest_git_diff',
      'get_prompt_history',
    ]);

    await client.close();
  });

  test('2. Every tool in tools/list has a non-empty description and an object inputSchema', async () => {
    const client = await spawnServer(root);

    const response = await client.sendRequest('tools/list', {});
    const result = response.result as { tools?: Array<{ description: string; inputSchema: unknown }> };

    for (const tool of result.tools ?? []) {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toEqual(expect.objectContaining({ type: 'object' }));
    }

    await client.close();
  });

  test('3. tools/call with search_code returns content text', async () => {
    const client = await spawnServer(root);

    const response = await client.sendRequest('tools/call', {
      name: 'search_code',
      arguments: {
        query: 'needle',
        baseDir: root,
      },
    });

    const result = response.result as { content?: Array<{ type: string; text: string }> };
    expect(result.content?.[0]?.type).toBe('text');
    expect(result.content?.[0]?.text).toContain('needle');

    await client.close();
  });

  test('4. tools/call with an unknown tool name returns isError: true', async () => {
    const client = await spawnServer(root);

    const response = await client.sendRequest('tools/call', {
      name: 'not_a_real_tool',
      arguments: {},
    });

    const result = response.result as { isError?: boolean; content?: Array<{ text: string }> };
    expect(result.isError).toBe(true);

    await client.close();
  });

  test('5. tools/call with malformed arguments returns isError: true', async () => {
    const client = await spawnServer(root);

    const response = await client.sendRequest('tools/call', {
      name: 'search_code',
      arguments: {
        query: 123,
        baseDir: root,
      },
    });

    const result = response.result as { isError?: boolean; content?: Array<{ text: string }> };
    expect(result.isError).toBe(true);

    await client.close();
  });

  test('6. 100 sequential requests complete in under 15 seconds', async () => {
    const client = await spawnServer(root);
    const started = Date.now();

    for (let i = 0; i < 100; i++) {
      await client.sendRequest('tools/list', {});
    }

    expect(Date.now() - started).toBeLessThan(15_000);

    await client.close();
  });

  test('7. read_file with /etc/passwd returns isError: true and no root: leakage', async () => {
    const client = await spawnServer(root);

    const response = await client.sendRequest('tools/call', {
      name: 'read_file',
      arguments: {
        filePath: '/etc/passwd',
      },
    });

    const result = response.result as { isError?: boolean; content?: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).not.toContain('root:');

    await client.close();
  });

  test('8. server never writes non-JSON-RPC data to stdout', async () => {
    const client = await spawnServer(root);

    await client.sendRequest('tools/list', {});
    await client.sendRequest('tools/call', {
      name: 'search_code',
      arguments: {
        query: 'needle',
        baseDir: root,
      },
    });

    expect(client.parseFailures).toBe(0);

    await client.close();
  });
});
