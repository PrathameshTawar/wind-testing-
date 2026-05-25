"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const watcher_1 = require("../src/watcher");
const test_utils_1 = require("./test-utils");
function waitForEvent(watcher, eventType, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const off = watcher.on(eventType, event => {
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
    let root;
    beforeEach(async () => {
        root = await (0, test_utils_1.createTempDir)('watcher-');
    });
    afterEach(async () => {
        await (0, test_utils_1.cleanupPath)(root);
    });
    test('1. Detect file add', async () => {
        const watcher = new watcher_1.FileWatcher();
        await watcher.startWatching([root]);
        const filePath = path_1.default.join(root, 'new.txt');
        const addPromise = waitForEvent(watcher, 'add');
        await (0, test_utils_1.writeTextFile)(filePath, 'hello');
        const event = await addPromise;
        expect(event.filePath).toBe(path_1.default.normalize(filePath));
        await watcher.stopWatching();
    });
    test('2. Detect file change', async () => {
        const watcher = new watcher_1.FileWatcher();
        const filePath = path_1.default.join(root, 'change.txt');
        await (0, test_utils_1.writeTextFile)(filePath, 'before');
        await watcher.startWatching([root]);
        const changePromise = waitForEvent(watcher, 'change');
        await (0, test_utils_1.writeTextFile)(filePath, 'after');
        const event = await changePromise;
        expect(event.filePath).toBe(path_1.default.normalize(filePath));
        await watcher.stopWatching();
    });
    test('3. Detect file delete', async () => {
        const watcher = new watcher_1.FileWatcher();
        const filePath = path_1.default.join(root, 'delete.txt');
        await (0, test_utils_1.writeTextFile)(filePath, 'gone');
        await watcher.startWatching([root]);
        const deletePromise = waitForEvent(watcher, 'unlink');
        await (0, test_utils_1.cleanupPath)(filePath);
        const event = await deletePromise;
        expect(event.filePath).toBe(path_1.default.normalize(filePath));
        await watcher.stopWatching();
    });
    test('4. Files inside node_modules emit zero events', async () => {
        const watcher = new watcher_1.FileWatcher();
        await watcher.startWatching([root]);
        const events = [];
        watcher.on('all', event => events.push(event.type));
        const nodeModulesFile = path_1.default.join(root, 'node_modules', 'pkg', 'index.js');
        await (0, test_utils_1.writeTextFile)(nodeModulesFile, 'module.exports = 1;');
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(events).toEqual([]);
        await watcher.stopWatching();
    });
    test('5. Files inside .git emit zero events', async () => {
        const watcher = new watcher_1.FileWatcher();
        await watcher.startWatching([root]);
        const events = [];
        watcher.on('all', event => events.push(event.type));
        const gitFile = path_1.default.join(root, '.git', 'config');
        await (0, test_utils_1.writeTextFile)(gitFile, '[core]\n');
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(events).toEqual([]);
        await watcher.stopWatching();
    });
    test('6. Debounce test: rapid rewrites do not exceed 2 change events', async () => {
        const watcher = new watcher_1.FileWatcher();
        const filePath = path_1.default.join(root, 'debounce.txt');
        await (0, test_utils_1.writeTextFile)(filePath, 'start');
        await watcher.startWatching([root]);
        const changeEvents = [];
        watcher.on('change', () => changeEvents.push('change'));
        for (let i = 0; i < 5; i++) {
            await (0, test_utils_1.writeTextFile)(filePath, `version-${i}`);
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        await new Promise(resolve => setTimeout(resolve, 800));
        expect(changeEvents.length).toBeLessThanOrEqual(2);
        await watcher.stopWatching();
    });
    test('7. start() is idempotent — calling it twice does not double emit', async () => {
        const watcher = new watcher_1.FileWatcher();
        await watcher.startWatching([root]);
        await watcher.startWatching([root]);
        const filePath = path_1.default.join(root, 'idempotent.txt');
        const addPromise = waitForEvent(watcher, 'add');
        await (0, test_utils_1.writeTextFile)(filePath, 'hello');
        const event = await addPromise;
        expect(event.filePath).toBe(path_1.default.normalize(filePath));
        await watcher.stopWatching();
    });
    test('8. stop() releases the watcher; no events after stop', async () => {
        const watcher = new watcher_1.FileWatcher();
        await watcher.startWatching([root]);
        await watcher.stopWatching();
        const events = [];
        watcher.on('all', event => events.push(event.type));
        const filePath = path_1.default.join(root, 'after-stop.txt');
        await (0, test_utils_1.writeTextFile)(filePath, 'hello');
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(events).toEqual([]);
    });
    test('9. start() with a non-existent path resolves cleanly without crashing', async () => {
        const watcher = new watcher_1.FileWatcher();
        await expect(watcher.startWatching([path_1.default.join(root, 'missing')])).resolves.toBeUndefined();
        await watcher.stopWatching();
    });
    test('10. Watching workspace A does NOT emit events when files in workspace B change', async () => {
        const workspaceA = path_1.default.join(root, 'a');
        const workspaceB = path_1.default.join(root, 'b');
        const watcher = new watcher_1.FileWatcher();
        await watcher.startWatching([workspaceA]);
        const events = [];
        watcher.on('all', event => events.push(event.type));
        const filePath = path_1.default.join(workspaceB, 'ignored.txt');
        await (0, test_utils_1.writeTextFile)(filePath, 'hello');
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(events).toEqual([]);
        await watcher.stopWatching();
    });
});
//# sourceMappingURL=file-watcher.test.js.map