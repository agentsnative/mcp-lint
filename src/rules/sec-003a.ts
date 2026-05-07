import type { RuleModule } from "../types.js";
import { firstMatch, hasHttpServer, hasMcpHttpRoute, includesLoopbackFallback, makeFinding } from "./common.js";

export const sec003a: RuleModule = {
  id: "MCP-SEC-003a",
  name: "HTTP Non-Loopback Bind",
  defaultSeverity: "high",
  defaultConfidence: "high",
  phase: "v0-alpha",
  check(context) {
    const content = context.file.content;
    if (!hasHttpServer(content) || /stdio/i.test(content) && !hasMcpHttpRoute(content)) return [];
    if (/(?:127\.0\.0\.1|localhost|::1)/i.test(content) && !/(?:0\.0\.0\.0|["'`]\*["'`]|["'`]::["'`])/.test(content)) return [];

    const literal = firstMatch(content, [
      /(?:listen|run|serve|host|hostname|bind|transport)[\s\S]{0,160}["'`](?:0\.0\.0\.0|\*|::|)["'`]/i,
      /host\s*[:=]\s*["'`](?:0\.0\.0\.0|\*|::|)["'`]/i,
      /["'`](?:0\.0\.0\.0|\*|::|)["'`][\s\S]{0,80}(?:host|hostname|bind)/i
    ]);
    if (literal) {
      return [
        makeFinding(context, {
          ruleId: "MCP-SEC-003a",
          baseSeverity: "high",
          confidence: "high",
          index: literal.index,
          excerpt: literal.match[0],
          message: "MCP HTTP transport binds to a non-loopback interface by default.",
          fix: "Bind to 127.0.0.1 or localhost by default, and require explicit auth plus documentation for intentional network exposure.",
          metadata: { bind_expression: literal.match[0].replace(/\s+/g, " ").slice(0, 120) }
        })
      ];
    }

    const dynamicHost = firstMatch(content, [
      /(?:host|hostname)\s*[:=]\s*(?:process\.env|os\.environ|getenv|config\.)[A-Za-z0-9_.()[\]"'`]+/i,
      /listen\s*\([^)]*(?:process\.env|os\.environ|getenv|config\.)[^)]*\)/i
    ]);
    if (dynamicHost && !includesLoopbackFallback(content)) {
      return [
        makeFinding(context, {
          ruleId: "MCP-SEC-003a",
          baseSeverity: "high",
          confidence: "medium",
          index: dynamicHost.index,
          excerpt: dynamicHost.match[0],
          message: "MCP HTTP bind host is dynamic and no loopback fallback is visible.",
          fix: "Use a loopback fallback and require an explicit operator setting before binding beyond loopback.",
          metadata: { bind_expression: dynamicHost.match[0].replace(/\s+/g, " ").slice(0, 120) }
        })
      ];
    }

    const omittedKnownDefault = firstMatch(content, [/app\.listen\s*\(\s*[^,)]{1,80}\)/i, /server\.listen\s*\(\s*[^,)]{1,80}\)/i]);
    if (omittedKnownDefault && hasMcpHttpRoute(content)) {
      return [
        makeFinding(context, {
          ruleId: "MCP-SEC-003a",
          baseSeverity: "high",
          confidence: "high",
          index: omittedKnownDefault.index,
          excerpt: omittedKnownDefault.match[0],
          message: "MCP HTTP server omits host for a framework default that may expose non-loopback interfaces.",
          fix: "Pass an explicit loopback host when starting the HTTP server.",
          metadata: { bind_expression: omittedKnownDefault.match[0].replace(/\s+/g, " ").slice(0, 120) }
        })
      ];
    }

    return [];
  }
};
