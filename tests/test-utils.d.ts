export declare function createTempDir(prefix?: string): Promise<string>;
export declare function writeTextFile(filePath: string, contents: string): Promise<void>;
export declare function ensureBuilt(): Promise<void>;
export declare function toPosixPath(filePath: string): string;
export declare function sleep(ms: number): Promise<void>;
export declare function cleanupPath(filePath: string): Promise<void>;
//# sourceMappingURL=test-utils.d.ts.map