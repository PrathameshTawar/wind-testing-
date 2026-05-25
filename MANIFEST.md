# Project Structure & File Manifest

## Directory Structure

```
cursor-reader/
├── src/
│   ├── safe-fs/
│   │   ├── SecurityValidator.ts      - Path and file validation
│   │   ├── SafeFileSystem.ts         - Safe file operations
│   │   └── index.ts                  - Module exports
│   ├── config/
│   │   ├── ConfigManager.ts          - Configuration management
│   │   └── index.ts                  - Module exports
│   ├── watcher/
│   │   ├── FileWatcher.ts            - File system monitoring
│   │   └── index.ts                  - Module exports
│   ├── git/
│   │   ├── GitTracker.ts             - Git operations
│   │   └── index.ts                  - Module exports
│   ├── search/
│   │   ├── CodeSearch.ts             - Code search functionality
│   │   └── index.ts                  - Module exports
│   ├── store/
│   │   ├── ChangeStore.ts            - Change history storage
│   │   └── index.ts                  - Module exports
│   ├── tools/
│   │   ├── MCPTools.ts               - MCP tool implementations
│   │   ├── CursorDiscoverer.ts       - Cursor workspace discovery
│   │   └── index.ts                  - Module exports
│   ├── index.ts                      - Main MCP server
│   ├── cli.ts                        - CLI interface
│   └── example.ts                    - Usage examples
├── tests/
│   └── integration.test.ts           - Integration tests
├── package.json                      - Dependencies & scripts
├── tsconfig.json                     - TypeScript configuration
├── jest.config.js                    - Jest test configuration
├── .eslintrc.json                    - ESLint configuration
├── .gitignore                        - Git ignore patterns
├── .env.example                      - Configuration template
├── README.md                         - Main README
├── README_EXTENDED.md                - Extended features
├── API.md                            - API reference
├── ARCHITECTURE.md                   - Architecture guide
├── QUICKSTART.md                     - Quick start guide
├── SECURITY.md                       - Security policy
├── LICENSE                           - MIT License
└── MANIFEST.md                       - This file
```

## File Descriptions

### Core Files

#### `src/index.ts` (Main Server)
- **Purpose**: Main MCP server orchestration
- **Exports**: `CursorReaderMCP` class, all sub-modules
- **Key Methods**: `start()`, `stop()`, `handleRequest()`
- **Size**: ~400 lines

#### `src/cli.ts` (CLI Interface)
- **Purpose**: Command-line interface
- **Functions**: `startServer()`, `handleConfigCommand()`, `testServer()`
- **Usage**: `npm start` or `npx cursor-reader [command]`
- **Size**: ~180 lines

#### `src/example.ts` (Usage Examples)
- **Purpose**: Demonstrate module usage
- **Examples**: All 7 MCP tools, configuration management
- **Run**: `npx ts-node src/example.ts`
- **Size**: ~100 lines

### Safe Filesystem Module (`src/safe-fs/`)

#### `SecurityValidator.ts`
- **Purpose**: Validates file paths against security rules
- **Classes**: `SecurityValidator`
- **Key Methods**: `isFileBlocked()`, `isPathAllowed()`, `canReadFile()`
- **Features**: Pattern matching, extension checking, size validation
- **Size**: ~250 lines

#### `SafeFileSystem.ts`
- **Purpose**: Provides secure file operations
- **Classes**: `SafeFileSystem`
- **Key Methods**: `readFile()`, `listDirectory()`, `getAllFiles()`
- **Safety**: Path validation, blocking, ignore patterns
- **Size**: ~200 lines

### Configuration Module (`src/config/`)

#### `ConfigManager.ts`
- **Purpose**: Configuration management and persistence
- **Classes**: `ConfigManager`
- **Key Methods**: `loadFromFile()`, `save()`, `updateConfig()`, `validate()`
- **Features**: Project root management, feature toggles, validation
- **Size**: ~220 lines

### File Watcher Module (`src/watcher/`)

#### `FileWatcher.ts`
- **Purpose**: Monitors file system changes in real-time
- **Classes**: `FileWatcher`
- **Key Methods**: `startWatching()`, `stopWatching()`, `on()`
- **Features**: Event listeners, pattern matching, debouncing
- **Size**: ~140 lines

### Git Tracking Module (`src/git/`)

#### `GitTracker.ts`
- **Purpose**: Git repository operations
- **Classes**: `GitTracker`
- **Key Methods**: `initRepository()`, `getRecentChanges()`, `getLatestDiff()`, `getStatus()`
- **Features**: Commit history, file history, diff tracking
- **Size**: ~280 lines

### Code Search Module (`src/search/`)

#### `CodeSearch.ts`
- **Purpose**: Safe code search functionality
- **Classes**: `CodeSearch`
- **Key Methods**: `search()`, `searchFiles()`, `searchInContent()`
- **Features**: Regex support, case-sensitive search, file patterns
- **Size**: ~190 lines

### Change Store Module (`src/store/`)

#### `ChangeStore.ts`
- **Purpose**: Maintains circular buffer of file changes
- **Classes**: `ChangeStore`
- **Key Methods**: `addChange()`, `getRecent()`, `getByType()`, `search()`
- **Features**: In-memory storage, filtering, export
- **Size**: ~150 lines

### Tools Module (`src/tools/`)

#### `MCPTools.ts`
- **Purpose**: Implements MCP tool handlers
- **Classes**: `MCPTools`
- **Tools**: 7 MCP tools (list_projects, get_project_tree, etc.)
- **Features**: Input validation, error handling
- **Size**: ~320 lines

