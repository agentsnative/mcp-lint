import type { RuleModule } from "../types.js";
import { firstMatch, hasMcpHttpRoute, makeFinding } from "./common.js";

const wildcardCorsPattern = /(?:origin|allow_origins)\s*[:=]\s*(?:["'`]\*["'`]|\[\s*["'`]\*["'`]\s*\])/i;
const concreteCorsAllowlistPattern =
  /(?:cors|CORSMiddleware)\s*\([\s\S]{0,240}(?:origin|allow_origins)\s*[:=]\s*\[\s*["'`](?!\*)[^"'`]+["'`]/i;
const namedOriginMiddlewarePattern =
  /(?:app|router|fastify)\.use\s*\(\s*(?:[A-Za-z_$][\w$]*(?:Origin|Cors|Csrf|Rebinding)[\w$]*|(?:validate|require|enforce|check)Origin[\w$]*)\s*\)/i;
const routeLevelOriginMiddlewarePattern =
  /,\s*(?:[A-Za-z_$][\w$]*(?:Origin|Cors|Csrf|Rebinding)[\w$]*|(?:validate|require|enforce|check)Origin[\w$]*)\s*(?:,|\))/i;
const explicitOriginGatePattern =
  /(?:app|router|fastify)\.use\s*\([\s\S]{0,700}(?:(?:allowedOrigins|trustedOrigins|allowlist|localhost|127\.0\.0\.1|csrf|rebinding)[\s\S]{0,220}(?:headers?\.origin|headers\s*\[\s*["'`]origin["'`]\s*\]|headers\.get\(["'`]origin["'`]\))|(?:headers?\.origin|headers\s*\[\s*["'`]origin["'`]\s*\]|headers\.get\(["'`]origin["'`]\))[\s\S]{0,220}(?:allowedOrigins|trustedOrigins|allowlist|localhost|127\.0\.0\.1|csrf|rebinding))[\s\S]{0,240}(?:status\s*\(\s*403|sendStatus\s*\(\s*403|HTTPException|raise|throw|return\s+res)/i;

function hasConcreteOriginGuardBeforeRoute(content: string, routeIndex: number, routeText: string): boolean {
  const beforeRoute = content.slice(0, routeIndex);
  return (
    concreteCorsAllowlistPattern.test(beforeRoute) ||
    namedOriginMiddlewarePattern.test(beforeRoute) ||
    explicitOriginGatePattern.test(beforeRoute) ||
    routeLevelOriginMiddlewarePattern.test(routeText)
  );
}

function hasDynamicCorsBeforeRoute(content: string, routeIndex: number): boolean {
  const beforeRoute = content.slice(0, routeIndex);
  return /\bcors\s*\(\s*\)|CORSMiddleware\s*\(/i.test(beforeRoute);
}

export const sec006: RuleModule = {
  id: "MCP-SEC-006",
  name: "HTTP Origin Validation Missing",
  defaultSeverity: "high",
  defaultConfidence: "high",
  phase: "v0.1",
  check(context) {
    const content = context.file.content;
    if (!hasMcpHttpRoute(content)) return [];
    if (/stdio/i.test(content) && !/(?:app|router|fastify|FastAPI|StreamableHTTP|SSE)/i.test(content)) return [];

    const route = firstMatch(content, [
      /(?:app|router|fastify)\.(?:post|get|all|route|use)\s*\(\s*["'`](?:\/)?(?:mcp|messages?|sse|rpc|tool|tools)[^"'`]*["'`][^\n]*/i,
      /@app\.(?:post|get|api_route)\(\s*["'`](?:\/)?(?:mcp|messages?|sse|rpc|tool|tools)[^"'`]*["'`][^\n]*/i,
      /(?:StreamableHTTP|SSE|streamable_http|http\+sse)[^\n]*/i
    ]);
    if (!route) return [];
    if (hasConcreteOriginGuardBeforeRoute(content, route.index, route.match[0])) return [];
    const wildcardCors = wildcardCorsPattern.test(content);
    const dynamicMiddleware = hasDynamicCorsBeforeRoute(content, route.index) && !wildcardCors;
    return [
      makeFinding(context, {
        ruleId: "MCP-SEC-006",
        baseSeverity: "high",
        confidence: dynamicMiddleware ? "medium" : "high",
        index: route.index,
        excerpt: route.match[0],
        message: wildcardCors
          ? "MCP HTTP route uses wildcard CORS without enforced Origin validation."
          : "MCP HTTP route lacks visible Origin validation before tool execution.",
        fix: "Add strict Origin allowlist middleware before the MCP route; do not rely on generic CORS or localhost bind alone.",
        metadata: { route: route.match[0].replace(/\s+/g, " ").slice(0, 160), related_rules: ["MCP-SEC-003a", "MCP-SEC-003b"] }
      })
    ];
  }
};
