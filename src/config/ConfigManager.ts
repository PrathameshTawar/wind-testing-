/**
 * ConfigManager.ts
 * Manages configuration for the cursor-reader module
 */

import fs from 'fs/promises';
import path from 'path';

export interface CursorReaderConfig {
  projectRoots: string[];
  watchEnabled: boolean;
  maxChangeHistory: number;
  searchMaxResults: number;
  gitEnabled: boolean;
  ignorePatterns: string[];
  cursorWorkspacePath?: string;
}

export const DEFAULT_CONFIG: CursorReaderConfig = {
  projectRoots: [],
  watchEnabled: true,
  maxChangeHistory: 1000,
  searchMaxResults: 50,
  gitEnabled: true,
  ignorePatterns: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '.next/**',
    '.venv/**',
  ],
};

export class ConfigManager {
  private config: CursorReaderConfig;


  constructor(config: Partial<CursorReaderConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Load configuration from file
   */
  static async loadFromFile(configPath: string): Promise<ConfigManager> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content) as Partial<CursorReaderConfig>;
      const manager = new ConfigManager(config);
      return manager;
    } catch (error) {
      throw new Error(`Failed to load config from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save configuration to file
   */
  async save(configPath: string): Promise<void> {
    try {
      const dir = path.dirname(configPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save config to ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CursorReaderConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(partial: Partial<CursorReaderConfig>): void {
    this.config = {
      ...this.config,
      ...partial,
    };
  }

  /**
   * Add project root
   */
  addProjectRoot(rootPath: string): void {
    if (!this.config.projectRoots.includes(rootPath)) {
      this.config.projectRoots.push(rootPath);
    }
  }

  /**
   * Remove project root
   */
  removeProjectRoot(rootPath: string): void {
    this.config.projectRoots = this.config.projectRoots.filter(r => r !== rootPath);
  }

  /**
   * Get project roots
   */
  getProjectRoots(): string[] {
    return [...this.config.projectRoots];
  }

  /**
   * Set watch enabled
   */
  setWatchEnabled(enabled: boolean): void {
    this.config.watchEnabled = enabled;
  }

  /**
   * Is watch enabled
   */
  isWatchEnabled(): boolean {
    return this.config.watchEnabled;
  }

  /**
   * Set git enabled
   */
  setGitEnabled(enabled: boolean): void {
    this.config.gitEnabled = enabled;
  }

  /**
   * Is git enabled
   */
  isGitEnabled(): boolean {
    return this.config.gitEnabled;
  }

  /**
   * Get ignore patterns
   */
  getIgnorePatterns(): string[] {
    return [...this.config.ignorePatterns];
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(this.config.projectRoots)) {
      errors.push('projectRoots must be an array');
    }

    if (this.config.projectRoots.length === 0) {
      errors.push('At least one project root must be configured');
    }

    if (typeof this.config.watchEnabled !== 'boolean') {
      errors.push('watchEnabled must be a boolean');
    }

    if (this.config.maxChangeHistory < 0) {
      errors.push('maxChangeHistory must be non-negative');
    }

    if (this.config.searchMaxResults < 1) {
      errors.push('searchMaxResults must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get cursor workspace path (with fallback)
   */
  getCursorWorkspacePath(): string {
    if (this.config.cursorWorkspacePath) {
      return this.config.cursorWorkspacePath;
    }

    // Default fallbacks for common OS paths
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const platform = process.platform;

    if (platform === 'win32') {
      return path.join(homeDir, 'AppData', 'Roaming', 'Cursor');
    } else if (platform === 'darwin') {
      return path.join(homeDir, 'Library', 'Application Support', 'Cursor');
    } else {
      return path.join(homeDir, '.config', 'Cursor');
    }
  }
}
