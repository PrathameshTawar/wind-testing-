/**
 * ConfigManager.ts
 * Manages configuration for the cursor-reader module
 */
export interface CursorReaderConfig {
    projectRoots: string[];
    watchEnabled: boolean;
    maxChangeHistory: number;
    searchMaxResults: number;
    gitEnabled: boolean;
    ignorePatterns: string[];
    cursorWorkspacePath?: string;
}
export declare const DEFAULT_CONFIG: CursorReaderConfig;
export declare class ConfigManager {
    private config;
    constructor(config?: Partial<CursorReaderConfig>);
    /**
     * Load configuration from file
     */
    static loadFromFile(configPath: string): Promise<ConfigManager>;
    /**
     * Save configuration to file
     */
    save(configPath: string): Promise<void>;
    /**
     * Get current configuration
     */
    getConfig(): CursorReaderConfig;
    /**
     * Update configuration
     */
    updateConfig(partial: Partial<CursorReaderConfig>): void;
    /**
     * Add project root
     */
    addProjectRoot(rootPath: string): void;
    /**
     * Remove project root
     */
    removeProjectRoot(rootPath: string): void;
    /**
     * Get project roots
     */
    getProjectRoots(): string[];
    /**
     * Set watch enabled
     */
    setWatchEnabled(enabled: boolean): void;
    /**
     * Is watch enabled
     */
    isWatchEnabled(): boolean;
    /**
     * Set git enabled
     */
    setGitEnabled(enabled: boolean): void;
    /**
     * Is git enabled
     */
    isGitEnabled(): boolean;
    /**
     * Get ignore patterns
     */
    getIgnorePatterns(): string[];
    /**
     * Validate configuration
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get cursor workspace path (with fallback)
     */
    getCursorWorkspacePath(): string;
}
//# sourceMappingURL=ConfigManager.d.ts.map