"use strict";
/**
 * GitTracker.ts
 * Tracks git changes and repository information
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitTracker = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
class GitTracker {
    constructor() {
        this.gitInstances = new Map();
    }
    /**
     * Initialize git tracking for a repository
     */
    async initRepository(repoPath) {
        try {
            const git = (0, simple_git_1.default)(repoPath);
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
        }
        catch (error) {
            return {
                path: repoPath,
                isRepository: false,
            };
        }
    }
    /**
     * Get recent changes for a repository
     */
    async getRecentChanges(repoPath, maxCount = 10) {
        try {
            const git = this.gitInstances.get(repoPath) || (0, simple_git_1.default)(repoPath);
            const logData = await git.log([`-${maxCount}`, '--name-status']);
            const changes = [];
            for (const commit of logData.all) {
                const files = commit.diff?.files || [];
                const fileChanges = files.map(f => ({
                    file: f.file || '',
                    status: ('status' in f ? f.status : '?'),
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
        }
        catch (error) {
            throw new Error(`Failed to get recent changes for ${repoPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get git diff for latest commit
     */
    async getLatestDiff(repoPath) {
        try {
            const git = this.gitInstances.get(repoPath) || (0, simple_git_1.default)(repoPath);
            const logData = await git.log(['-1', '--name-status']);
            if (!logData.latest) {
                return null;
            }
            const commit = logData.latest;
            const files = commit.diff?.files || [];
            const fileChanges = files.map(f => ({
                file: f.file || '',
                status: ('status' in f ? f.status : '?'),
            }));
            return {
                hash: commit.hash,
                author: commit.author_name || 'Unknown',
                date: new Date(commit.date),
                message: commit.message,
                changes: fileChanges,
            };
        }
        catch (error) {
            throw new Error(`Failed to get latest diff for ${repoPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get git status (uncommitted changes)
     */
    async getStatus(repoPath) {
        try {
            const git = this.gitInstances.get(repoPath) || (0, simple_git_1.default)(repoPath);
            const status = await git.status();
            const changes = [];
            for (const file of status.files) {
                changes.push({
                    file: file.path,
                    status: file.index + file.working_dir,
                });
            }
            return changes;
        }
        catch (error) {
            throw new Error(`Failed to get status for ${repoPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get commit history for a specific file
     */
    async getFileHistory(repoPath, filePath, maxCount = 20) {
        try {
            const git = this.gitInstances.get(repoPath) || (0, simple_git_1.default)(repoPath);
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
        }
        catch (error) {
            throw new Error(`Failed to get file history for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get diff between commits
     */
    async getDiffBetweenCommits(repoPath, fromCommit, toCommit) {
        try {
            const git = this.gitInstances.get(repoPath) || (0, simple_git_1.default)(repoPath);
            const diffSummary = await git.diffSummary([fromCommit, toCommit]);
            const changes = [];
            for (const file of diffSummary.files) {
                changes.push({
                    file: file.file,
                    status: 'M',
                });
            }
            return changes;
        }
        catch (error) {
            throw new Error(`Failed to get diff between commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get all tracked repositories
     */
    getTrackedRepositories() {
        return Array.from(this.gitInstances.keys());
    }
    /**
     * Remove repository from tracking
     */
    removeRepository(repoPath) {
        this.gitInstances.delete(repoPath);
    }
    /**
     * Clear all tracked repositories
     */
    clearRepositories() {
        this.gitInstances.clear();
    }
}
exports.GitTracker = GitTracker;
//# sourceMappingURL=GitTracker.js.map