/**
 * index.ts
 * Main MCP server for cursor-reader
 */
import { SafeFileSystem } from './safe-fs';
import { ConfigManager } from './config';
import { ChangeStore } from './store';
export interface MCPRequest {
    method: string;
    params?: Record<string, unknown>;
}
export interface MCPResponse {
    result?: unknown;
    error?: string;
}
/**
 * CursorReaderMCP - Main MCP server class
 */
export declare class CursorReaderMCP {
    private safeFs;
    private config;
    private watcher;
    private gitTracker;
    private codeSearch;
    private changeStore;
    private mcpTools;
    private cursorDiscoverer;
    /**
     * Initialize the MCP server
     */
    constructor(allowedRoots?: string[]);
    /**
     * Setup change tracking from file watcher
     */
    private setupChangeTracking;
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server
     */
    stop(): Promise<void>;
    /**
     * Handle MCP requests
     */
    handleRequest(request: MCPRequest): Promise<MCPResponse>;
    /**
     * Get MCP tools
     */
    getTools(): import("./tools").MCPTool[];
    /**
     * Get current configuration
     */
    getConfig(): ConfigManager;
    /**
     * Get change store
     */
    getChangeStore(): ChangeStore;
    /**
     * Get safe filesystem
     */
    getSafeFileSystem(): SafeFileSystem;
}
export { SafeFileSystem, DEFAULT_SECURITY_RULES } from './safe-fs';
export { ConfigManager, CursorReaderConfig } from './config';
export { FileWatcher, FileChangeEvent, FileChangeType } from './watcher';
export { GitTracker, GitChange, GitDiff, RepositoryInfo } from './git';
export { CodeSearch, SearchResult, SearchOptions } from './search';
export { ChangeStore, StoredChange } from './store';
export { MCPTools, MCPTool, executeTool, CursorDiscoverer, PromptMetadata, CursorWorkspaceMetadata } from './tools';
export default CursorReaderMCP;
//# sourceMappingURL=index.d.ts.map