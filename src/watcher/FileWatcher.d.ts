/**
 * FileWatcher.ts
 * Monitors file system changes in allowed directories
 */
export type FileChangeType = 'add' | 'change' | 'delete' | 'addDir' | 'unlinkDir';
export interface FileChangeEvent {
    type: FileChangeType;
    filePath: string;
    timestamp: Date;
}
export declare class FileWatcher {
    private watcher;
    private watchPaths;
    private listeners;
    private ignorePatterns;
    /**
     * Start watching directories
     */
    startWatching(paths: string[], ignorePatterns?: string[]): Promise<void>;
    /**
     * Stop watching directories
     */
    stopWatching(): Promise<void>;
    /**
     * Register event listener
     */
    on(eventType: FileChangeType | 'all', callback: (event: FileChangeEvent) => void): () => void;
    /**
     * Emit file change event
     */
    private emitEvent;
    /**
     * Get watched paths
     */
    getWatchedPaths(): string[];
    /**
     * Check if watcher is active
     */
    isWatching(): boolean;
    /**
     * Get watcher status
     */
    getStatus(): {
        isWatching: boolean;
        watchedPaths: string[];
        ignorePatterns: string[];
    };
}
//# sourceMappingURL=FileWatcher.d.ts.map