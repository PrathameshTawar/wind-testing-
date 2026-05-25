# Quick Start Guide

## Installation

### Prerequisites

- Node.js 16 or later
- npm 7 or later
- TypeScript 5.0 or later (optional, for development)

### Setup

```bash
# Clone or navigate to the cursor-reader directory
cd cursor-reader

# Install dependencies
npm install

# Build the project
npm run build
```

## Basic Usage

### 1. Initialize the Server

```typescript
import CursorReaderMCP from '@akhrot/cursor-reader';

// Create server instance with project roots
const server = new CursorReaderMCP([
  '/home/user/my-project',
  '/home/user/another-project'
]);

// Start the server
await server.start();
```

### 2. Make Requests

```typescript
// List all projects
const projectsResp = await server.handleRequest({
  method: 'list_projects'
});

// Search code
const searchResp = await server.handleRequest({
  method: 'search_code',
  params: {
    query: 'function main',
    baseDir: '/home/user/my-project',
    maxResults: 20
  }
});

// Get recent changes
const changesResp = await server.handleRequest({
  method: 'get_recent_changes',
  params: { count: 10 }
});
```

### 3. Stop the Server

```typescript
await server.stop();
```

## CLI Usage

### Start the Server

```bash
npm start
```

Or directly:

```bash
npx ts-node src/cli.ts start
```

### Configure Project Roots

```bash
# Add a project root
npx ts-node src/cli.ts config add-root /home/user/my-project

# List configured roots
npx ts-node src/cli.ts config list
```

### Run Tests

```bash
npm run test
```

## Configuration

### Create a Configuration File

Create `~/.cursor-reader/config.json`:

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
    "dist/**",
    "build/**"
  ]
}
```

### Load Configuration

```typescript
const config = await ConfigManager.loadFromFile(
  '/home/user/.cursor-reader/config.json'
);

const server = new CursorReaderMCP(
  config.getProjectRoots()
);
```

## Common Tasks

### Search for TODOs

```typescript
const todos = await server.handleRequest({
  method: 'search_code',
  params: {
    query: 'TODO',
    baseDir: '/home/user/my-project',
    maxResults: 100
  }
});

for (const result of todos.result.results) {
  console.log(`${result.filePath}:${result.lineNumber}`);
  console.log(`  ${result.lineContent}`);
}
```

### Get Recent Git Changes

```typescript
const diff = await server.handleRequest({
  method: 'get_latest_git_diff',
  params: {
    projectPath: '/home/user/my-project'
  }
});

console.log(`Latest commit: ${diff.result.diff.message}`);
for (const change of diff.result.diff.changes) {
  console.log(`  ${change.status} ${change.file}`);
}
```

### Monitor File Changes

```typescript
// Start watching
await server.start();

// Get recent changes periodically
setInterval(async () => {
  const changes = await server.handleRequest({
    method: 'get_recent_changes',
    params: { count: 5 }
  });
  
  console.log('Recent changes:', changes.result.changes);
}, 5000);
```

### Extract Cursor Prompts

```typescript
const history = await server.handleRequest({
  method: 'get_prompt_history'
});

for (const prompt of history.result.metadata.recentPrompts) {
  console.log(`[${prompt.timestamp}] ${prompt.summary}`);
  console.log(`  Files: ${prompt.relatedFiles.join(', ')}`);
}
```

## Troubleshooting

### Server Won't Start

1. Check that project roots are valid:
```bash
npx ts-node src/cli.ts config list
```

2. Verify permissions on project directories:
```bash
ls -la /home/user/my-project
```

3. Check for port conflicts if running multiple instances.

### Search Returns No Results

1. Check file extensions are in the allowed list (see `SECURITY.md`)
2. Verify the base directory exists and is accessible
3. Check ignore patterns aren't blocking your files
4. Try with `maxResults: 100` to increase the limit

### File Access Denied

1. Check if the file is in the blocked list
2. Verify the file path is within an allowed root
3. Check file permissions
4. See `SECURITY.md` for the complete blocked files list

### Git Operations Fail

1. Verify the directory is a git repository:
```bash
git -C /path/to/repo status
```

2. Check git is installed and accessible
3. Ensure the repository has commits

## Performance Tips

1. **Limit Change History**: Reduce `maxChangeHistory` for large projects
2. **Use Specific Patterns**: Be specific with search queries to reduce results
3. **Add to Ignore**: Add large directories to `ignorePatterns`
4. **Watch Selectively**: Disable watch for large projects if not needed

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for design details
- Read [API.md](API.md) for detailed API reference
- Read [SECURITY.md](SECURITY.md) for security policies
- Review [src/example.ts](src/example.ts) for more examples

## Support

For issues and questions:

1. Check the documentation files
2. Look at the example code
3. Review security considerations
4. Check logs for error messages

## License

MIT - See LICENSE file for details
