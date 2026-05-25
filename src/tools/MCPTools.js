"use strict";
/**
 * MCPTools.ts
 * Implements MCP tool handlers for the cursor-reader module
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPTools = void 0;
exports.executeTool = executeTool;
const path_1 = __importDefault(require("path"));
class MCPTools {
    constructor(safeFs, config, gitTracker, codeSearch, changeStore, cursorDiscoverer) {
        this.safeFs = safeFs;
        this.config = config;
        this.gitTracker = gitTracker;
        this.codeSearch = codeSearch;
        this.changeStore = changeStore;
        this.cursorDiscoverer = cursorDiscoverer;
    }
    /**
     * Get all available tools
     */
    getTools() {
        return [
            this.listProjectsTool(),
            this.getProjectTreeTool(),
            this.readFileTool(),
            this.searchCodeTool(),
            this.getRecentChangesTool(),
            this.getLatestGitDiffTool(),
            this.getPromptHistoryTool(),
        ];
    }
    /**
     * List projects tool
     */
    listProjectsTool() {
        return {
            name: 'list_projects',
            description: 'Lists all tracked projects in the workspace',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            handler: async () => {
                const roots = this.config.getProjectRoots();
                return { projects: roots };
            },
        };
    }
    /**
     * Get project tree tool
     */
    getProjectTreeTool() {
        return {
            name: 'get_project_tree',
            description: 'Gets the directory structure for a project',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Path to the project',
                    },
                    maxDepth: {
                        type: 'number',
                        description: 'Maximum directory depth (default: 3)',
                    },
                },
                required: ['projectPath'],
            },
            handler: async (input) => {
                const { projectPath, maxDepth = 3 } = input;
                try {
                    const tree = await this.getDirectoryTree(projectPath, maxDepth);
                    return { tree };
                }
                catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        };
    }
    /**
     * Read file tool
     */
    readFileTool() {
        return {
            name: 'read_file',
            description: 'Safely reads file contents',
            inputSchema: {
                type: 'object',
                properties: {
                    filePath: {
                        type: 'string',
                        description: 'Path to the file to read',
                    },
                },
                required: ['filePath'],
            },
            handler: async (input) => {
                const { filePath } = input;
                try {
                    const content = await this.safeFs.readFile(filePath);
                    return { filePath, content };
                }
                catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        };
    }
    /**
     * Search code tool
     */
    searchCodeTool() {
        return {
            name: 'search_code',
            description: 'Searches for text or patterns in code',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query',
                    },
                    baseDir: {
                        type: 'string',
                        description: 'Base directory to search in',
                    },
                    caseSensitive: {
                        type: 'boolean',
                        description: 'Case sensitive search',
                    },
                    maxResults: {
                        type: 'number',
                        description: 'Maximum results to return (default: 50)',
                    },
                },
                required: ['query', 'baseDir'],
            },
            handler: async (input) => {
                const { query, baseDir, caseSensitive = false, maxResults = 50, } = input;
                try {
                    const results = await this.codeSearch.search(query, baseDir, {
                        caseSensitive,
                        maxResults,
                    });
                    return { results, count: results.length };
                }
                catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        };
    }
    /**
     * Get recent changes tool
     */
    getRecentChangesTool() {
        return {
            name: 'get_recent_changes',
            description: 'Returns recent file change events',
            inputSchema: {
                type: 'object',
                properties: {
                    count: {
                        type: 'number',
                        description: 'Number of recent changes to return (default: 50)',
                    },
                    type: {
                        type: 'string',
                        description: 'Filter by change type (add, change, delete, addDir, unlinkDir)',
                    },
                },
            },
            handler: async (input) => {
                const { count = 50, type } = input;
                const changes = type
                    ? this.changeStore.getByType(type)
                    : this.changeStore.getRecent(count);
                return {
                    changes: changes.slice(0, count),
                    count: changes.length,
                };
            },
        };
    }
    /**
     * Get latest git diff tool
     */
    getLatestGitDiffTool() {
        return {
            name: 'get_latest_git_diff',
            description: 'Gets the latest git diff for a project',
            inputSchema: {
                type: 'object',
                properties: {
                    projectPath: {
                        type: 'string',
                        description: 'Path to the git repository',
                    },
                },
                required: ['projectPath'],
            },
            handler: async (input) => {
                const { projectPath } = input;
                try {
                    const diff = await this.gitTracker.getLatestDiff(projectPath);
                    return { diff };
                }
                catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        };
    }
    /**
     * Get prompt history tool
     */
    getPromptHistoryTool() {
        return {
            name: 'get_prompt_history',
            description: 'Extracts prompt summaries and metadata from Cursor workspace',
            inputSchema: {
                type: 'object',
                properties: {
                    cursorWorkspacePath: {
                        type: 'string',
                        description: 'Path to Cursor workspace (optional, auto-detected if not provided)',
                    },
                },
            },
            handler: async (input) => {
                const { cursorWorkspacePath = this.config.getCursorWorkspacePath(), } = input;
                try {
                    const metadata = await this.cursorDiscoverer.discoverWorkspace(cursorWorkspacePath);
                    return { metadata };
                }
                catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        };
    }
    /**
     * Helper: Get directory tree recursively
     */
    async getDirectoryTree(dirPath, maxDepth, depth = 0) {
        if (depth > maxDepth) {
            return { depth_limit_reached: true };
        }
        try {
            const entries = await this.safeFs.listDirectory(dirPath);
            const tree = {};
            for (const entry of entries) {
                if (entry.isDirectory && depth < maxDepth) {
                    tree[path_1.default.basename(entry.path)] = await this.getDirectoryTree(entry.path, maxDepth, depth + 1);
                }
                else if (entry.isFile) {
                    tree[path_1.default.basename(entry.path)] = {
                        type: 'file',
                        size: entry.size,
                    };
                }
            }
            return tree;
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}
exports.MCPTools = MCPTools;
/**
 * Execute tool
 */
async function executeTool(tools, toolName, input) {
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
    }
    return tool.handler(input);
}
//# sourceMappingURL=MCPTools.js.map