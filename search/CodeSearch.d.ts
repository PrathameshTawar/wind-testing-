/**
 * CodeSearch.ts
 * Provides safe code search functionality
 */
import { SafeFileSystem } from '../safe-fs';
export interface SearchResult {
    filePath: string;
    lineNumber: number;
    lineContent: string;
    matchStart: number;
    matchEnd: number;
}
export interface SearchOptions {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    useRegex?: boolean;
    maxResults?: number;
    filePattern?: string;
}
export declare class CodeSearch {
    private safeFs;
    constructor(safeFs: SafeFileSystem);
    /**
     * Search for text in code
     */
    search(searchTerm: string, baseDir: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Search in file content
     */
    private searchInContent;
    /**
     * Search for files by name
     */
    searchFiles(filePattern: string, baseDir: string, maxResults?: number): Promise<string[]>;
}
//# sourceMappingURL=CodeSearch.d.ts.map