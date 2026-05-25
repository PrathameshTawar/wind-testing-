/**
 * SecurityRules.ts
 * Defines security rules for file access
 */

export interface SecurityRules {
  blockedFiles: string[];
  blockedPatterns: string[];
  ignoredDirs: string[];
  allowedRoots: string[];
  maxFileSize: number; // bytes
  allowedExtensions: string[];
}

export const DEFAULT_SECURITY_RULES: SecurityRules = {
  blockedFiles: [
    '.env',
    '.env.local',
    '.env.*.local',
    '.secret',
    '.pass',
    '.credentials',
    '.aws',
    '.gcp',
    '.azure',
  ],
  blockedPatterns: [
    '**/*.pem',
    '**/*.key',
    '**/*.p8',
    '**/*.p12',
    '**/*.pfx',
    '**/*.jks',
    '**/*.keystore',
    '**/private_key*',
    '**/ssh_key*',
    '**/*token*',
    '**/*password*',
    '**/*secret*',
    '**/*credential*',
  ],
  ignoredDirs: [
    'node_modules',
    '.git',
    '.hg',
    '.svn',
    'dist',
    'build',
    'out',
    '.venv',
    'venv',
    'env',
    '.env',
    '__pycache__',
    '.pytest_cache',
    '.next',
    '.nuxt',
    '.cache',
    '.turbo',
    '.swc',
  ],
  allowedRoots: [],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.md',
    '.txt',
    '.yml',
    '.yaml',
    '.toml',
    '.xml',
    '.html',
    '.css',
    '.scss',
    '.less',
    '.py',
    '.rb',
    '.go',
    '.rs',
    '.java',
    '.cs',
    '.cpp',
    '.c',
    '.h',
    '.sh',
    '.bash',
  ],
};

export class SecurityValidator {
  private rules: SecurityRules;

  constructor(rules: SecurityRules = DEFAULT_SECURITY_RULES) {
    this.rules = rules;
  }

  /**
   * Check if a file is blocked
   */
  isFileBlocked(fileName: string): boolean {
    const baseName = fileName.split(/[\\/]/).pop() || '';

    // Check exact blocked files
    if (this.rules.blockedFiles.includes(baseName.toLowerCase())) {
      return true;
    }

    // Check blocked patterns
    for (const pattern of this.rules.blockedPatterns) {
      if (this.matchesPattern(fileName, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a directory should be ignored
   */
  isDirectoryIgnored(dirPath: string): boolean {
    const parts = dirPath.split(/[\\/]/);
    for (const part of parts) {
      if (this.rules.ignoredDirs.includes(part)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a path is within allowed roots
   */
  isPathAllowed(filePath: string, allowedRoots: string[]): boolean {
    const normalizedPath = this.normalizePath(filePath);
    for (const root of allowedRoots) {
      const normalizedRoot = this.normalizePath(root);
      if (normalizedPath.startsWith(normalizedRoot)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate if a file can be read
   */
  canReadFile(filePath: string, allowedRoots: string[]): boolean {
    if (!this.isPathAllowed(filePath, allowedRoots)) {
      return false;
    }
    if (this.isFileBlocked(filePath)) {
      return false;
    }
    if (this.isDirectoryIgnored(filePath)) {
      return false;
    }
    return true;
  }

  /**
   * Get file extension
   */
  getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.slice(lastDot) : '';
  }

  /**
   * Check if file extension is allowed
   */
  isExtensionAllowed(fileName: string): boolean {
    const ext = this.getFileExtension(fileName);
    return ext === '' || this.rules.allowedExtensions.includes(ext.toLowerCase());
  }

  /**
   * Check file size
   */
  isFileSizeAllowed(sizeInBytes: number): boolean {
    return sizeInBytes <= this.rules.maxFileSize;
  }

  /**
   * Normalize file path for comparison
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').toLowerCase();
  }

  /**
   * Simple pattern matching (minimatch-like)
   */
  private matchesPattern(path: string, pattern: string): boolean {
    const normalizedPath = this.normalizePath(path);
    const normalizedPattern = this.normalizePath(pattern);

    // Handle ** for recursive matching
    if (normalizedPattern.includes('**')) {
      const parts = normalizedPattern.split('**/');
      let currentPos = 0;

      for (const part of parts) {
        if (part === '') continue;
        const partPattern = part.replace(/\*/g, '.*');
        const regex = new RegExp(`^${partPattern}$`);
        const remaining = normalizedPath.slice(currentPos);

        const match = remaining.match(regex);
        if (!match) return false;
        currentPos += match[0].length;
      }
      return true;
    }

    // Handle single * wildcard
    const regexPattern = normalizedPattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(normalizedPath);
  }

  /**
   * Update rules
   */
  updateRules(partialRules: Partial<SecurityRules>): void {
    this.rules = { ...this.rules, ...partialRules };
  }

  /**
   * Get current rules
   */
  getRules(): SecurityRules {
    return { ...this.rules };
  }
}
