/**
 * GitTracker.ts
 * Tracks git changes and repository information
 */

import simpleGit, { SimpleGit } from 'simple-git';


export interface GitChange {
  file: string;
  status: string; // 'M' (modified), 'A' (added), 'D' (deleted), etc.
}

export interface GitDiff {
  hash: string;
  author: string;
  date: Date;
  message: string;
  changes: GitChange[];
}

export interface RepositoryInfo {
  path: string;
  isRepository: boolean;
  branch?: string;
  remoteUrl?: string;
  lastCommitHash?: string;
}

export class GitTracker {
  private gitInstances: Map<string, SimpleGit> = new Map();

  /**
   * Initialize git tracking for a repository
   */
  async initRepository(repoPath: string): Promise<RepositoryInfo> {
    try {
      const git = simpleGit(repoPath);
      this.gitInstances.set(repoPath, git);

      const isRepository = await git.checkIsRepo();
      if (!isRepository) {
        return {
          path: repoPath,
          isRepository: false,
        };
      }

      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      const remotes = await git.getRemotes(true);
      const remoteUrl = remotes[0]?.refs.fetch || undefined;
      const logData = await git.log(['-1']);
      const lastCommitHash = logData.latest?.hash;

      return {
        path: repoPath,
        isRepository: true,
        branch: branch.trim(),
        remoteUrl,
        lastCommitHash,
      };
    } catch (error) {
      return {
        path: repoPath,
        isRepository: false,
      };
    }
  }

  /**
   * Get recent changes for a repository
   */
  async getRecentChanges(
    repoPath: string,
    maxCount: number = 10,
  ): Promise<GitDiff[]> {
    try {
      const git = this.gitInstances.get(repoPath) || simpleGit(repoPath);

      const logData = await git.log([`-${maxCount}`, '--name-status']);

      const changes: GitDiff[] = [];

      for (const commit of logData.all) {
const files = commit.diff?.files || [];
const fileChanges: GitChange[] = files.map(f => ({
          file: (f as any).file || '',
          status: ('status' in (f as any) ? (f as any).status : '?') as string,
        }));

        changes.push({
          hash: commit.hash,
          author: commit.author_name || 'Unknown',
          date: new Date(commit.date),
          message: commit.message,
          changes: fileChanges,
        });
      }

      return changes;
    } catch (error) {
      throw new Error(`Failed to get recent changes for ${repoPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get git diff for latest commit
   */
  async getLatestDiff(repoPath: string): Promise<GitDiff | null> {
    try {
      const git = this.gitInstances.get(repoPath) || simpleGit(repoPath);

      const logData = await git.log(['-1', '--name-status']);

      if (!logData.latest) {
        return null;
      }

      const commit = logData.latest;
      const files = commit.diff?.files || [];
const fileChanges: GitChange[] = files.map(f => ({
        file: (f as any).file || '',
        status: ('status' in (f as any) ? (f as any).status : '?') as string,
      }));

      return {
        hash: commit.hash,
        author: commit.author_name || 'Unknown',
        date: new Date(commit.date),
        message: commit.message,
        changes: fileChanges,
      };
    } catch (error) {
      throw new Error(`Failed to get latest diff for ${repoPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get git status (uncommitted changes)
   */
  async getStatus(repoPath: string): Promise<GitChange[]> {
    try {
      const git = this.gitInstances.get(repoPath) || simpleGit(repoPath);

      const status = await git.status();

      const changes: GitChange[] = [];

      for (const file of status.files) {
        changes.push({
          file: file.path,
          status: file.index + file.working_dir,
        });
      }

      return changes;
    } catch (error) {
      throw new Error(`Failed to get status for ${repoPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get commit history for a specific file
   */
  async getFileHistory(repoPath: string, filePath: string, maxCount: number = 20): Promise<GitDiff[]> {
    try {
      const git = this.gitInstances.get(repoPath) || simpleGit(repoPath);

      const logData = await git.log([`-${maxCount}`, '--follow', '--', filePath]);

      return logData.all.map(commit => ({
        hash: commit.hash,
        author: commit.author_name || 'Unknown',
        date: new Date(commit.date),
        message: commit.message,
        changes: [
          {
            file: filePath,
            status: 'M',
          },
        ],
      }));
    } catch (error) {
      throw new Error(`Failed to get file history for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get diff between commits
   */
  async getDiffBetweenCommits(
    repoPath: string,
    fromCommit: string,
    toCommit: string,
  ): Promise<GitChange[]> {
    try {
      const git = this.gitInstances.get(repoPath) || simpleGit(repoPath);

      const diffSummary = await git.diffSummary([fromCommit, toCommit]);

      const changes: GitChange[] = [];

      for (const file of diffSummary.files) {
        changes.push({
          file: file.file,
          status: 'M',
        });
      }

      return changes;
    } catch (error) {
      throw new Error(`Failed to get diff between commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all tracked repositories
   */
  getTrackedRepositories(): string[] {
    return Array.from(this.gitInstances.keys());
  }

  /**
   * Remove repository from tracking
   */
  removeRepository(repoPath: string): void {
    this.gitInstances.delete(repoPath);
  }

  /**
   * Clear all tracked repositories
   */
  clearRepositories(): void {
    this.gitInstances.clear();
  }
}
