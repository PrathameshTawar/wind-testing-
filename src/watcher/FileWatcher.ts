/**
 * FileWatcher.ts
 * Monitors file system changes in allowed directories
 */

import chokidar from 'chokidar';
import path from 'path';

export type FileChangeType = 'add' | 'change' | 'delete' | 'addDir' | 'unlinkDir';

export interface FileChangeEvent {
  type: FileChangeType;
  filePath: string;
  timestamp: Date;
}

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private watchPaths: string[] = [];
  private listeners: Map<string, Set<(event: FileChangeEvent) => void>> = new Map();
  private ignorePatterns: string[] = [];

  /**
   * Start watching directories
   */
  async startWatching(paths: string[], ignorePatterns: string[] = []): Promise<void> {
    if (this.watcher) {
      await this.stopWatching();
    }

    this.watchPaths = paths;
    this.ignorePatterns = ignorePatterns;

    const watchOptions: chokidar.WatchOptions = {
      ignored: ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    };

    this.watcher = chokidar.watch(paths, watchOptions);

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
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Register event listener
   */
  on(eventType: FileChangeType | 'all', callback: (event: FileChangeEvent) => void): () => void {
    const key = eventType;

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback);

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
  private emitEvent(type: FileChangeType, filePath: string): void {
    const event: FileChangeEvent = {
      type,
      filePath: path.normalize(filePath),
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
  getWatchedPaths(): string[] {
    return [...this.watchPaths];
  }

  /**
   * Check if watcher is active
   */
  isWatching(): boolean {
    return this.watcher !== null;
  }

  /**
   * Get watcher status
   */
  getStatus(): {
    isWatching: boolean;
    watchedPaths: string[];
    ignorePatterns: string[];
  } {
    return {
      isWatching: this.isWatching(),
      watchedPaths: [...this.watchPaths],
      ignorePatterns: [...this.ignorePatterns],
    };
  }
}
