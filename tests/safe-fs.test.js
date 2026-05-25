"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const safe_fs_1 = require("../src/safe-fs");
const test_utils_1 = require("./test-utils");
async function makeDirLink(target, linkPath) {
    await promises_1.default.mkdir(path_1.default.dirname(linkPath), { recursive: true });
    await promises_1.default.symlink(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
}
describe('SafeFileSystem security tests', () => {
    let root;
    beforeEach(async () => {
        root = await (0, test_utils_1.createTempDir)('sfs-');
    });
    afterEach(async () => {
        await (0, test_utils_1.cleanupPath)(root);
    });
    test('1. Reading a normal file inside the allowed root works', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const filePath = path_1.default.join(allowedRoot, 'ok.txt');
        await (0, test_utils_1.writeTextFile)(filePath, 'hello from inside');
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile(filePath)).resolves.toBe('hello from inside');
    });
    test('2. ../ traversal that escapes the allowed root is rejected', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const outsideFile = path_1.default.join(root, 'outside-data.txt');
        await (0, test_utils_1.writeTextFile)(outsideFile, 'should not read');
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        const traversalPath = path_1.default.join(allowedRoot, '..', 'outside-data.txt');
        await expect(safeFs.readFile(traversalPath)).rejects.toThrow();
    });
    test('3. Absolute paths outside the allowed root (/etc/passwd) are rejected', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile('/etc/passwd')).rejects.toThrow();
    });
    test('4. PREFIX SPOOFING: sibling /tmp/x/allowed-evil is not readable', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const evilRoot = path_1.default.join(root, 'allowed-evil');
        const evilFile = path_1.default.join(evilRoot, 'data.txt');
        await (0, test_utils_1.writeTextFile)(evilFile, 'malicious sibling');
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile(evilFile)).rejects.toThrow();
    });
    test('5. SYMLINK ESCAPE: symlink inside root pointing outside is rejected', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const outsideDir = path_1.default.join(root, 'outside');
        const outsideFile = path_1.default.join(outsideDir, 'data.txt');
        await (0, test_utils_1.writeTextFile)(outsideFile, 'outside data');
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        const symlinkPath = path_1.default.join(allowedRoot, 'escape-link');
        await makeDirLink(outsideDir, symlinkPath);
        await expect(safeFs.readFile(path_1.default.join(symlinkPath, 'data.txt'))).rejects.toThrow();
    });
    test('6. A symlinked directory inside the allowed root pointing outside must not be walkable', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const outsideDir = path_1.default.join(root, 'outside');
        const outsideFile = path_1.default.join(outsideDir, 'data.txt');
        await (0, test_utils_1.writeTextFile)(outsideFile, 'outside data');
        const symlinkDir = path_1.default.join(allowedRoot, 'linked-outside');
        await makeDirLink(outsideDir, symlinkDir);
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        const files = await safeFs.getAllFiles(allowedRoot);
        expect(files).not.toContain(outsideFile);
    });
    test('7. A chain of symlinks where only the final target is outside is rejected', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const outsideDir = path_1.default.join(root, 'outside');
        const outsideFile = path_1.default.join(outsideDir, 'data.txt');
        await (0, test_utils_1.writeTextFile)(outsideFile, 'outside data');
        const symlinkTwo = path_1.default.join(allowedRoot, 'link-two');
        const symlinkOne = path_1.default.join(allowedRoot, 'link-one');
        await makeDirLink(outsideDir, symlinkTwo);
        await makeDirLink(symlinkTwo, symlinkOne);
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile(path_1.default.join(symlinkOne, 'data.txt'))).rejects.toThrow();
    });
    test('8. Chokepoint bypass with ./../ is rejected even if raw string contains the root', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const outsideFile = path_1.default.join(root, 'outside', 'data.txt');
        await (0, test_utils_1.writeTextFile)(outsideFile, 'outside data');
        const bypassPath = `${(0, test_utils_1.toPosixPath)(allowedRoot)}/./../outside/data.txt`;
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile(bypassPath)).rejects.toThrow();
    });
    test('9. .env files are blocked at root and nested', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const rootEnv = path_1.default.join(allowedRoot, '.env');
        const nestedEnv = path_1.default.join(allowedRoot, 'nested', '.env');
        await (0, test_utils_1.writeTextFile)(rootEnv, 'TOP=1');
        await (0, test_utils_1.writeTextFile)(nestedEnv, 'NESTED=1');
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile(rootEnv)).rejects.toThrow();
        await expect(safeFs.readFile(nestedEnv)).rejects.toThrow();
    });
    test('10. .environment-setup.md is NOT blocked', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const filePath = path_1.default.join(allowedRoot, '.environment-setup.md');
        await (0, test_utils_1.writeTextFile)(filePath, 'allowed');
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile(filePath)).resolves.toBe('allowed');
    });
    test('11. Files > 5MB are rejected with a size error', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const filePath = path_1.default.join(allowedRoot, 'large.bin');
        await (0, test_utils_1.writeTextFile)(filePath, Buffer.alloc(5 * 1024 * 1024 + 1).toString('utf8'));
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile(filePath)).rejects.toThrow(/size/i);
    });
    test('12. Null bytes in paths are rejected', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const filePath = path_1.default.join(allowedRoot, 'ok.txt');
        await (0, test_utils_1.writeTextFile)(filePath, 'hello');
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        await expect(safeFs.readFile(`${filePath}\0bad`)).rejects.toThrow();
    });
    test('13. walkDirectory does not escape via symlinks during recursion', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const outsideDir = path_1.default.join(root, 'outside');
        const outsideFile = path_1.default.join(outsideDir, 'data.txt');
        await (0, test_utils_1.writeTextFile)(outsideFile, 'outside data');
        const symlinkDir = path_1.default.join(allowedRoot, 'linked-outside');
        await makeDirLink(outsideDir, symlinkDir);
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        const files = await safeFs.getAllFiles(allowedRoot);
        expect(files).not.toContain(outsideFile);
    });
    test('14. walkDirectory terminates on symlink loops within 10 seconds', async () => {
        const allowedRoot = path_1.default.join(root, 'allowed');
        const loopDir = path_1.default.join(allowedRoot, 'loop');
        await promises_1.default.mkdir(allowedRoot, { recursive: true });
        await makeDirLink(allowedRoot, loopDir);
        const safeFs = new safe_fs_1.SafeFileSystem([allowedRoot]);
        const started = Date.now();
        await safeFs.getAllFiles(allowedRoot);
        expect(Date.now() - started).toBeLessThan(10000);
    });
    test('15. Empty allowedRoots rejects everything', async () => {
        const filePath = path_1.default.join(root, 'allowed', 'ok.txt');
        await (0, test_utils_1.writeTextFile)(filePath, 'hello');
        const safeFs = new safe_fs_1.SafeFileSystem([]);
        await expect(safeFs.readFile(filePath)).rejects.toThrow();
    });
});
//# sourceMappingURL=safe-fs.test.js.map