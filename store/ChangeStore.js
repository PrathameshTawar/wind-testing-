"use strict";
/**
 * ChangeStore.ts
 * Stores and manages file change history
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeStore = void 0;
class ChangeStore {
    constructor(maxSize = 1000) {
        this.changes = [];
        this.idCounter = 0;
        this.maxSize = maxSize;
    }
    /**
     * Add a change to the store
     */
    addChange(event) {
        const change = {
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
    getAll() {
        return [...this.changes];
    }
    /**
     * Get recent changes
     */
    getRecent(count = 50) {
        return this.changes.slice(0, Math.min(count, this.changes.length));
    }
    /**
     * Get changes by type
     */
    getByType(type) {
        return this.changes.filter(c => c.type === type);
    }
    /**
     * Get changes for a file
     */
    getForFile(filePath) {
        return this.changes.filter(c => c.filePath === filePath);
    }
    /**
     * Get changes since timestamp
     */
    getSince(timestamp) {
        return this.changes.filter(c => c.timestamp >= timestamp);
    }
    /**
     * Search changes
     */
    search(predicate) {
        return this.changes.filter(predicate);
    }
    /**
     * Clear all changes
     */
    clear() {
        this.changes = [];
        this.idCounter = 0;
    }
    /**
     * Get size of store
     */
    getSize() {
        return this.changes.length;
    }
    /**
     * Get max size
     */
    getMaxSize() {
        return this.maxSize;
    }
    /**
     * Set max size
     */
    setMaxSize(maxSize) {
        this.maxSize = maxSize;
        if (this.changes.length > maxSize) {
            this.changes = this.changes.slice(0, maxSize);
        }
    }
    /**
     * Export changes to JSON
     */
    toJSON() {
        return {
            size: this.changes.length,
            maxSize: this.maxSize,
            changes: this.changes,
        };
    }
}
exports.ChangeStore = ChangeStore;
//# sourceMappingURL=ChangeStore.js.map