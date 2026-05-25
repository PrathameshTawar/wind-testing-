/**
 * SafeFileSystem.ts
 * Provides safe filesystem operations with security validation
 */
import { SecurityRules } from './SecurityValidator';
export interface FileInfo {
    path: string;
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    created: Date;
    modified: Date;
    permissions: string;
}
export declare class SafeFileSystem {
    private validator;
    private allowedRoots;
    constructor(allowedRoots: string[], rules?: SecurityRules);
    /**
     * Safely read file contents
     */
    readFile(filePath: string): Promise<string>;
    /**
     * Safely list directory contents
     */
    listDirectory(dirPath: string): Promise<FileInfo[]>;
    /**
     * Get file information
     */
    getFileInfo(filePath: string): Promise<FileInfo>;
    /**
     * Check if file exists
     */
    fileExists(filePath: string): Promise<boolean>;
    /**
     * Recursively get all files in a directory (respecting ignore rules)
     */
    getAllFiles(dirPath: string, maxDepth?: number): Promise<string[]>;
    /**
     * Private: Walk directory recursively
     */
    private walkDirectory;
    /**
     * Validate path before operations
     */
    private validatePath;
    /**
     * Normalize path for consistency
     */
    private normalizePath;
    /**
     * Update allowed roots
     */
    setAllowedRoots(roots: string[]): void;
    /**
     * Get allowed roots
     */
    getAllowedRoots(): string[];
}
//# sourceMappingURL=SafeFileSystem.d.ts.map