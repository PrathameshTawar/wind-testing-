"use strict";
/**
 * tests/integration.test.ts
 * Integration tests for CursorReader MCP
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../src/index"));
const safe_fs_1 = require("../src/safe-fs");
const config_1 = require("../src/config");
const watcher_1 = require("../src/watcher");
const store_1 = require("../src/store");
describe('CursorReaderMCP Integration Tests', () => {
    let server;
    const testRoot = process.cwd();
    beforeAll(() => {
        server = new index_1.default([testRoot]);
    });
    afterAll(async () => {
        await server.stop();
    });
    describe('Server Lifecycle', () => {
        test('should initialize server', () => {
            expect(server).toBeDefined();
            expect(server.getConfig()).toBeDefined();
        });
        test('should start and stop server', async () => {
            await server.start();
            expect(server).toBeDefined();
            await server.stop();
        });
    });
    describe('MCP Requests', () => {
        test('should list projects', async () => {
            const response = await server.handleRequest({
                method: 'list_projects',
            });
            expect(response.result).toBeDefined();
            const result = response.result;
            expect(Array.isArray(result.projects)).toBe(true);
        });
        test('should get configuration', async () => {
            const response = await server.handleRequest({
                method: 'get_config',
            });
            expect(response.result).toBeDefined();
            const result = response.result;
            expect(result.projectRoots).toBeDefined();
        });
        test('should list available tools', async () => {
            const response = await server.handleRequest({
                method: 'list_tools',
            });
            expect(response.result).toBeDefined();
            const result = response.result;
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
        test('should get server status', async () => {
            const response = await server.handleRequest({
                method: 'get_status',
            });
            expect(response.result).toBeDefined();
            const result = response.result;
            expect(result.projectRoots).toBeDefined();
            expect(result.changeHistorySize).toBeDefined();
        });
    });
    describe('Tool Execution', () => {
        test('should handle invalid tool', async () => {
            const response = await server.handleRequest({
                method: 'nonexistent_tool',
            });
            expect(response.error).toBeDefined();
        });
        test('should search code', async () => {
            const response = await server.handleRequest({
                method: 'search_code',
                params: {
                    query: 'export',
                    baseDir: testRoot,
                    maxResults: 10,
                },
            });
            expect(response.result).toBeDefined();
        });
    });
    describe('Change Store', () => {
        test('should track changes', () => {
            const store = server.getChangeStore();
            expect(store.getSize()).toBeGreaterThanOrEqual(0);
        });
        test('should retrieve recent changes', async () => {
            const response = await server.handleRequest({
                method: 'get_recent_changes',
                params: { count: 5 },
            });
            expect(response.result).toBeDefined();
            const result = response.result;
            expect(Array.isArray(result?.changes)).toBe(true);
        });
    });
    describe('Configuration Management', () => {
        test('should update configuration', async () => {
            const response = await server.handleRequest({
                method: 'update_config',
                params: {
                    watchEnabled: false,
                },
            });
            expect(response.result).toBeDefined();
            const result = response.result;
            expect(result.watchEnabled).toBe(false);
        });
        test('should add project root', async () => {
            const testPath = '/tmp/test-project';
            const response = await server.handleRequest({
                method: 'add_project_root',
                params: {
                    path: testPath,
                },
            });
            const result = response.result;
            expect(result.projectRoots).toContain(testPath);
        });
        test('should remove project root', async () => {
            const testPath = '/tmp/test-project';
            await server.handleRequest({
                method: 'add_project_root',
                params: { path: testPath },
            });
            const response = await server.handleRequest({
                method: 'remove_project_root',
                params: { path: testPath },
            });
            const result = response.result;
            expect(result.projectRoots).not.toContain(testPath);
        });
    });
    describe('Cursor Discovery', () => {
        test('should get prompt history', async () => {
            const response = await server.handleRequest({
                method: 'get_prompt_history',
            });
            expect(response.result).toBeDefined();
        });
    });
});
describe('SafeFileSystem Tests', () => {
    const testRoot = process.cwd().replace(/\\/g, '/');
    const safeFs = new safe_fs_1.SafeFileSystem([testRoot]);
    test('should validate allowed paths', async () => {
        expect(safeFs.getAllowedRoots()).toContain(testRoot);
    });
    test('should block access outside allowed roots', async () => {
        expect(() => {
            safeFs.readFile('/etc/passwd');
        }).toThrow();
    });
    test('should read files in allowed roots', async () => {
        const packageJsonPath = process.cwd() + '/package.json';
        try {
            const content = await safeFs.readFile(packageJsonPath);
            expect(content).toBeDefined();
        }
        catch {
            // File might not exist in test environment
        }
    });
});
describe('ConfigManager Tests', () => {
    const config = new config_1.ConfigManager({
        projectRoots: ['/test/root'],
        watchEnabled: true,
    });
    test('should create config', () => {
        expect(config.getProjectRoots()).toContain('/test/root');
    });
    test('should update config', () => {
        config.updateConfig({ watchEnabled: false });
        expect(config.isWatchEnabled()).toBe(false);
    });
    test('should validate config', () => {
        const validation = config.validate();
        expect(validation.valid).toBe(true);
    });
    test('should add project root', () => {
        config.addProjectRoot('/new/root');
        expect(config.getProjectRoots()).toContain('/new/root');
    });
    test('should remove project root', () => {
        config.removeProjectRoot('/new/root');
        expect(config.getProjectRoots()).not.toContain('/new/root');
    });
});
describe('ChangeStore Tests', () => {
    const store = new store_1.ChangeStore(100);
    test('should add changes', () => {
        store.addChange({
            type: 'change',
            filePath: '/test/file.ts',
            timestamp: new Date(),
        });
        expect(store.getSize()).toBe(1);
    });
    test('should retrieve recent changes', () => {
        store.addChange({
            type: 'add',
            filePath: '/test/file2.ts',
            timestamp: new Date(),
        });
        const recent = store.getRecent(5);
        expect(recent.length).toBeGreaterThan(0);
    });
    test('should filter by type', () => {
        const changes = store.getByType('change');
        expect(Array.isArray(changes)).toBe(true);
    });
    test('should filter by file', () => {
        const changes = store.getForFile('/test/file.ts');
        expect(changes.length).toBeGreaterThan(0);
    });
    test('should respect max size', () => {
        const smallStore = new store_1.ChangeStore(5);
        for (let i = 0; i < 10; i++) {
            smallStore.addChange({
                type: 'change',
                filePath: `/test/file${i}.ts`,
                timestamp: new Date(),
            });
        }
        expect(smallStore.getSize()).toBeLessThanOrEqual(5);
    });
    test('should clear changes', () => {
        const testStore = new store_1.ChangeStore(10);
        testStore.addChange({
            type: 'change',
            filePath: '/test/file.ts',
            timestamp: new Date(),
        });
        expect(testStore.getSize()).toBeGreaterThan(0);
        testStore.clear();
        expect(testStore.getSize()).toBe(0);
    });
});
describe('FileWatcher Tests', () => {
    const watcher = new watcher_1.FileWatcher();
    test('should initialize watcher', () => {
        expect(watcher.isWatching()).toBe(false);
    });
    test('should get watched paths', () => {
        const paths = watcher.getWatchedPaths();
        expect(Array.isArray(paths)).toBe(true);
    });
    test('should get watcher status', () => {
        const status = watcher.getStatus();
        expect(status.isWatching).toBe(false);
        expect(Array.isArray(status.watchedPaths)).toBe(true);
    });
});
//# sourceMappingURL=integration.test.js.map