# CursorReader MCP

> A standalone, secure Model Context Protocol (MCP) module for tracking and reading Cursor workspace metadata

## Features

- 🔒 **Security First**: Encrypted path validation, blocked file patterns, safe metadata extraction
- 📁 **Safe Filesystem**: Validates all file operations against security rules
- 👀 **File Watcher**: Real-time file change detection with configurable patterns
- 🔍 **Code Search**: Safe text search with regex support
- 📝 **Git Tracking**: Track commits, diffs, and file history
- 💾 **Change Store**: Maintains history of recent file changes
- 🎯 **Cursor Discovery**: Safely extracts metadata from Cursor workspace
- 🛠️ **MCP Tools**: 7 powerful tools for workspace analysis

## Quick Start

```bash
# Install
npm install

# Build
npm run build

# Start server
npm start
```

## Usage

```typescript
import CursorReaderMCP from '@akhrot/cursor-reader';

// Initialize with project roots
const server = new CursorReaderMCP([
  '/home/user/my-project',
  '/home/user/another-project'
]);

// Start server
await server.start();

// Use tools
const projects = await server.handleRequest({
  method: 'list_projects'
});

const results = await server.handleRequest({
  method: 'search_code',
  params: {
    query: 'function main',
    baseDir: '/home/user/my-project'
  }
});
```

## Architecture

```
cursor-reader/
├── src/
│   ├── safe-fs/           # Secure file operations
│   ├── config/            # Configuration management
│   ├── watcher/           # File system monitoring
│   ├── git/               # Git repository tracking
│   ├── search/            # Code search functionality
│   ├── store/             # Change history storage
│   ├── tools/             # MCP tools & Cursor discoverer
│   ├── index.ts           # Main MCP server
│   ├── cli.ts             # CLI interface
│   └── example.ts         # Usage examples
├── tests/                 # Integration tests
├── README.md              # This file
├── API.md                 # API reference
├── ARCHITECTURE.md        # Design guide
├── QUICKSTART.md          # Getting started
└── SECURITY.md            # Security policy
```

## MCP Tools

### `list_projects`
Lists all tracked projects

### `get_project_tree`
Gets directory structure

### `read_file`
Safely reads file contents

### `search_code`
Searches for text/patterns in code

### `get_recent_changes`
Returns recent file change events

### `get_latest_git_diff`
Gets latest git commit

### `get_prompt_history`
Extracts Cursor prompt metadata

## Configuration

Create `~/.cursor-reader/config.json`:

```json
{
  "projectRoots": ["/home/user/my-project"],
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

## Security

CursorReader implements **multiple layers of security**:

✅ **Path Validation**: All paths validated against allowed roots  
✅ **File Blocking**: Credentials, keys, and secrets blocked automatically  
✅ **Safe Metadata**: Cursor workspace explored safely, no sensitive data extracted  
✅ **Size Limits**: Files limited to 5MB (configurable)  
✅ **Type Restrictions**: Only allowed file extensions  
✅ **Local-Only**: No network calls, all operations local  

[Full security details →](SECURITY.md)

## Documentation

- [API Reference](API.md) - Complete tool documentation
- [Architecture Guide](ARCHITECTURE.md) - Design and patterns
- [Quick Start](QUICKSTART.md) - Getting started guide
- [Security Policy](SECURITY.md) - Security measures

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch for changes
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

## Examples

See [src/example.ts](src/example.ts) for comprehensive usage examples.

## Requirements

- Node.js 16+
- npm 7+
- TypeScript 5.0+ (for development)

## Dependencies

- `chokidar` - File watching
- `simple-git` - Git operations
- `glob` - File pattern matching
- `minimatch` - Pattern matching

## Performance

- ⚡ Async operations prevent blocking
- 📦 Circular buffer limits memory usage
- 🔍 Search results capped at configurable limit
- 🛑 Depth limits prevent infinite recursion

## Limitations

- Read-only operations (no file modification)
- Local workspaces only (no remote access)
- Text files only (no binary analysis)
- Security rules cannot be disabled entirely

## Standalone Design

This module is designed as **completely standalone**:

- ✅ No integration with Akhrot required
- ✅ No shared dependencies  
- ✅ Independently deployable
- ✅ Can be used as a library or server

## Contributing

Contributions welcome! Areas for improvement:

- Additional search capabilities
- Database backing for change history
- Advanced git operations
- Plugin system for custom tools

## License

MIT - See [LICENSE](LICENSE)

## Support

- 📖 [Documentation](QUICKSTART.md)
- 🐛 [Report Issues](https://github.com/akhrot/mcp/issues)
- 💬 [Discussions](https://github.com/akhrot/mcp/discussions)
- 🔒 [Security Report](SECURITY.md#reporting)

## Roadmap

- [ ] Database backing for persistence
- [ ] Distributed mode support
- [ ] Advanced caching
- [ ] Plugin system
- [ ] Web UI dashboard
- [ ] CLI enhancements
- [ ] Performance optimizations

---

**Built with ❤️ for secure workspace management**
