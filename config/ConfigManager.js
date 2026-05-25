"use strict";
/**
 * ConfigManager.ts
 * Manages configuration for the cursor-reader module
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = exports.DEFAULT_CONFIG = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
exports.DEFAULT_CONFIG = {
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
class ConfigManager {
    constructor(config = {}) {
        this.config = {
            ...exports.DEFAULT_CONFIG,
            ...config,
        };
    }
    /**
     * Load configuration from file
     */
    static async loadFromFile(configPath) {
        try {
            const content = await promises_1.default.readFile(configPath, 'utf-8');
            const config = JSON.parse(content);
            const manager = new ConfigManager(config);
            return manager;
        }
        catch (error) {
            throw new Error(`Failed to load config from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Save configuration to file
     */
    async save(configPath) {
        try {
            const dir = path_1.default.dirname(configPath);
            await promises_1.default.mkdir(dir, { recursive: true });
            await promises_1.default.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to save config to ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(partial) {
        this.config = {
            ...this.config,
            ...partial,
        };
    }
    /**
     * Add project root
     */
    addProjectRoot(rootPath) {
        if (!this.config.projectRoots.includes(rootPath)) {
            this.config.projectRoots.push(rootPath);
        }
    }
    /**
     * Remove project root
     */
    removeProjectRoot(rootPath) {
        this.config.projectRoots = this.config.projectRoots.filter(r => r !== rootPath);
    }
    /**
     * Get project roots
     */
    getProjectRoots() {
        return [...this.config.projectRoots];
    }
    /**
     * Set watch enabled
     */
    setWatchEnabled(enabled) {
        this.config.watchEnabled = enabled;
    }
    /**
     * Is watch enabled
     */
    isWatchEnabled() {
        return this.config.watchEnabled;
    }
    /**
     * Set git enabled
     */
    setGitEnabled(enabled) {
        this.config.gitEnabled = enabled;
    }
    /**
     * Is git enabled
     */
    isGitEnabled() {
        return this.config.gitEnabled;
    }
    /**
     * Get ignore patterns
     */
    getIgnorePatterns() {
        return [...this.config.ignorePatterns];
    }
    /**
     * Validate configuration
     */
    validate() {
        const errors = [];
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
    getCursorWorkspacePath() {
        if (this.config.cursorWorkspacePath) {
            return this.config.cursorWorkspacePath;
        }
        // Default fallbacks for common OS paths
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const platform = process.platform;
        if (platform === 'win32') {
            return path_1.default.join(homeDir, 'AppData', 'Roaming', 'Cursor');
        }
        else if (platform === 'darwin') {
            return path_1.default.join(homeDir, 'Library', 'Application Support', 'Cursor');
        }
        else {
            return path_1.default.join(homeDir, '.config', 'Cursor');
        }
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map