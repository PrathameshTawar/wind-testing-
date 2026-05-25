/**
 * ARCHITECTURE.md
 * Architecture and design patterns for CursorReader MCP
 */

# CursorReader MCP - Architecture Guide

## Overview

CursorReader is a standalone MCP (Model Context Protocol) module designed to safely track and read Cursor workspace metadata. The architecture emphasizes security, modularity, and extensibility.

## Core Components

### 1. Safe Filesystem (`safe-fs/`)

**Purpose**: Provides secure file operations with validation

**Files**:
- `SecurityValidator.ts` - Validates paths and enforces security rules
- `SafeFileSystem.ts` - Implements safe read operations

**Key Features**:
- Path validation against allowed roots
- File blocking patterns (credentials, keys, etc.)
- Directory ignoring (node_modules, .git, etc.)
- File size limits
- Extension whitelist

**Usage**:
```typescript
const safeFs = new SafeFileSystem(['/home/user/projects']);
const content = await safeFs.readFile('/home/user/projects/main.ts');
```

### 2. Configuration (`config/`)

**Purpose**: Manages module configuration persistently

**Files**:
- `ConfigManager.ts` - Configuration management

**Key Features**:
- Project root management
- Feature toggle (watch, git)
- Configurable ignore patterns
- Cursor workspace path detection
- File-based persistence

**Usage**:
```typescript
const config = new ConfigManager({
  projectRoots: ['/path/to/project'],
  watchEnabled: true,
  gitEnabled: true,
});
await config.save('/path/to/config.json');
```

### 3. File Watcher (`watcher/`)

**Purpose**: Monitors file system changes

**Files**:
- `FileWatcher.ts` - File system monitoring using Chokidar

**Key Features**:
- Directory watching with ignore patterns
- Event types: add, change, delete, addDir, unlinkDir
- Debounced write finalization
- Event listener pattern

**Usage**:
```typescript
const watcher = new FileWatcher();
await watcher.startWatching(['/path/to/project'], ['**/node_modules/**']);
watcher.on('change', (event) => console.log('File changed:', event.filePath));
```

### 4. Git Tracking (`git/`)

**Purpose**: Tracks Git repository changes

**Files**:
- `GitTracker.ts` - Git operations wrapper

**Key Features**:
- Recent changes tracking
- Commit history
- File history
- Git status
- Diff between commits

**Usage**:
```typescript
const gitTracker = new GitTracker();
const repoInfo = await gitTracker.initRepository('/path/to/repo');
const changes = await gitTracker.getRecentChanges('/path/to/repo', 10);
```

### 5. Code Search (`search/`)

**Purpose**: Safely search code within projects

**Files**:
- `CodeSearch.ts` - Text and pattern search

**Key Features**:
- Text search with regex support
- Case-sensitive/whole-word options
- File pattern matching
- Result context (line numbers, snippets)
- Safe filesystem integration

**Usage**:
```typescript
const search = new CodeSearch(safeFs);
const results = await search.search('TODO', '/path/to/project', {
  useRegex: false,
  maxResults: 50,
});
```

### 6. Change Store (`store/`)

**Purpose**: Maintains history of file changes

**Files**:
- `ChangeStore.ts` - In-memory change history

**Key Features**:
- Circular buffer storage
- Query by type, file, or timestamp
- Size management
- Export to JSON

**Usage**:
```typescript
const store = new ChangeStore(1000);
store.addChange({ type: 'change', filePath: '/file.ts', timestamp: new Date() });
const recent = store.getRecent(50);
```

### 7. Tools (`tools/`)

**Purpose**: Implements MCP tools and Cursor workspace discovery

**Files**:
- `MCPTools.ts` - MCP tool handlers
- `CursorDiscoverer.ts` - Cursor workspace metadata extraction

**Key Features**:
- 7 MCP tools for workspace management
- Safe metadata extraction from Cursor
- Prompt history discovery
- Workspace metadata aggregation

**MCP Tools**:
1. `list_projects` - List configured projects
2. `get_project_tree` - Get directory structure
3. `read_file` - Safe file reading
4. `search_code` - Code search
5. `get_recent_changes` - Recent file changes
6. `get_latest_git_diff` - Latest git commit
7. `get_prompt_history` - Cursor prompt metadata

**Usage**:
```typescript
const tools = new MCPTools(...);
const result = await executeTool(tools.getTools(), 'search_code', {
  query: 'function',
  baseDir: '/path/to/project',
});
```

### 8. Main Server (`index.ts`)

**Purpose**: Orchestrates all components

**Key Class**: `CursorReaderMCP`

**Main Methods**:
- `start()` - Initialize and start server
- `stop()` - Gracefully shutdown
- `handleRequest()` - Process MCP requests
- `getTools()` - Get available tools

## Security Model

### Path Validation
- All paths must be within allowed roots
- Paths are normalized and compared against blocked files/patterns
- Directories with ignored names are skipped

### Blocked Resources
- Environment files (`.env`, `.env.local`)
- Private keys (`.pem`, `.key`, `.p8`)
- Secrets and credentials (`.secret`, `.pass`)
- Database files
- SSH keys

### File Extension Whitelist
- Safe text formats (ts, js, json, md, yaml, etc.)
- Compiled binaries excluded
- System files excluded

### Size Limits
- Maximum file size: 5MB
- Configurable per instance

## Data Flow

```
File System Changes
    ↓
FileWatcher ─→ ChangeStore
    ↓
MCP Request ─→ MCPTools ─→ SafeFileSystem ✓ (validated)
    ↓
Response → Client
```

## Error Handling

- All operations wrap errors in try-catch
- Security violations throw immediately
- File not found returns gracefully
- Invalid config fails validation

## Extension Points

### Adding Custom Tools
```typescript
// Extend MCPTools class
class CustomMCPTools extends MCPTools {
  customTool(): MCPTool {
    return {
      name: 'custom_tool',
      description: 'Custom tool',
      inputSchema: {...},
      handler: async (input) => {...}
    };
  }
}
```

### Custom Security Rules
```typescript
const customRules = {
  ...DEFAULT_SECURITY_RULES,
  blockedFiles: [..., 'custom.blocked'],
};
const safeFs = new SafeFileSystem(roots, customRules);
```

## Configuration Example

```json
{
  "projectRoots": [
    "/home/user/my-project",
    "/home/user/another-project"
  ],
  "watchEnabled": true,
  "gitEnabled": true,
  "maxChangeHistory": 1000,
  "searchMaxResults": 50,
  "ignorePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**"
  ]
}
```

## Performance Considerations

- File watching uses Chokidar with debouncing
- Change store uses circular buffer (memory bounded)
- Search results limited by maxResults parameter
- Directory traversal depth limits prevent deep recursion
- Async operations prevent blocking

## Testing Strategy

- Unit tests for each component
- Integration tests for workflows
- Security validation tests
- Error handling verification

## Future Enhancements

- Database backing for change history
- Distributed mode support
- Advanced indexing for faster search
- Incremental git diff caching
- Plugin system for custom tools
