"use strict";
/**
 * CursorDiscoverer.ts
 * Safely discovers and extracts metadata from Cursor workspace
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorDiscoverer = void 0;
const path_1 = __importDefault(require("path"));
class CursorDiscoverer {
    constructor(safeFs) {
        this.safeFs = safeFs;
    }
    /**
     * Discover Cursor workspace metadata
     */
    async discoverWorkspace(cursorWorkspacePath) {
        const metadata = {
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
        }
        catch (error) {
            console.error('Error discovering cursor workspace:', error);
        }
        return metadata;
    }
    /**
     * Read Cursor version
     */
    async readCursorVersion(cursorWorkspacePath) {
        try {
            const versionPath = path_1.default.join(cursorWorkspacePath, 'version');
            if (await this.safeFs.fileExists(versionPath)) {
                const version = await this.safeFs.readFile(versionPath);
                return version.trim();
            }
        }
        catch {
            // Ignore errors
        }
        return undefined;
    }
    /**
     * Read workspace settings
     */
    async readWorkspaceSettings(cursorWorkspacePath) {
        try {
            const settingsPath = path_1.default.join(cursorWorkspacePath, 'settings.json');
            if (await this.safeFs.fileExists(settingsPath)) {
                const content = await this.safeFs.readFile(settingsPath);
                return JSON.parse(content);
            }
        }
        catch (error) {
            // Ignore errors - settings might not exist or be invalid JSON
        }
        return undefined;
    }
    /**
     * Discover projects from workspace
     */
    async discoverProjects(cursorWorkspacePath) {
        const projects = [];
        try {
            // Look for workspaceStorage directory
            const workspaceStoragePath = path_1.default.join(cursorWorkspacePath, 'workspaceStorage');
            if (await this.safeFs.fileExists(workspaceStoragePath)) {
                const entries = await this.safeFs.listDirectory(workspaceStoragePath);
                for (const entry of entries) {
                    if (entry.isDirectory) {
                        // Each subdirectory might represent a workspace
                        projects.push(entry.path);
                    }
                }
            }
        }
        catch (error) {
            // Ignore errors
        }
        return projects;
    }
    /**
     * Extract prompt history from Cursor workspace
     */
    async extractPromptHistory(cursorWorkspacePath) {
        const prompts = [];
        try {
            // Look for chat history or state files
            // Try to find chat artifacts
            const chatArtifactsPath = path_1.default.join(cursorWorkspacePath, 'Chat');
            if (await this.safeFs.fileExists(chatArtifactsPath)) {
                const entries = await this.safeFs.listDirectory(chatArtifactsPath);
                for (const entry of entries) {
                    if (entry.isFile && (entry.path.endsWith('.json') || entry.path.endsWith('.txt'))) {
                        try {
                            const metadata = await this.extractPromptFromFile(entry.path);
                            if (metadata) {
                                prompts.push(metadata);
                            }
                        }
                        catch {
                            // Skip files that can't be parsed
                        }
                    }
                }
            }
        }
        catch (error) {
            // Ignore errors
        }
        return prompts.slice(0, 10); // Return top 10 recent prompts
    }
    /**
     * Extract prompt metadata from a single file
     */
    async extractPromptFromFile(filePath) {
        try {
            const content = await this.safeFs.readFile(filePath);
            // Try to parse as JSON first
            let data = [];
            try {
                data = JSON.parse(content);
            }
            catch {
                // If not JSON, treat as plain text
                data = [content];
            }
            // Extract metadata
            const id = path_1.default.basename(filePath);
            const summary = this.extractSummary(data);
            const timestamp = new Date();
            const relatedFiles = this.extractRelatedFiles(data);
            return {
                id,
                summary,
                timestamp,
                relatedFiles,
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Extract summary from data
     */
    extractSummary(data) {
        if (typeof data === 'string') {
            return data.slice(0, 200);
        }
        if (Array.isArray(data)) {
            const firstItem = data[0];
            if (typeof firstItem === 'string') {
                return firstItem.slice(0, 200);
            }
            if (typeof firstItem === 'object' && firstItem !== null) {
                const message = firstItem.message;
                if (typeof message === 'string') {
                    return message.slice(0, 200);
                }
            }
        }
        if (typeof data === 'object' && data !== null) {
            const obj = data;
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
    extractRelatedFiles(data) {
        const files = [];
        const extract = (obj) => {
            if (typeof obj === 'string') {
                // Simple heuristic: looks like a file path
                if (obj.includes('/') || obj.includes('\\') || obj.includes('.')) {
                    files.push(obj);
                }
            }
            else if (Array.isArray(obj)) {
                for (const item of obj) {
                    extract(item);
                }
            }
            else if (typeof obj === 'object' && obj !== null) {
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
    async listProjects(cursorWorkspacePath) {
        const projects = [];
        try {
            const workspaceStoragePath = path_1.default.join(cursorWorkspacePath, 'workspaceStorage');
            const entries = await this.safeFs.listDirectory(workspaceStoragePath);
            for (const entry of entries) {
                if (entry.isDirectory) {
                    const name = path_1.default.basename(entry.path);
                    projects.push(name);
                }
            }
        }
        catch {
            // Return empty if can't read
        }
        return projects;
    }
}
exports.CursorDiscoverer = CursorDiscoverer;
//# sourceMappingURL=CursorDiscoverer.js.map