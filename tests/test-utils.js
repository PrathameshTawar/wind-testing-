"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTempDir = createTempDir;
exports.writeTextFile = writeTextFile;
exports.ensureBuilt = ensureBuilt;
exports.toPosixPath = toPosixPath;
exports.sleep = sleep;
exports.cleanupPath = cleanupPath;
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
async function createTempDir(prefix = 'cursor-reader-') {
    return promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), prefix));
}
async function writeTextFile(filePath, contents) {
    await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
    await promises_1.default.writeFile(filePath, contents, 'utf8');
}
async function ensureBuilt() {
    const tsc = require.resolve('typescript/bin/tsc');
    const result = (0, child_process_1.spawnSync)(process.execPath, [tsc, '-p', 'tsconfig.json'], {
        cwd: process.cwd(),
        stdio: 'pipe',
    });
    if (result.status !== 0) {
        const stderr = result.stderr?.toString() || '';
        throw new Error(`Build failed: ${stderr || result.error?.message || 'unknown error'}`);
    }
}
function toPosixPath(filePath) {
    return filePath.replace(/\\/g, '/');
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function cleanupPath(filePath) {
    await promises_1.default.rm(filePath, { recursive: true, force: true });
}
//# sourceMappingURL=test-utils.js.map