/**
 * CodeSearch.ts
 * Provides safe code search functionality
 */

import { glob } from 'glob';
import { SafeFileSystem } from '../safe-fs';


export interface SearchResult {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
  maxResults?: number;
  filePattern?: string;
}

export class CodeSearch {
  private safeFs: SafeFileSystem;

  constructor(safeFs: SafeFileSystem) {
    this.safeFs = safeFs;
  }

  /**
   * Search for text in code
   */
  async search(
    searchTerm: string,
    baseDir: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const {
      caseSensitive = false,
      wholeWord = false,
      useRegex = false,
      maxResults = 100,
      filePattern = '**/*.{ts,tsx,js,jsx,json,md,py,rb,go,rs,java,cs,cpp,c,h,sh,bash,yaml,yml,toml,xml,html,css,scss,less}',
    } = options;

    const results: SearchResult[] = [];

    try {
      // Get all files matching the pattern
      const files = await glob(filePattern, {
        cwd: baseDir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      });

      for (const filePath of files) {
        if (results.length >= maxResults) break;

        try {
          // Verify file is allowed to be read
          if (!this.safeFs.getAllowedRoots().some(root => filePath.startsWith(root))) {
            continue;
          }

          const content = await this.safeFs.readFile(filePath);
          const fileResults = this.searchInContent(
            content,
            searchTerm,
            filePath,
            {
              caseSensitive,
              wholeWord,
              useRegex,
            },
          );

          results.push(...fileResults.slice(0, maxResults - results.length));
        } catch {
          // Skip files that can't be read
          continue;
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search in file content
   */
  private searchInContent(
    content: string,
    searchTerm: string,
    filePath: string,
    options: { caseSensitive: boolean; wholeWord: boolean; useRegex: boolean },
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const lines = content.split('\n');

    let regex: RegExp;

    if (options.useRegex) {
      try {
        regex = new RegExp(
          searchTerm,
          options.caseSensitive ? 'g' : 'gi',
        );
      } catch {
        throw new Error('Invalid regex pattern');
      }
    } else {
      let escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (options.wholeWord) {
        escapedTerm = `\\b${escapedTerm}\\b`;
      }
      regex = new RegExp(
        escapedTerm,
        options.caseSensitive ? 'g' : 'gi',
      );
    }

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      let match;

      while ((match = regex.exec(line)) !== null) {
        results.push({
          filePath,
          lineNumber: lineNum + 1,
          lineContent: line,
          matchStart: match.index,
          matchEnd: match.index + match[0].length,
        });
      }
    }

    return results;
  }

  /**
   * Search for files by name
   */
  async searchFiles(
    filePattern: string,
    baseDir: string,
    maxResults: number = 100,
  ): Promise<string[]> {
    try {
      const files = await glob(filePattern, {
        cwd: baseDir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**'],
      });

      return files.slice(0, maxResults);
    } catch (error) {
      throw new Error(`File search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