#### `CursorDiscoverer.ts`
- **Purpose**: Safely discovers Cursor workspace metadata
- **Classes**: `CursorDiscoverer`
- **Key Methods**: `discoverWorkspace()`, `extractPromptHistory()`, `listProjects()`
- **Features**: Metadata extraction, safe path handling
- **Size**: ~280 lines

### Configuration Files

#### `package.json`
- **Purpose**: NPM package metadata and dependencies
- **Key Fields**: name, version, scripts, dependencies, devDependencies
- **Dependencies**: chokidar, glob, simple-git, minimatch
- **DevDependencies**: TypeScript, Jest, ESLint

#### `tsconfig.json`
- **Purpose**: TypeScript compiler configuration
- **Settings**: Target ES2020, strict mode, declaration files

#### `jest.config.js`
- **Purpose**: Jest testing framework configuration
- **Settings**: ts-jest preset, coverage thresholds

#### `.eslintrc.json`
- **Purpose**: ESLint linting rules
- **Configuration**: TypeScript parser, recommended rules

#### `.gitignore`
- **Purpose**: Git ignore patterns
- **Patterns**: node_modules, dist, build, logs, env files

#### `.env.example`
- **Purpose**: Configuration template
- **Fields**: PROJECT_ROOTS, WATCH_ENABLED, GIT_ENABLED, etc.

### Documentation Files

#### `README.md`
- **Purpose**: Main project overview
- **Content**: Features, quick start, architecture, usage
- **Audience**: New users

#### `README_EXTENDED.md`
- **Purpose**: Extended feature documentation
- **Content**: All features, dependencies, roadmap
- **Audience**: Advanced users

#### `QUICKSTART.md`
- **Purpose**: Getting started guide
- **Content**: Installation, basic usage, common tasks, troubleshooting
- **Audience**: New developers

#### `ARCHITECTURE.md`
- **Purpose**: System design and patterns
- **Content**: Component overview, data flow, extension points
- **Audience**: Developers extending the module

#### `API.md`
- **Purpose**: Complete API reference
- **Content**: All tools, request/response formats, examples
- **Audience**: API users

#### `SECURITY.md`
- **Purpose**: Security policies and measures
- **Content**: Blocked files, safe operations, compliance
- **Audience**: Security-conscious users

#### `LICENSE`
- **Purpose**: MIT License
- **Usage**: Legal terms for use and distribution

### Test Files

#### `tests/integration.test.ts`
- **Purpose**: Integration and unit tests
- **Test Suites**: 
  - Server Lifecycle
  - MCP Requests
  - Tool Execution
  - Change Store
  - Configuration Management
  - Cursor Discovery
  - SafeFileSystem
  - ConfigManager
  - ChangeStore
  - FileWatcher
- **Test Count**: 40+
- **Size**: ~450 lines

## Module Dependencies

### Core Dependencies
- **chokidar** - File system watching
- **simple-git** - Git operations
- **glob** - File pattern matching
- **minimatch** - Pattern matching library

### Development Dependencies
- **typescript** - Language and compiler
- **jest** - Testing framework
- **ts-jest** - Jest TypeScript support
- **@types/node** - Node.js type definitions
- **eslint** - Code linting
- **@typescript-eslint/parser** - ESLint TypeScript support

## Build & Run Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Watch for changes during development
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Start the server
npm start

# Run CLI commands
npx ts-node src/cli.ts config list
npx ts-node src/cli.ts config add-root /path/to/project
```

## Exports from Main Module

### Classes
- `CursorReaderMCP` - Main server class
- `SafeFileSystem` - Safe file operations
- `SecurityValidator` - Path validation
- `ConfigManager` - Configuration management
- `FileWatcher` - File monitoring
- `GitTracker` - Git operations
- `CodeSearch` - Code searching
- `ChangeStore` - Change history
- `MCPTools` - MCP tool handlers
- `CursorDiscoverer` - Cursor workspace discovery

### Types
- `CursorReaderConfig` - Configuration type
- `FileChangeEvent` - File change event type
- `SearchResult` - Search result type
- `GitDiff` - Git diff type
- `PromptMetadata` - Prompt metadata type
- And many more...

### Constants
- `DEFAULT_SECURITY_RULES` - Default security configuration
- `DEFAULT_CONFIG` - Default module configuration

## Total Lines of Code

- **Source Code**: ~2,600 lines
- **Tests**: ~450 lines
- **Documentation**: ~1,500 lines
- **Configuration**: ~200 lines
- **Total**: ~4,750 lines

## Key Statistics

- **Files**: 35+
- **Modules**: 8
- **MCP Tools**: 7
- **Built-in Methods**: 7
- **Security Rules**: 50+
- **Test Cases**: 40+
- **Documentation Pages**: 6

## Integration Points

### External APIs
- Node.js fs module
- Chokidar file watcher
- simple-git CLI wrapper
- glob pattern matching

### MCP Protocol
- Request/response handling
- Tool registration
- Parameter validation
- Error handling

## Performance Characteristics

- **Memory**: ~50-100MB for typical usage
- **Disk**: ~50MB for build output
- **CPU**: Minimal when not actively watching
- **I/O**: Event-driven, async operations

## Security Features

- 100+ blocked file patterns
- 20+ ignored directories
- 30+ allowed file extensions
- Path normalization and validation
- Size limits (5MB default)
- Safe metadata extraction only

## Compatibility

- **Node.js**: 16+
- **npm**: 7+
- **OS**: Windows, macOS, Linux
- **TypeScript**: 5.0+

---

**Document Generated**: 2024  
**Module Version**: 1.0.0  
**Status**: Production Ready
