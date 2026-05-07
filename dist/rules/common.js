import crypto from "node:crypto";
export const severityImpact = {
    critical: 50,
    high: 20,
    medium: 10,
    low: 0
};
export const confidenceRank = {
    low: 0,
    medium: 1,
    high: 2
};
export function lineColumnForIndex(content, index) {
    const prefix = content.slice(0, Math.max(0, index));
    const lines = prefix.split(/\r?\n/);
    return { line: lines.length, column: lines.at(-1).length + 1 };
}
export function lineAt(content, line) {
    return content.split(/\r?\n/)[line - 1] ?? "";
}
export function normalizeExcerpt(excerpt) {
    return redactSecrets(excerpt).replace(/\s+/g, " ").trim().slice(0, 240);
}
export function redactSecrets(value) {
    return value
        .replace(/(api[_-]?key|token|secret|password)=([^&\s"'`]+)/gi, "$1=<redacted>")
        .replace(/(sk|xox[baprs]|gh[pousr])[-_][A-Za-z0-9_-]{8,}/g, "$1-<redacted>")
        .replace(/process\.env\.[A-Z0-9_]*(KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*/g, "process.env.<redacted>");
}
export function fingerprint(ruleId, subtype, path, excerpt) {
    const hash = crypto.createHash("sha256");
    hash.update([ruleId, subtype ?? "", path, normalizeExcerpt(excerpt)].join("\n"));
    return hash.digest("hex").slice(0, 24);
}
export function makeFinding(context, input) {
    const position = lineColumnForIndex(context.file.content, input.index);
    return {
        rule_id: input.ruleId,
        subtype: input.subtype,
        base_severity: input.baseSeverity,
        effective_severity: input.baseSeverity,
        severity: input.baseSeverity,
        confidence: input.confidence,
        location: {
            path: context.file.relativePath,
            line: position.line,
            column: position.column
        },
        message: input.message,
        fix_suggestion: input.fix,
        fingerprint: fingerprint(input.ruleId, input.subtype, context.file.relativePath, input.excerpt),
        suppressed: false,
        score_impact: 0,
        raw_score_impact: 0,
        score_category: "advisory",
        score_dedupe_key: "",
        score_applied: false,
        tool_name: input.toolName,
        metadata: input.metadata ?? {}
    };
}
export function hasToolRegistration(content) {
    return /(?:server|mcp|app)\.(?:tool|registerTool)\s*\(|registerTool\s*\(|@(?:mcp|server)\.tool/i.test(content);
}
export function hasHttpServer(content) {
    return /(?:express|fastify|FastAPI|Starlette|uvicorn|http\.createServer|createServer|listen\s*\(|StreamableHTTP|SSE|route|router|app\.(?:get|post|use))/i.test(content);
}
export function hasMcpHttpRoute(content) {
    const routePattern = /(?:app|router|fastify)\.(?:post|get|all|route|use)\s*\(\s*["'`](?:\/)?(?:mcp|messages?|sse|rpc|tool|tools)[^"'`]*/i;
    const pythonRoute = /@app\.(?:post|get|api_route)\(\s*["'`](?:\/)?(?:mcp|messages?|sse|rpc|tool|tools)[^"'`]*/i;
    const transport = /(?:StreamableHTTP|SSE|streamable_http|http\+sse|mcp.*http|http.*mcp)/i;
    return routePattern.test(content) || pythonRoute.test(content) || transport.test(content);
}
export function hasAuthLikeGuard(content) {
    if (/(?:req|request)\.(?:query|params)\.(?:api_?key|token|auth)/i.test(content))
        return false;
    return /(?:bearer|oauth|jwt|api[_-]?key|authorization|requireAuth|authMiddleware|verifyToken|verifyJwt|protect|guard|Depends\([^)]*(?:Security|OAuth|APIKey)|HTTPBearer|APIKeyHeader)/i.test(content);
}
export function hasHandlerLocalAuth(content) {
    return /if\s*\([^)]*(?:headers?\.authorization|Authorization|HTTPBearer|APIKeyHeader)[^)]*\)/i.test(content);
}
export function hasOriginGuard(content) {
    if (/(?:origin|allow_origins)\s*[:=]\s*(?:["'`]\*["'`]|\[\s*["'`]\*["'`]\s*\])/i.test(content))
        return false;
    return /(?:Origin|origin)[\s\S]{0,160}(?:allowlist|allowedOrigins|trustedOrigins|includes|localhost|127\.0\.0\.1|csrf|rebinding)|(?:cors|CORSMiddleware)\s*\([\s\S]{0,160}(?:origin|allow_origins)\s*[:=]\s*\[/i.test(content);
}
export function extractToolName(content, index = 0) {
    const before = content.slice(0, Math.max(index, 0) + 300);
    const match = /(?:server|mcp|app)\.(?:tool|registerTool)\s*\(\s*["'`]([^"'`]+)["'`]/i.exec(before) ??
        /registerTool\s*\(\s*["'`]([^"'`]+)["'`]/i.exec(before) ??
        /@(?:mcp|server)\.tool\s*\(\s*["'`]([^"'`]+)["'`]/i.exec(before);
    return match?.[1];
}
export function firstMatch(content, patterns) {
    let best;
    for (const pattern of patterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(content);
        if (!match)
            continue;
        const index = match.index;
        if (!best || index < best.index)
            best = { index, match };
    }
    return best;
}
export function includesLoopbackFallback(content) {
    return /(?:process\.env|os\.environ|getenv)[\s\S]{0,80}(?:\|\||or|default=|,\s*)\s*["'`](?:127\.0\.0\.1|localhost|::1)["'`]/i.test(content);
}
export function confidenceMeetsThreshold(confidence, threshold) {
    return confidenceRank[confidence] >= confidenceRank[threshold];
}
//# sourceMappingURL=common.js.map