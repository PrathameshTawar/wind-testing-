/**
 * index.ts
 * Main MCP server for cursor-reader
 */

import { SafeFileSystem } from './safe-fs';

import { ConfigManager } from './config';
import { FileWatcher, FileChangeEvent } from './watcher';
import { GitTracker } from './git';
import { CodeSearch } from './search';
import { ChangeStore } from './store';
import { MCPTools, executeTool } from './tools';
import { CursorDiscoverer } from './tools';

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
export class CursorReaderMCP {
  private safeFs: SafeFileSystem;
  private config: ConfigManager;
  private watcher: FileWatcher;
  private gitTracker: GitTracker;
  private codeSearch: CodeSearch;
  private changeStore: ChangeStore;
  private mcpTools: MCPTools;
  private cursorDiscoverer: CursorDiscoverer;

  /**
   * Initialize the MCP server
   */
  constructor(allowedRoots: string[] = []) {

    // Initialize safe filesystem
    this.safeFs = new SafeFileSystem(allowedRoots);

    // Initialize configuration
    this.config = new ConfigManager({
      projectRoots: allowedRoots,
    });

    // Initialize file watcher
    this.watcher = new FileWatcher();

    // Initialize git tracker
    this.gitTracker = new GitTracker();

    // Initialize code search
    this.codeSearch = new CodeSearch(this.safeFs);

    // Initialize change store
    this.changeStore = new ChangeStore();

    // Initialize cursor discoverer
    this.cursorDiscoverer = new CursorDiscoverer(this.safeFs);

    // Initialize MCP tools
    this.mcpTools = new MCPTools(
      this.safeFs,
      this.config,
      this.gitTracker,
      this.codeSearch,
      this.changeStore,
      this.cursorDiscoverer,
    );

    // Wire up file change events to change store
    this.setupChangeTracking();
  }

  /**
   * Setup change tracking from file watcher
   */
  private setupChangeTracking(): void {
    this.watcher.on('all', (event: FileChangeEvent) => {
      this.changeStore.addChange(event);
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const projectRoots = this.config.getProjectRoots();

    if (projectRoots.length === 0) {
      console.warn('Warning: No project roots configured. Please add project roots before starting.');
      return;
    }

    // Start file watcher
    if (this.config.isWatchEnabled()) {
      const ignorePatterns = this.config.getIgnorePatterns();
      await this.watcher.startWatching(projectRoots, ignorePatterns);
      console.log('File watcher started');
    }

    // Initialize git tracking
    if (this.config.isGitEnabled()) {
      for (const root of projectRoots) {
        await this.gitTracker.initRepository(root);
      }
      console.log('Git tracking initialized');
    }

    console.log('CursorReader MCP server started');
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.watcher.stopWatching();
    console.log('CursorReader MCP server stopped');
  }

  /**
   * Handle MCP requests
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const { method, params = {} } = request;

      // Handle tool calls
      const tools = this.mcpTools.getTools();
      const tool = tools.find(t => t.name === method);

      if (tool) {
        const result = await executeTool(tools, method, params);
        return { result };
      }

      // Handle built-in methods
      switch (method) {
        case 'list_tools':
          return {
            result: this.mcpTools.getTools().map(t => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
            })),
          };

        case 'get_config':
          return { result: this.config.getConfig() };

        case 'update_config':
          this.config.updateConfig(params as Record<string, unknown>);
          return { result: this.config.getConfig() };

        case 'add_project_root':
          {
            const { path: rootPath } = params as { path: string };
            this.config.addProjectRoot(rootPath);
            this.safeFs.setAllowedRoots(this.config.getProjectRoots());

            // Restart watcher if already running
            if (this.watcher.isWatching()) {
              await this.watcher.stopWatching();
              await this.watcher.startWatching(
                this.config.getProjectRoots(),
                this.config.getIgnorePatterns(),
              );
            }

            return { result: { projectRoots: this.config.getProjectRoots() } };
          }

        case 'remove_project_root':
          {
            const { path: rootPath } = params as { path: string };
            this.config.removeProjectRoot(rootPath);
            this.safeFs.setAllowedRoots(this.config.getProjectRoots());

            // Restart watcher if already running
            if (this.watcher.isWatching()) {
              await this.watcher.stopWatching();
              await this.watcher.startWatching(
                this.config.getProjectRoots(),
                this.config.getIgnorePatterns(),
              );
            }

            return { result: { projectRoots: this.config.getProjectRoots() } };
          }

        case 'get_status':
          return {
            result: {
              isWatching: this.watcher.isWatching(),
              projectRoots: this.config.getProjectRoots(),
              changeHistorySize: this.changeStore.getSize(),
              watcherStatus: this.watcher.getStatus(),
            },
          };

        case 'clear_changes':
          this.changeStore.clear();
          return { result: { cleared: true } };

        default:
          return { error: `Unknown method: ${method}` };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get MCP tools
   */
  getTools() {
    return this.mcpTools.getTools();
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get change store
   */
  getChangeStore() {
    return this.changeStore;
  }

  /**
   * Get safe filesystem
   */
  getSafeFileSystem() {
    return this.safeFs;
  }
}

// Export all modules for external use
export { SafeFileSystem, DEFAULT_SECURITY_RULES } from './safe-fs';
export { ConfigManager, CursorReaderConfig } from './config';
export { FileWatcher, FileChangeEvent, FileChangeType } from './watcher';
export { GitTracker, GitChange, GitDiff, RepositoryInfo } from './git';
export { CodeSearch, SearchResult, SearchOptions } from './search';
export { ChangeStore, StoredChange } from './store';
export { MCPTools, MCPTool, executeTool, CursorDiscoverer, PromptMetadata, CursorWorkspaceMetadata } from './tools';

// Default export
export default CursorReaderMCP;
