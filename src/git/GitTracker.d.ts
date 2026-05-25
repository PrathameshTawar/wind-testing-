/**
 * GitTracker.ts
 * Tracks git changes and repository information
 */
export interface GitChange {
    file: string;
    status: string;
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
export declare class GitTracker {
    private gitInstances;
    /**
     * Initialize git tracking for a repository
     */
    initRepository(repoPath: string): Promise<RepositoryInfo>;
    /**
     * Get recent changes for a repository
     */
    getRecentChanges(repoPath: string, maxCount?: number): Promise<GitDiff[]>;
    /**
     * Get git diff for latest commit
     */
    getLatestDiff(repoPath: string): Promise<GitDiff | null>;
    /**
     * Get git status (uncommitted changes)
     */
    getStatus(repoPath: string): Promise<GitChange[]>;
    /**
     * Get commit history for a specific file
     */
    getFileHistory(repoPath: string, filePath: string, maxCount?: number): Promise<GitDiff[]>;
    /**
     * Get diff between commits
     */
    getDiffBetweenCommits(repoPath: string, fromCommit: string, toCommit: string): Promise<GitChange[]>;
    /**
     * Get all tracked repositories
     */
    getTrackedRepositories(): string[];
    /**
     * Remove repository from tracking
     */
    removeRepository(repoPath: string): void;
    /**
     * Clear all tracked repositories
     */
    clearRepositories(): void;
}
//# sourceMappingURL=GitTracker.d.ts.map