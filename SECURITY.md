# Security & Privacy Policy

## Overview

CursorReader is designed with security as a first-class concern. This document outlines the security measures implemented in the module.

## Core Security Principles

1. **No Credentials Extraction**: We never extract credentials, tokens, or sensitive data
2. **Path Validation**: All file paths are validated against allowed roots
3. **Safe Defaults**: Restrictive security rules are applied by default
4. **User Control**: All security settings are user-configurable
5. **Local-Only**: All operations remain local to the user's machine

## File Access Controls

### Blocked File Patterns

The following files are automatically blocked from access:

**Environment & Configuration**:
- `.env`
- `.env.local`
- `.env.*.local`
- `.secret`
- `.pass`
- `.credentials`

**Cloud Credentials**:
- `.aws/`
- `.gcp/`
- `.azure/`

**Cryptographic Keys**:
- `*.pem` (private keys)
- `*.key` (SSH/crypto keys)
- `*.p8` (PKCS8 keys)
- `*.p12` (PKCS12 certificates)
- `*.pfx` (Personal Exchange Format)
- `*.jks` (Java KeyStore)
- `*.keystore` (Generic keystores)

**Other Secrets**:
- `*token*`
- `*password*`
- `*secret*`
- `*credential*`
- `*ssh_key*`
- `*private_key*`

### Ignored Directories

The following directories are never traversed:

```
node_modules/     - Third-party dependencies
.git/             - Git internals
.hg/              - Mercurial internals
.svn/             - Subversion internals
dist/             - Build outputs
build/            - Build outputs
out/              - Build outputs
.venv/            - Python virtual envs
venv/             - Python virtual envs
env/              - Environment directories
__pycache__/      - Python cache
.pytest_cache/    - Test cache
.next/            - Next.js build
.nuxt/            - Nuxt build
.cache/           - Generic cache
.turbo/           - Turbo cache
.swc/             - SWC compiler cache
```

## Allowed Roots

- **Definition**: All file access must be within configured project roots
- **Setup**: Project roots must be explicitly added during initialization
- **Validation**: Every file operation validates the path is within allowed roots
- **Error**: Paths outside allowed roots throw an error

## File Size Limits

- **Default Limit**: 5 MB per file
- **Rationale**: Prevents accidental processing of large binary files
- **Configurable**: Can be adjusted via `SecurityRules.maxFileSize`

## File Type Restrictions

### Allowed Extensions

```
.ts, .tsx        - TypeScript
.js, .jsx        - JavaScript
.json            - JSON
.md              - Markdown
.txt             - Text
.yml, .yaml      - YAML
.toml            - TOML
.xml             - XML
.html            - HTML
.css, .scss, .less - Styles
.py              - Python
.rb              - Ruby
.go              - Go
.rs              - Rust
.java            - Java
.cs              - C#
.cpp, .c, .h     - C/C++
.sh, .bash       - Shell scripts
```

### Blocked Extensions

- Binary files (`.exe`, `.dll`, `.so`, `.dylib`)
- Compiled files (`.pyc`, `.o`, `.obj`)
- Archives (`.zip`, `.tar`, `.rar`) unless explicitly needed
- Images (`.png`, `.jpg`, `.gif`)
- Database files (`.db`, `.sqlite`)

## Cursor Workspace Safety

### Cursor-Specific Safe Paths

CursorReader safely investigates:

- `.cursor/` - Cursor settings and configuration
- `workspaceStorage/` - Workspace metadata
- `state.vscdb` - Database of workspace state (metadata only)

### What We Extract

From Cursor workspace, we extract:

✓ Prompt summaries (first 200 characters)
✓ Timestamps
✓ Related files (paths only)
✓ Workspace metadata

### What We DON'T Extract

✗ Complete chat messages
✗ Cursor API keys or tokens
✗ Extension credentials
✗ User personal information
✗ Code content from private projects
✗ Binary data

## Code Search Security

### Search Scope
- Limited to allowed file extensions
- Respects blocked file patterns
- Cannot search ignored directories
- Results limited by `maxResults` parameter (default: 50)

### Search Patterns
- No arbitrary regex execution
- Regex patterns are validated before execution
- Errors in regex patterns are caught and reported

## Git Operations Security

### Safe Operations
- Read-only git operations
- No force push or destructive operations
- Limited to allowed repositories
- No credential extraction

### What We Access
- Commit hashes and messages
- Author names (not emails without consent)
- File change status
- Branch information

### What We DON'T Access
- Stashed changes
- Reflog entries
- Pack files
- Git hooks

## Network Security

**Status**: CursorReader is designed as **LOCAL-ONLY** software

- No network calls for core functionality
- No data transmission to external services
- No telemetry
- No analytics
- No phoning home

## Process Isolation

- **No Shell Execution**: No `shell` or `exec` calls with user input
- **Sandboxing**: File operations are sandboxed within allowed roots
- **Capability Limits**: Only read operations (no write, delete, chmod)

## Configuration Security

### Secure Defaults
```json
{
  "projectRoots": [],
  "watchEnabled": true,
  "maxChangeHistory": 1000,
  "searchMaxResults": 50,
  "gitEnabled": true,
  "ignorePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**"
  ]
}
```

### Custom Rules

Users can override security rules:

```typescript
const customRules = {
  ...DEFAULT_SECURITY_RULES,
  blockedFiles: [...DEFAULT_SECURITY_RULES.blockedFiles, 'custom.blocked'],
  allowedExtensions: [...DEFAULT_SECURITY_RULES.allowedExtensions, '.custom'],
};
const safeFs = new SafeFileSystem(allowedRoots, customRules);
```

## Audit Trail

### Logged Operations
- File access attempts (path + reason if blocked)
- Search queries (for debugging)
- Git operations
- Configuration changes

### Not Logged
- File contents
- Search results
- Code snippets
- Personal information

## Vulnerability Reporting

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. **DO** email security details to the maintainers
3. Provide detailed reproduction steps
4. Allow time for a fix before disclosure

## Compliance

CursorReader follows these security standards:

- OWASP Top 10 (where applicable)
- NIST Cybersecurity Framework
- GDPR privacy principles
- CCPA data protection

## Regular Security Updates

- Dependencies are regularly updated
- Security advisories are monitored
- Patches are released promptly
- Users should keep their version updated

## Testing

All security features are tested via:

- Unit tests for validators
- Integration tests for workflows
- Fuzzing for edge cases
- Manual security audits

## Support & Reporting

- GitHub Issues: For bugs (not security)
- Security Email: For vulnerabilities
- Documentation: For usage questions

## Version History

- **1.0.0**: Initial release with full security implementation
