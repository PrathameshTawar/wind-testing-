"use strict";
/**
 * index.ts
 * Main MCP server for cursor-reader
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorDiscoverer = exports.executeTool = exports.MCPTools = exports.ChangeStore = exports.CodeSearch = exports.GitTracker = exports.FileWatcher = exports.ConfigManager = exports.DEFAULT_SECURITY_RULES = exports.SafeFileSystem = exports.CursorReaderMCP = void 0;
const safe_fs_1 = require("./safe-fs");
const config_1 = require("./config");
const watcher_1 = require("./watcher");
const git_1 = require("./git");
const search_1 = require("./search");
const store_1 = require("./store");
const tools_1 = require("./tools");
const tools_2 = require("./tools");
/**
 * CursorReaderMCP - Main MCP server class
 */
class CursorReaderMCP {
    /**
     * Initialize the MCP server
     */
    constructor(allowedRoots = []) {
        // Initialize safe filesystem
        this.safeFs = new safe_fs_1.SafeFileSystem(allowedRoots);
        // Initialize configuration
        this.config = new config_1.ConfigManager({
            projectRoots: allowedRoots,
        });
        // Initialize file watcher
        this.watcher = new watcher_1.FileWatcher();
        // Initialize git tracker
        this.gitTracker = new git_1.GitTracker();
        // Initialize code search
        this.codeSearch = new search_1.CodeSearch(this.safeFs);
        // Initialize change store
        this.changeStore = new store_1.ChangeStore();
        // Initialize cursor discoverer
        this.cursorDiscoverer = new tools_2.CursorDiscoverer(this.safeFs);
        // Initialize MCP tools
        this.mcpTools = new tools_1.MCPTools(this.safeFs, this.config, this.gitTracker, this.codeSearch, this.changeStore, this.cursorDiscoverer);
        // Wire up file change events to change store
        this.setupChangeTracking();
    }
    /**
     * Setup change tracking from file watcher
     */
    setupChangeTracking() {
        this.watcher.on('all', (event) => {
            this.changeStore.addChange(event);
        });
    }
    /**
     * Start the MCP server
     */
    async start() {
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
    async stop() {
        await this.watcher.stopWatching();
        console.log('CursorReader MCP server stopped');
    }
    /**
     * Handle MCP requests
     */
    async handleRequest(request) {
        try {
            const { method, params = {} } = request;
            // Handle tool calls
            const tools = this.mcpTools.getTools();
            const tool = tools.find(t => t.name === method);
            if (tool) {
                const result = await (0, tools_1.executeTool)(tools, method, params);
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
                    this.config.updateConfig(params);
                    return { result: this.config.getConfig() };
                case 'add_project_root':
                    {
                        const { path: rootPath } = params;
                        this.config.addProjectRoot(rootPath);
                        this.safeFs.setAllowedRoots(this.config.getProjectRoots());
                        // Restart watcher if already running
                        if (this.watcher.isWatching()) {
                            await this.watcher.stopWatching();
                            await this.watcher.startWatching(this.config.getProjectRoots(), this.config.getIgnorePatterns());
                        }
                        return { result: { projectRoots: this.config.getProjectRoots() } };
                    }
                case 'remove_project_root':
                    {
                        const { path: rootPath } = params;
                        this.config.removeProjectRoot(rootPath);
                        this.safeFs.setAllowedRoots(this.config.getProjectRoots());
                        // Restart watcher if already running
                        if (this.watcher.isWatching()) {
                            await this.watcher.stopWatching();
                            await this.watcher.startWatching(this.config.getProjectRoots(), this.config.getIgnorePatterns());
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
        }
        catch (error) {
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
exports.CursorReaderMCP = CursorReaderMCP;
// Export all modules for external use
var safe_fs_2 = require("./safe-fs");
Object.defineProperty(exports, "SafeFileSystem", { enumerable: true, get: function () { return safe_fs_2.SafeFileSystem; } });
Object.defineProperty(exports, "DEFAULT_SECURITY_RULES", { enumerable: true, get: function () { return safe_fs_2.DEFAULT_SECURITY_RULES; } });
var config_2 = require("./config");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return config_2.ConfigManager; } });
var watcher_2 = require("./watcher");
Object.defineProperty(exports, "FileWatcher", { enumerable: true, get: function () { return watcher_2.FileWatcher; } });
var git_2 = require("./git");
Object.defineProperty(exports, "GitTracker", { enumerable: true, get: function () { return git_2.GitTracker; } });
var search_2 = require("./search");
Object.defineProperty(exports, "CodeSearch", { enumerable: true, get: function () { return search_2.CodeSearch; } });
var store_2 = require("./store");
Object.defineProperty(exports, "ChangeStore", { enumerable: true, get: function () { return store_2.ChangeStore; } });
var tools_3 = require("./tools");
Object.defineProperty(exports, "MCPTools", { enumerable: true, get: function () { return tools_3.MCPTools; } });
Object.defineProperty(exports, "executeTool", { enumerable: true, get: function () { return tools_3.executeTool; } });
Object.defineProperty(exports, "CursorDiscoverer", { enumerable: true, get: function () { return tools_3.CursorDiscoverer; } });
// Default export
exports.default = CursorReaderMCP;
//# sourceMappingURL=index.js.map