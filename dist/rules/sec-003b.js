import { firstMatch, hasAuthLikeGuard, hasHandlerLocalAuth, hasMcpHttpRoute, makeFinding } from "./common.js";
export const sec003b = {
    id: "MCP-SEC-003b",
    name: "HTTP Transport Without Auth",
    defaultSeverity: "high",
    defaultConfidence: "high",
    phase: "v0-alpha",
    check(context) {
        const content = context.file.content;
        if (!hasMcpHttpRoute(content))
            return [];
        if (/stdio/i.test(content) && !/(?:app|router|fastify|FastAPI|StreamableHTTP|SSE)/i.test(content))
            return [];
        if (/health|metrics|docs/i.test(content) && !/tool|mcp|messages|sse|rpc/i.test(content))
            return [];
        if (/app\.use\s*\(\s*["'`]\/?(?:mcp|messages?|sse|rpc|tools?)[^"'`]*["'`]\s*,\s*(?:requireAuth|authMiddleware|verifyToken|verifyJwt|protect|guard)/i.test(content) ||
            /(?:app|router|fastify)\.(?:post|get|all|route|use)\s*\([^)]*["'`]\/?(?:mcp|messages?|sse|rpc|tools?)[^"'`]*["'`][^)]*,\s*(?:requireAuth|authMiddleware|verifyToken|verifyJwt|protect|guard)/i.test(content)) {
            return [];
        }
        const handlerLocal = hasHandlerLocalAuth(content);
        if (!handlerLocal && hasAuthLikeGuard(content))
            return [];
        const route = firstMatch(content, [
            /(?:app|router|fastify)\.(?:post|get|all|route|use)\s*\([^\n]+/i,
            /@app\.(?:post|get|api_route)\([^\n]+/i,
            /(?:StreamableHTTP|SSE|streamable_http|http\+sse)[^\n]*/i
        ]);
        if (!route)
            return [];
        return [
            makeFinding(context, {
                ruleId: "MCP-SEC-003b",
                baseSeverity: "high",
                confidence: handlerLocal ? "low" : "high",
                index: route.index,
                excerpt: route.match[0],
                message: handlerLocal
                    ? "MCP HTTP route relies on handler-local auth that is not clearly in the request path."
                    : "MCP HTTP route is mounted without visible authentication middleware.",
                fix: "Apply Bearer, OAuth, JWT, API-key, or equivalent custom middleware before the MCP route.",
                metadata: { route: route.match[0].replace(/\s+/g, " ").slice(0, 160), related_rules: ["MCP-SEC-003a"] }
            })
        ];
    }
};
//# sourceMappingURL=sec-003b.js.map