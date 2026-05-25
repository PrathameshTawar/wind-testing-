/**
 * CursorDiscoverer.ts
 * Safely discovers and extracts metadata from Cursor workspace
 */

import path from 'path';

import { SafeFileSystem } from '../safe-fs';

export interface PromptMetadata {
  id: string;
  summary: string;
  timestamp: Date;
  relatedFiles: string[];
  tags?: string[];
}

export interface CursorWorkspaceMetadata {
  discoveredAt: Date;
  cursorVersion?: string;
  projects: string[];
  recentPrompts: PromptMetadata[];
  workspaceSettings?: Record<string, unknown>;
}

export class CursorDiscoverer {
  private safeFs: SafeFileSystem;

  constructor(safeFs: SafeFileSystem) {
    this.safeFs = safeFs;
  }

  /**
   * Discover Cursor workspace metadata
   */
  async discoverWorkspace(cursorWorkspacePath: string): Promise<CursorWorkspaceMetadata> {
    const metadata: CursorWorkspaceMetadata = {
      discoveredAt: new Date(),
      projects: [],
      recentPrompts: [],
    };

    try {
      // Try to read cursor version
      metadata.cursorVersion = await this.readCursorVersion(cursorWorkspacePath);

      // Try to read workspace settings
      metadata.workspaceSettings = await this.readWorkspaceSettings(cursorWorkspacePath);

      // Try to discover projects
      metadata.projects = await this.discoverProjects(cursorWorkspacePath);

      // Try to extract prompt history
      metadata.recentPrompts = await this.extractPromptHistory(cursorWorkspacePath);
    } catch (error) {
      console.error('Error discovering cursor workspace:', error);
    }

    return metadata;
  }

  /**
   * Read Cursor version
   */
  private async readCursorVersion(cursorWorkspacePath: string): Promise<string | undefined> {
    try {
      const versionPath = path.join(cursorWorkspacePath, 'version');
      if (await this.safeFs.fileExists(versionPath)) {
        const version = await this.safeFs.readFile(versionPath);
        return version.trim();
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Read workspace settings
   */
  private async readWorkspaceSettings(cursorWorkspacePath: string): Promise<Record<string, unknown> | undefined> {
    try {
      const settingsPath = path.join(cursorWorkspacePath, 'settings.json');
      if (await this.safeFs.fileExists(settingsPath)) {
        const content = await this.safeFs.readFile(settingsPath);
        return JSON.parse(content);
      }
    } catch (error) {
      // Ignore errors - settings might not exist or be invalid JSON
    }
    return undefined;
  }

  /**
   * Discover projects from workspace
   */
  private async discoverProjects(cursorWorkspacePath: string): Promise<string[]> {
    const projects: string[] = [];

    try {
      // Look for workspaceStorage directory
      const workspaceStoragePath = path.join(cursorWorkspacePath, 'workspaceStorage');
      if (await this.safeFs.fileExists(workspaceStoragePath)) {
        const entries = await this.safeFs.listDirectory(workspaceStoragePath);
        for (const entry of entries) {
          if (entry.isDirectory) {
            // Each subdirectory might represent a workspace
            projects.push(entry.path);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return projects;
  }

  /**
   * Extract prompt history from Cursor workspace
   */
  private async extractPromptHistory(cursorWorkspacePath: string): Promise<PromptMetadata[]> {
    const prompts: PromptMetadata[] = [];

    try {
      // Look for chat history or state files

      // Try to find chat artifacts

      const chatArtifactsPath = path.join(cursorWorkspacePath, 'Chat');
      if (await this.safeFs.fileExists(chatArtifactsPath)) {
        const entries = await this.safeFs.listDirectory(chatArtifactsPath);
        for (const entry of entries) {
          if (entry.isFile && (entry.path.endsWith('.json') || entry.path.endsWith('.txt'))) {
            try {
              const metadata = await this.extractPromptFromFile(entry.path);
              if (metadata) {
                prompts.push(metadata);
              }
            } catch {
              // Skip files that can't be parsed
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return prompts.slice(0, 10); // Return top 10 recent prompts
  }

  /**
   * Extract prompt metadata from a single file
   */
  private async extractPromptFromFile(filePath: string): Promise<PromptMetadata | null> {
    try {
      const content = await this.safeFs.readFile(filePath);

      // Try to parse as JSON first
      let data: Record<string, unknown> | string[] = [];
      try {
        data = JSON.parse(content);
      } catch {
        // If not JSON, treat as plain text
        data = [content];
      }

      // Extract metadata
      const id = path.basename(filePath);
      const summary = this.extractSummary(data);
      const timestamp = new Date();
      const relatedFiles = this.extractRelatedFiles(data);

      return {
        id,
        summary,
        timestamp,
        relatedFiles,
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract summary from data
   */
  private extractSummary(data: unknown): string {
    if (typeof data === 'string') {
      return data.slice(0, 200);
    }

    if (Array.isArray(data)) {
      const firstItem = data[0];
      if (typeof firstItem === 'string') {
        return firstItem.slice(0, 200);
      }
      if (typeof firstItem === 'object' && firstItem !== null) {
        const message = (firstItem as Record<string, unknown>).message;
        if (typeof message === 'string') {
          return message.slice(0, 200);
        }
      }
    }

    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      const message = obj.message || obj.content || obj.text;
      if (typeof message === 'string') {
        return message.slice(0, 200);
      }
    }

    return 'Unknown prompt';
  }

  /**
   * Extract related files from data
   */
  private extractRelatedFiles(data: unknown): string[] {
    const files: string[] = [];

    const extract = (obj: unknown): void => {
      if (typeof obj === 'string') {
        // Simple heuristic: looks like a file path
        if (obj.includes('/') || obj.includes('\\') || obj.includes('.')) {
          files.push(obj);
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          extract(item);
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          extract(value);
        }
      }
    };

    extract(data);
    return Array.from(new Set(files)).slice(0, 5); // Deduplicate and limit to 5
  }

  /**
   * List all projects in workspace
   */
  async listProjects(cursorWorkspacePath: string): Promise<string[]> {
    const projects: string[] = [];

    try {
      const workspaceStoragePath = path.join(cursorWorkspacePath, 'workspaceStorage');
      const entries = await this.safeFs.listDirectory(workspaceStoragePath);

      for (const entry of entries) {
        if (entry.isDirectory) {
          const name = path.basename(entry.path);
          projects.push(name);
        }
      }
    } catch {
      // Return empty if can't read
    }

    return projects;
  }
}
