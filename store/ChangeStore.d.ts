/**
 * ChangeStore.ts
 * Stores and manages file change history
 */
import { FileChangeEvent } from '../watcher';
export interface StoredChange extends FileChangeEvent {
    id: string;
}
export declare class ChangeStore {
    private changes;
    private maxSize;
    private idCounter;
    constructor(maxSize?: number);
    /**
     * Add a change to the store
     */
    addChange(event: FileChangeEvent): void;
    /**
     * Get all changes
     */
    getAll(): StoredChange[];
    /**
     * Get recent changes
     */
    getRecent(count?: number): StoredChange[];
    /**
     * Get changes by type
     */
    getByType(type: string): StoredChange[];
    /**
     * Get changes for a file
     */
    getForFile(filePath: string): StoredChange[];
    /**
     * Get changes since timestamp
     */
    getSince(timestamp: Date): StoredChange[];
    /**
     * Search changes
     */
    search(predicate: (change: StoredChange) => boolean): StoredChange[];
    /**
     * Clear all changes
     */
    clear(): void;
    /**
     * Get size of store
     */
    getSize(): number;
    /**
     * Get max size
     */
    getMaxSize(): number;
    /**
     * Set max size
     */
    setMaxSize(maxSize: number): void;
    /**
     * Export changes to JSON
     */
    toJSON(): object;
}
//# sourceMappingURL=ChangeStore.d.ts.map