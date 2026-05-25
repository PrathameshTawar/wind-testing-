/**
 * MCPTools.ts
 * Implements MCP tool handlers for the cursor-reader module
 */
import { SafeFileSystem } from '../safe-fs';
import { ConfigManager } from '../config';
import { GitTracker } from '../git';
import { CodeSearch } from '../search';
import { ChangeStore } from '../store';
import { CursorDiscoverer } from './CursorDiscoverer';
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (input: Record<string, unknown>) => Promise<unknown>;
}
export declare class MCPTools {
    private safeFs;
    private config;
    private gitTracker;
    private codeSearch;
    private changeStore;
    private cursorDiscoverer;
    constructor(safeFs: SafeFileSystem, config: ConfigManager, gitTracker: GitTracker, codeSearch: CodeSearch, changeStore: ChangeStore, cursorDiscoverer: CursorDiscoverer);
    /**
     * Get all available tools
     */
    getTools(): MCPTool[];
    /**
     * List projects tool
     */
    private listProjectsTool;
    /**
     * Get project tree tool
     */
    private getProjectTreeTool;
    /**
     * Read file tool
     */
    private readFileTool;
    /**
     * Search code tool
     */
    private searchCodeTool;
    /**
     * Get recent changes tool
     */
    private getRecentChangesTool;
    /**
     * Get latest git diff tool
     */
    private getLatestGitDiffTool;
    /**
     * Get prompt history tool
     */
    private getPromptHistoryTool;
    /**
     * Helper: Get directory tree recursively
     */
    private getDirectoryTree;
}
/**
 * Execute tool
 */
export declare function executeTool(tools: MCPTool[], toolName: string, input: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=MCPTools.d.ts.map