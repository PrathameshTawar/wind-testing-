/**
 * CursorDiscoverer.ts
 * Safely discovers and extracts metadata from Cursor workspace
 */
import { SafeFileSystem } from '../safe-fs';
export interface PromptMetadata {
    id: string;
    summary: string;
    timestamp: Date;
    relatedFiles: string[];
    tags?: string[];
}
export interface CursorWorkspaceMetadata {
    discoveredAt: Date;
    cursorVersion?: string;
    projects: string[];
    recentPrompts: PromptMetadata[];
    workspaceSettings?: Record<string, unknown>;
}
export declare class CursorDiscoverer {
    private safeFs;
    constructor(safeFs: SafeFileSystem);
    /**
     * Discover Cursor workspace metadata
     */
    discoverWorkspace(cursorWorkspacePath: string): Promise<CursorWorkspaceMetadata>;
    /**
     * Read Cursor version
     */
    private readCursorVersion;
    /**
     * Read workspace settings
     */
    private readWorkspaceSettings;
    /**
     * Discover projects from workspace
     */
    private discoverProjects;
    /**
     * Extract prompt history from Cursor workspace
     */
    private extractPromptHistory;
    /**
     * Extract prompt metadata from a single file
     */
    private extractPromptFromFile;
    /**
     * Extract summary from data
     */
    private extractSummary;
    /**
     * Extract related files from data
     */
    private extractRelatedFiles;
    /**
     * List all projects in workspace
     */
    listProjects(cursorWorkspacePath: string): Promise<string[]>;
}
//# sourceMappingURL=CursorDiscoverer.d.ts.map