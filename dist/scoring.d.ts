import type { Finding, ScanConfig, ScanCoverage, ScanSummary } from "./types.js";
export declare function applyPresentation(findings: Finding[], config: ScanConfig): Finding[];
export declare function scoreFindings(findings: Finding[], config: ScanConfig, coverage: ScanCoverage): ScanSummary;
