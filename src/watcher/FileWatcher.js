"use strict";
/**
 * FileWatcher.ts
 * Monitors file system changes in allowed directories
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWatcher = void 0;
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = __importDefault(require("path"));
class FileWatcher {
    constructor() {
        this.watcher = null;
        this.watchPaths = [];
        this.listeners = new Map();
        this.ignorePatterns = [];
    }
    /**
     * Start watching directories
     */
    async startWatching(paths, ignorePatterns = []) {
        if (this.watcher) {
            await this.stopWatching();
        }
        this.watchPaths = paths;
        this.ignorePatterns = ignorePatterns;
        const watchOptions = {
            ignored: ignorePatterns,
            persistent: true,
            ignoreInitial: true,
            usePolling: false,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 100,
            },
        };
        this.watcher = chokidar_1.default.watch(paths, watchOptions);
        this.watcher.on('add', (filePath) => this.emitEvent('add', filePath));
        this.watcher.on('change', (filePath) => this.emitEvent('change', filePath));
        this.watcher.on('unlink', (filePath) => this.emitEvent('delete', filePath));
        this.watcher.on('addDir', (dirPath) => this.emitEvent('addDir', dirPath));
        this.watcher.on('unlinkDir', (dirPath) => this.emitEvent('unlinkDir', dirPath));
        // Wait for ready
        return new Promise((resolve) => {
            this.watcher?.on('ready', () => resolve());
            // Timeout after 5 seconds
            setTimeout(resolve, 5000);
        });
    }
    /**
     * Stop watching directories
     */
    async stopWatching() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
    }
    /**
     * Register event listener
     */
    on(eventType, callback) {
        const key = eventType;
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        // Return unsubscribe function
        return () => {
            const set = this.listeners.get(key);
            if (set) {
                set.delete(callback);
            }
        };
    }
    /**
     * Emit file change event
     */
    emitEvent(type, filePath) {
        const event = {
            type,
            filePath: path_1.default.normalize(filePath),
            timestamp: new Date(),
        };
        // Emit to specific type listeners
        const typeListeners = this.listeners.get(type);
        if (typeListeners) {
            for (const listener of typeListeners) {
                listener(event);
            }
        }
        // Emit to 'all' listeners
        const allListeners = this.listeners.get('all');
        if (allListeners) {
            for (const listener of allListeners) {
                listener(event);
            }
        }
    }
    /**
     * Get watched paths
     */
    getWatchedPaths() {
        return [...this.watchPaths];
    }
    /**
     * Check if watcher is active
     */
    isWatching() {
        return this.watcher !== null;
    }
    /**
     * Get watcher status
     */
    getStatus() {
        return {
            isWatching: this.isWatching(),
            watchedPaths: [...this.watchPaths],
            ignorePatterns: [...this.ignorePatterns],
        };
    }
}
exports.FileWatcher = FileWatcher;
//# sourceMappingURL=FileWatcher.js.map