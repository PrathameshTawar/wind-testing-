"use strict";
/**
 * SafeFileSystem.ts
 * Provides safe filesystem operations with security validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeFileSystem = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const SecurityValidator_1 = require("./SecurityValidator");
class SafeFileSystem {
    constructor(allowedRoots, rules) {
        this.validator = new SecurityValidator_1.SecurityValidator(rules);
        this.allowedRoots = allowedRoots.map(r => this.normalizePath(r));
    }
    /**
     * Safely read file contents
     */
    async readFile(filePath) {
        this.validatePath(filePath);
        try {
            const normalizedPath = this.normalizePath(filePath);
            const stats = await promises_1.default.stat(normalizedPath);
            if (!this.validator.isFileSizeAllowed(stats.size)) {
                throw new Error(`File size exceeds maximum allowed size`);
            }
            const content = await promises_1.default.readFile(normalizedPath, 'utf-8');
            return content;
        }
        catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Safely list directory contents
     */
    async listDirectory(dirPath) {
        this.validatePath(dirPath);
        try {
            const normalizedPath = this.normalizePath(dirPath);
            const entries = await promises_1.default.readdir(normalizedPath, { withFileTypes: true });
            const results = [];
            for (const entry of entries) {
                // Skip ignored directories and blocked files
                if (entry.isDirectory()) {
                    if (this.validator.isDirectoryIgnored(entry.name)) {
                        continue;
                    }
                }
                else {
                    if (this.validator.isFileBlocked(entry.name)) {
                        continue;
                    }
                }
                const fullPath = path_1.default.join(normalizedPath, entry.name);
                const stats = await promises_1.default.stat(fullPath);
                results.push({
                    path: fullPath,
                    size: stats.size,
                    isDirectory: entry.isDirectory(),
                    isFile: entry.isFile(),
                    created: stats.birthtime,
                    modified: stats.mtime,
                    permissions: stats.mode.toString(8),
                });
            }
            return results;
        }
        catch (error) {
            throw new Error(`Failed to list directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get file information
     */
    async getFileInfo(filePath) {
        this.validatePath(filePath);
        try {
            const normalizedPath = this.normalizePath(filePath);
            const stats = await promises_1.default.stat(normalizedPath);
            return {
                path: normalizedPath,
                size: stats.size,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
                created: stats.birthtime,
                modified: stats.mtime,
                permissions: stats.mode.toString(8),
            };
        }
        catch (error) {
            throw new Error(`Failed to get file info for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            this.validatePath(filePath);
            const normalizedPath = this.normalizePath(filePath);
            await promises_1.default.stat(normalizedPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Recursively get all files in a directory (respecting ignore rules)
     */
    async getAllFiles(dirPath, maxDepth = 10) {
        this.validatePath(dirPath);
        const results = [];
        await this.walkDirectory(this.normalizePath(dirPath), results, 0, maxDepth);
        return results;
    }
    /**
     * Private: Walk directory recursively
     */
    async walkDirectory(dirPath, results, depth, maxDepth) {
        if (depth > maxDepth)
            return;
        try {
            const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    if (!this.validator.isDirectoryIgnored(entry.name)) {
                        await this.walkDirectory(fullPath, results, depth + 1, maxDepth);
                    }
                }
                else {
                    if (!this.validator.isFileBlocked(entry.name) && this.validator.isExtensionAllowed(entry.name)) {
                        results.push(fullPath);
                    }
                }
            }
        }
        catch (error) {
            // Silently skip directories we can't read
        }
    }
    /**
     * Validate path before operations
     */
    validatePath(filePath) {
        if (!this.validator.isPathAllowed(filePath, this.allowedRoots)) {
            throw new Error(`Path not in allowed roots: ${filePath}`);
        }
        if (this.validator.isFileBlocked(filePath)) {
            throw new Error(`Access to this file is blocked: ${filePath}`);
        }
        if (this.validator.isDirectoryIgnored(filePath)) {
            throw new Error(`Directory is ignored: ${filePath}`);
        }
    }
    /**
     * Normalize path for consistency
     */
    normalizePath(filePath) {
        return path_1.default.normalize(filePath).replace(/\\/g, '/');
    }
    /**
     * Update allowed roots
     */
    setAllowedRoots(roots) {
        this.allowedRoots = roots.map(r => this.normalizePath(r));
    }
    /**
     * Get allowed roots
     */
    getAllowedRoots() {
        return [...this.allowedRoots];
    }
}
exports.SafeFileSystem = SafeFileSystem;
//# sourceMappingURL=SafeFileSystem.js.map