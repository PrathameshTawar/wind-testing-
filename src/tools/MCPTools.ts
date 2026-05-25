/**
 * MCPTools.ts
 * Implements MCP tool handlers for the cursor-reader module
 */

import path from 'path';
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

export class MCPTools {
  private safeFs: SafeFileSystem;
  private config: ConfigManager;

  private gitTracker: GitTracker;
  private codeSearch: CodeSearch;
  private changeStore: ChangeStore;
  private cursorDiscoverer: CursorDiscoverer;



  constructor(
    safeFs: SafeFileSystem,
    config: ConfigManager,
    gitTracker: GitTracker,
    codeSearch: CodeSearch,
    changeStore: ChangeStore,
    cursorDiscoverer: CursorDiscoverer,
  ) {
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
  getTools(): MCPTool[] {
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
  private listProjectsTool(): MCPTool {
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
  private getProjectTreeTool(): MCPTool {
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
        const { projectPath, maxDepth = 3 } = input as { projectPath: string; maxDepth?: number };

        try {
          const tree = await this.getDirectoryTree(projectPath, maxDepth);
          return { tree };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    };
  }

  /**
   * Read file tool
   */
  private readFileTool(): MCPTool {
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
        const { filePath } = input as { filePath: string };

        try {
          const content = await this.safeFs.readFile(filePath);
          return { filePath, content };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    };
  }

  /**
   * Search code tool
   */
  private searchCodeTool(): MCPTool {
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
        const {
          query,
          baseDir,
          caseSensitive = false,
          maxResults = 50,
        } = input as {
          query: string;
          baseDir: string;
          caseSensitive?: boolean;
          maxResults?: number;
        };

        try {
          const results = await this.codeSearch.search(query, baseDir, {
            caseSensitive,
            maxResults,
          });
          return { results, count: results.length };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    };
  }

  /**
   * Get recent changes tool
   */
  private getRecentChangesTool(): MCPTool {
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
        const { count = 50, type } = input as { count?: number; type?: string };

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
  private getLatestGitDiffTool(): MCPTool {
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
        const { projectPath } = input as { projectPath: string };

        try {
          const diff = await this.gitTracker.getLatestDiff(projectPath);
          return { diff };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    };
  }

  /**
   * Get prompt history tool
   */
  private getPromptHistoryTool(): MCPTool {
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
        const {
          cursorWorkspacePath = this.config.getCursorWorkspacePath(),
        } = input as { cursorWorkspacePath?: string };

        try {
          const metadata = await this.cursorDiscoverer.discoverWorkspace(cursorWorkspacePath);
          return { metadata };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    };
  }

  /**
   * Helper: Get directory tree recursively
   */
  private async getDirectoryTree(dirPath: string, maxDepth: number, depth: number = 0): Promise<object> {
    if (depth > maxDepth) {
      return { depth_limit_reached: true };
    }

    try {
      const entries = await this.safeFs.listDirectory(dirPath);

      const tree: Record<string, object> = {};

      for (const entry of entries) {
        if (entry.isDirectory && depth < maxDepth) {
          tree[path.basename(entry.path)] = await this.getDirectoryTree(entry.path, maxDepth, depth + 1);
        } else if (entry.isFile) {
          tree[path.basename(entry.path)] = {
            type: 'file',
            size: entry.size,
          };
        }
      }

      return tree;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

/**
 * Execute tool
 */
export async function executeTool(tools: MCPTool[], toolName: string, input: Record<string, unknown>): Promise<unknown> {
  const tool = tools.find(t => t.name === toolName);

  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  return tool.handler(input);
}
