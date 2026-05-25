/**
 * SecurityRules.ts
 * Defines security rules for file access
 */
export interface SecurityRules {
    blockedFiles: string[];
    blockedPatterns: string[];
    ignoredDirs: string[];
    allowedRoots: string[];
    maxFileSize: number;
    allowedExtensions: string[];
}
export declare const DEFAULT_SECURITY_RULES: SecurityRules;
export declare class SecurityValidator {
    private rules;
    constructor(rules?: SecurityRules);
    /**
     * Check if a file is blocked
     */
    isFileBlocked(fileName: string): boolean;
    /**
     * Check if a directory should be ignored
     */
    isDirectoryIgnored(dirPath: string): boolean;
    /**
     * Check if a path is within allowed roots
     */
    isPathAllowed(filePath: string, allowedRoots: string[]): boolean;
    /**
     * Validate if a file can be read
     */
    canReadFile(filePath: string, allowedRoots: string[]): boolean;
    /**
     * Get file extension
     */
    getFileExtension(fileName: string): string;
    /**
     * Check if file extension is allowed
     */
    isExtensionAllowed(fileName: string): boolean;
    /**
     * Check file size
     */
    isFileSizeAllowed(sizeInBytes: number): boolean;
    /**
     * Normalize file path for comparison
     */
    private normalizePath;
    /**
     * Simple pattern matching (minimatch-like)
     */
    private matchesPattern;
    /**
     * Update rules
     */
    updateRules(partialRules: Partial<SecurityRules>): void;
    /**
     * Get current rules
     */
    getRules(): SecurityRules;
}
//# sourceMappingURL=SecurityValidator.d.ts.map