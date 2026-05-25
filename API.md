# CursorReader MCP - API Reference

## MCP Request/Response Format

### Request
```json
{
  "method": "tool_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

### Response
```json
{
  "result": {
    // Tool result
  }
}
```

Or in case of error:
```json
{
  "error": "Error message"
}
```

## Tools Reference

### list_projects

Lists all tracked projects in the workspace.

**Request**:
```json
{
  "method": "list_projects"
}
```

**Response**:
```json
{
  "result": {
    "projects": [
      "/home/user/my-project",
      "/home/user/another-project"
    ]
  }
}
```

### get_project_tree

Gets the directory structure for a project.

**Request**:
```json
{
  "method": "get_project_tree",
  "params": {
    "projectPath": "/home/user/my-project",
    "maxDepth": 3
  }
}
```

**Response**:
```json
{
  "result": {
    "tree": {
      "src": {
        "main.ts": { "type": "file", "size": 1024 },
        "utils": {
          "helpers.ts": { "type": "file", "size": 2048 }
        }
      }
    }
  }
}
```

### read_file

Safely reads file contents.

**Request**:
```json
{
  "method": "read_file",
  "params": {
    "filePath": "/home/user/my-project/src/main.ts"
  }
}
```

**Response**:
```json
{
  "result": {
    "filePath": "/home/user/my-project/src/main.ts",
    "content": "export function main() { ... }"
  }
}
```

### search_code

Searches for text or patterns in code.

**Request**:
```json
{
  "method": "search_code",
  "params": {
    "query": "TODO",
    "baseDir": "/home/user/my-project",
    "caseSensitive": false,
    "maxResults": 50
  }
}
```

**Response**:
```json
{
  "result": {
    "results": [
      {
        "filePath": "/home/user/my-project/src/main.ts",
        "lineNumber": 42,
        "lineContent": "// TODO: Implement this feature",
        "matchStart": 3,
        "matchEnd": 7
      }
    ],
    "count": 1
  }
}
```

### get_recent_changes

Returns recent file change events.

**Request**:
```json
{
  "method": "get_recent_changes",
  "params": {
    "count": 50,
    "type": "change"
  }
}
```

**Response**:
```json
{
  "result": {
    "changes": [
      {
        "id": "1234567890-0",
        "type": "change",
        "filePath": "/home/user/my-project/src/main.ts",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### get_latest_git_diff

Gets the latest git diff for a project.

**Request**:
```json
{
  "method": "get_latest_git_diff",
  "params": {
    "projectPath": "/home/user/my-project"
  }
}
```

**Response**:
```json
{
  "result": {
    "diff": {
      "hash": "abc123def456",
      "author": "John Doe",
      "date": "2024-01-15T10:30:00.000Z",
      "message": "Fix bug in main function",
      "changes": [
        {
          "file": "src/main.ts",
          "status": "M"
        }
      ]
    }
  }
}
```

### get_prompt_history

Extracts prompt summaries and metadata from Cursor workspace.

**Request**:
```json
{
  "method": "get_prompt_history",
  "params": {
    "cursorWorkspacePath": "/home/user/.config/Cursor"
  }
}
```

**Response**:
```json
{
  "result": {
    "metadata": {
      "discoveredAt": "2024-01-15T10:30:00.000Z",
      "cursorVersion": "0.x.x",
      "projects": ["workspace-1", "workspace-2"],
      "recentPrompts": [
        {
          "id": "prompt-1",
          "summary": "Write a function to calculate factorial",
          "timestamp": "2024-01-15T10:30:00.000Z",
          "relatedFiles": ["src/math.ts"],
          "tags": ["math", "algorithm"]
        }
      ],
      "workspaceSettings": {}
    }
  }
}
```

## Built-in Methods

### list_tools

Get all available tools.

**Request**:
```json
{
  "method": "list_tools"
}
```

### get_config

Get current configuration.

**Request**:
```json
{
  "method": "get_config"
}
```

### update_config

Update configuration.

**Request**:
```json
{
  "method": "update_config",
  "params": {
    "watchEnabled": false,
    "maxChangeHistory": 2000
  }
}
```

### add_project_root

Add a new project root.

**Request**:
```json
{
  "method": "add_project_root",
  "params": {
    "path": "/home/user/new-project"
  }
}
```

### remove_project_root

Remove a project root.

**Request**:
```json
{
  "method": "remove_project_root",
  "params": {
    "path": "/home/user/old-project"
  }
}
```

### get_status

Get server status.

**Request**:
```json
{
  "method": "get_status"
}
```

**Response**:
```json
{
  "result": {
    "isWatching": true,
    "projectRoots": ["/home/user/my-project"],
    "changeHistorySize": 42,
    "watcherStatus": {
      "isWatching": true,
      "watchedPaths": ["/home/user/my-project"],
      "ignorePatterns": ["**/node_modules/**", "**/.git/**"]
    }
  }
}
```

### clear_changes

Clear all change history.

**Request**:
```json
{
  "method": "clear_changes"
}
```

## Error Responses

All errors follow the format:

```json
{
  "error": "Descriptive error message"
}
```

Common errors:
- `"Path not in allowed roots: ..."`
- `"Access to this file is blocked: ..."`
- `"Directory is ignored: ..."`
- `"File size exceeds maximum allowed size"`
- `"Unknown method: ..."`
