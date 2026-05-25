/**
 * SafeFileSystem.ts
 * Provides safe filesystem operations with security validation
 */

import fs from 'fs/promises';
import path from 'path';
import { SecurityValidator, SecurityRules } from './SecurityValidator';

export interface FileInfo {
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  created: Date;
  modified: Date;
  permissions: string;
}

export class SafeFileSystem {
  private validator: SecurityValidator;
  private allowedRoots: string[];

  constructor(allowedRoots: string[], rules?: SecurityRules) {
    this.validator = new SecurityValidator(rules);
    this.allowedRoots = allowedRoots.map(r => this.normalizePath(r));
  }

  /**
   * Safely read file contents
   */
  async readFile(filePath: string): Promise<string> {
    this.validatePath(filePath);

    try {
      const normalizedPath = this.normalizePath(filePath);
      const stats = await fs.stat(normalizedPath);

      if (!this.validator.isFileSizeAllowed(stats.size)) {
        throw new Error(`File size exceeds maximum allowed size`);
      }

      const content = await fs.readFile(normalizedPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Safely list directory contents
   */
  async listDirectory(dirPath: string): Promise<FileInfo[]> {
    this.validatePath(dirPath);

    try {
      const normalizedPath = this.normalizePath(dirPath);
      const entries = await fs.readdir(normalizedPath, { withFileTypes: true });

      const results: FileInfo[] = [];

      for (const entry of entries) {
        // Skip ignored directories and blocked files
        if (entry.isDirectory()) {
          if (this.validator.isDirectoryIgnored(entry.name)) {
            continue;
          }
        } else {
          if (this.validator.isFileBlocked(entry.name)) {
            continue;
          }
        }

        const fullPath = path.join(normalizedPath, entry.name);
        const stats = await fs.stat(fullPath);

        results.push({
          path: fullPath,
          size: stats.size,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          created: stats.birthtime,
          modified: stats.mtime,
          permissions: stats.mode.toString(8),
        });
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    this.validatePath(filePath);

    try {
      const normalizedPath = this.normalizePath(filePath);
      const stats = await fs.stat(normalizedPath);

      return {
        path: normalizedPath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode.toString(8),
      };
    } catch (error) {
      throw new Error(`Failed to get file info for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      this.validatePath(filePath);
      const normalizedPath = this.normalizePath(filePath);
      await fs.stat(normalizedPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recursively get all files in a directory (respecting ignore rules)
   */
  async getAllFiles(dirPath: string, maxDepth: number = 10): Promise<string[]> {
    this.validatePath(dirPath);
    const results: string[] = [];
    await this.walkDirectory(this.normalizePath(dirPath), results, 0, maxDepth);
    return results;
  }

  /**
   * Private: Walk directory recursively
   */
  private async walkDirectory(dirPath: string, results: string[], depth: number, maxDepth: number): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          if (!this.validator.isDirectoryIgnored(entry.name)) {
            await this.walkDirectory(fullPath, results, depth + 1, maxDepth);
          }
        } else {
          if (!this.validator.isFileBlocked(entry.name) && this.validator.isExtensionAllowed(entry.name)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
  }

  /**
   * Validate path before operations
   */
  private validatePath(filePath: string): void {
    if (!this.validator.isPathAllowed(filePath, this.allowedRoots)) {
      throw new Error(`Path not in allowed roots: ${filePath}`);
    }
    if (this.validator.isFileBlocked(filePath)) {
      throw new Error(`Access to this file is blocked: ${filePath}`);
    }
    if (this.validator.isDirectoryIgnored(filePath)) {
      throw new Error(`Directory is ignored: ${filePath}`);
    }
  }

  /**
   * Normalize path for consistency
   */
  private normalizePath(filePath: string): string {
    return path.normalize(filePath).replace(/\\/g, '/');
  }

  /**
   * Update allowed roots
   */
  setAllowedRoots(roots: string[]): void {
    this.allowedRoots = roots.map(r => this.normalizePath(r));
  }

  /**
   * Get allowed roots
   */
  getAllowedRoots(): string[] {
    return [...this.allowedRoots];
  }
}
