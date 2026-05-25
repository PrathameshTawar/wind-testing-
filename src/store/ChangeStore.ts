/**
 * ChangeStore.ts
 * Stores and manages file change history
 */

import { FileChangeEvent } from '../watcher';

export interface StoredChange extends FileChangeEvent {
  id: string;
}

export class ChangeStore {
  private changes: StoredChange[] = [];
  private maxSize: number;
  private idCounter: number = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Add a change to the store
   */
  addChange(event: FileChangeEvent): void {
    const change: StoredChange = {
      ...event,
      id: `${Date.now()}-${this.idCounter++}`,
    };

    this.changes.unshift(change);

    // Remove oldest changes if we exceed maxSize
    if (this.changes.length > this.maxSize) {
      this.changes = this.changes.slice(0, this.maxSize);
    }
  }

  /**
   * Get all changes
   */
  getAll(): StoredChange[] {
    return [...this.changes];
  }

  /**
   * Get recent changes
   */
  getRecent(count: number = 50): StoredChange[] {
    return this.changes.slice(0, Math.min(count, this.changes.length));
  }

  /**
   * Get changes by type
   */
  getByType(type: string): StoredChange[] {
    return this.changes.filter(c => c.type === type);
  }

  /**
   * Get changes for a file
   */
  getForFile(filePath: string): StoredChange[] {
    return this.changes.filter(c => c.filePath === filePath);
  }

  /**
   * Get changes since timestamp
   */
  getSince(timestamp: Date): StoredChange[] {
    return this.changes.filter(c => c.timestamp >= timestamp);
  }

  /**
   * Search changes
   */
  search(predicate: (change: StoredChange) => boolean): StoredChange[] {
    return this.changes.filter(predicate);
  }

  /**
   * Clear all changes
   */
  clear(): void {
    this.changes = [];
    this.idCounter = 0;
  }

  /**
   * Get size of store
   */
  getSize(): number {
    return this.changes.length;
  }

  /**
   * Get max size
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Set max size
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    if (this.changes.length > maxSize) {
      this.changes = this.changes.slice(0, maxSize);
    }
  }

  /**
   * Export changes to JSON
   */
  toJSON(): object {
    return {
      size: this.changes.length,
      maxSize: this.maxSize,
      changes: this.changes,
    };
  }
}
