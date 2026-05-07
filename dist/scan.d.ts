import type { ScanConfig, ScanResult } from "./types.js";
type ScanOptions = {
    write?: boolean;
    config?: Partial<ScanConfig>;
};
export declare function scanPath(targetPath: string, options?: ScanOptions): ScanResult;
export {};
