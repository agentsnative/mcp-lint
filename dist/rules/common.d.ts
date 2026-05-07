import type { Confidence, Finding, RuleContext, Severity } from "../types.js";
export declare const severityImpact: Record<Severity, number>;
export declare const confidenceRank: Record<Confidence, number>;
export declare function lineColumnForIndex(content: string, index: number): {
    line: number;
    column: number;
};
export declare function lineAt(content: string, line: number): string;
export declare function normalizeExcerpt(excerpt: string): string;
export declare function redactSecrets(value: string): string;
export declare function fingerprint(ruleId: string, subtype: string | undefined, path: string, excerpt: string): string;
export declare function makeFinding(context: RuleContext, input: {
    ruleId: string;
    subtype?: string;
    baseSeverity: Severity;
    confidence: Confidence;
    index: number;
    message: string;
    fix: string;
    excerpt: string;
    toolName?: string;
    metadata?: Record<string, unknown>;
}): Finding;
export declare function hasToolRegistration(content: string): boolean;
export declare function hasHttpServer(content: string): boolean;
export declare function hasMcpHttpRoute(content: string): boolean;
export declare function hasAuthLikeGuard(content: string): boolean;
export declare function hasHandlerLocalAuth(content: string): boolean;
export declare function hasOriginGuard(content: string): boolean;
export declare function extractToolName(content: string, index?: number): string | undefined;
export declare function firstMatch(content: string, patterns: RegExp[]): {
    index: number;
    match: RegExpExecArray;
} | undefined;
export declare function includesLoopbackFallback(content: string): boolean;
export declare function confidenceMeetsThreshold(confidence: Confidence, threshold: Confidence): boolean;
