# Cursor Reader MCP

A standalone Model Context Protocol (MCP) module for tracking and reading Cursor workspace metadata safely.

## Features

- **Safe Filesystem Layer**: Validates all file operations against security rules
- **File Watcher**: Monitors allowed project roots for file changes
- **Git Tracking**: Tracks git changes and recent modifications
- **Code Search**: Safe search functionality within projects
- **Cursor Workspace Discovery**: Finds and extracts metadata from Cursor workspace
- **Change Store**: Maintains a history of recent file changes
- **MCP Server**: Exposes tools for workspace analysis

## Architecture

```
src/
├── config/          - Configuration management and validation
├── safe-fs/         - Safe filesystem operations
├── watcher/         - File change detection
├── git/             - Git operations
├── search/          - Code search functionality
├── store/           - Change history storage
├── tools/           - MCP tool implementations
└── index.ts         - MCP server entry point
```

## Security Features

### Blocked Files
- `.env`, `.env.local`, `.env.*.local`
- Private keys (`.pem`, `.key`, `.p8`, etc.)
- Secrets (`.secret`, `.pass`, etc.)
- Database credentials
- SSH keys

### Ignored Directories
- `node_modules/`
- `.git/`
- `dist/`, `build/`, `out/`
- `.venv/`, `venv/`
- Package manager caches

### Cursor-Specific Safe Paths
- `.cursor/` - Cursor settings
- `workspaceStorage/` - Workspace metadata
- `state.vscdb` - State database (metadata only)

## MCP Tools

### `list_projects`
Lists all tracked projects in allowed workspace roots.

### `get_project_tree`
Gets the directory tree structure for a project.

### `read_file`
Safely reads file contents with validation.

### `search_code`
Searches code within projects.

### `get_recent_changes`
Returns recent file change events.

### `get_latest_git_diff`
Gets latest git diff for a project.

### `get_prompt_history`
Extracts prompt summaries and metadata from Cursor workspace.

## Installation

```bash
npm install
npm run build
npm start
```

## Configuration

Configuration is managed through `config/ConfigManager.ts`. See configuration files in the `config/` directory.

## Usage

The module runs as an MCP server and exposes tools for workspace analysis. All file operations are validated for security before execution.

## Security Notes

- No credentials or tokens are extracted
- All paths are validated against allowed roots
- Blocked file patterns are enforced
- No arbitrary shell execution
- Metadata-only extraction from Cursor workspace
