import type { Confidence, RuleModule, Severity } from "../types.js";
import { firstMatch, makeFinding, redactSecrets } from "./common.js";

export const sec004: RuleModule = {
  id: "MCP-SEC-004",
  name: "Secret Handling Hygiene",
  defaultSeverity: "high",
  defaultConfidence: "medium",
  phase: "v0.1",
  check(context) {
    const content = context.file.content;

    const checks: Array<{
      subtype: string;
      pattern: RegExp;
      severity: Severity;
      confidence: Confidence;
      message: string;
      fix: string;
      matchedPattern: string;
    }> = [
      {
        subtype: "query_param_secret",
        pattern: /(?:\?|&)(?:api[_-]?key|access[_-]?token|token|secret)=\$\{?[^"'\s)}`&]+/i,
        severity: "high",
        confidence: "high",
        message: "Secret-shaped value is placed into a URL query parameter.",
        fix: "Move credentials to headers or a credential store and avoid logging or persisting query strings.",
        matchedPattern: "query_parameter_secret"
      },
      {
        subtype: "direct_env_logging",
        pattern: /(?:console\.log|logger\.(?:info|debug|warn)|print)\s*\([^)]*(?:process\.env|os\.environ|getenv\(["'`][^"'`]*(?:KEY|TOKEN|SECRET|PASSWORD))/i,
        severity: "high",
        confidence: "high",
        message: "Environment secrets or the whole environment are logged directly.",
        fix: "Log only explicit non-sensitive fields and redact secret-shaped values before output.",
        matchedPattern: "direct_env_logging"
      },
      {
        subtype: "provider_pattern_hardcoded_secret",
        pattern: /(?:apiKey|token|secret)\s*[:=]\s*["'`](?:sk|xoxb|ghp)[-_][A-Za-z0-9_-]{6,}/i,
        severity: "high",
        confidence: "medium",
        message: "Provider-shaped credential appears hardcoded.",
        fix: "Load credentials from the environment or a secret manager and keep examples redacted.",
        matchedPattern: "provider_pattern"
      }
    ];

    const findings: ReturnType<RuleModule["check"]> = [];
    for (const check of checks) {
      const match = firstMatch(content, [check.pattern]);
      if (!match) continue;
      findings.push(
        makeFinding(context, {
          ruleId: "MCP-SEC-004",
          subtype: check.subtype,
          baseSeverity: check.severity,
          confidence: check.confidence,
          index: match.index,
          excerpt: redactSecrets(match.match[0]),
          message: check.message,
          fix: check.fix,
          metadata: { matched_pattern: check.matchedPattern, redacted: true }
        })
      );
    }
    return findings;
  }
};
