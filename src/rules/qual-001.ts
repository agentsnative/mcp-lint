import type { RuleModule, Severity, Confidence } from "../types.js";
import { extractToolName, firstMatch, hasToolRegistration, makeFinding } from "./common.js";

function hasHandlerFieldUse(content: string): boolean {
  return /\b(?:input|args|params|request)\.[A-Za-z_$][\w$]*/.test(content);
}

export const qual001: RuleModule = {
  id: "MCP-QUAL-001",
  name: "Hard Schema Checks Only",
  defaultSeverity: "high",
  defaultConfidence: "high",
  phase: "v0-alpha",
  check(context) {
    const content = context.file.content;
    if (!hasToolRegistration(content)) return [];
    const findings: ReturnType<RuleModule["check"]> = [];

    const checks: Array<{
      subtype: string;
      pattern: RegExp;
      severity?: Severity;
      confidence?: Confidence;
      message: string;
      fix: string;
    }> = [
      {
        subtype: "missing_schema",
        pattern: /(?:server|mcp|app)\.(?:tool|registerTool)\s*\(\s*["'`][^"'`]+["'`]\s*,\s*(?:async\s*)?\(/i,
        message: "Tool registration omits an input schema while accepting handler arguments.",
        fix: "Add an explicit input schema that declares properties and required fields used by the handler."
      },
      {
        subtype: "unconstrained_object",
        pattern: /(?:inputSchema|schema|parameters)\s*[:=]\s*(?:z\.object\(\s*\{\s*\}\s*\)(?:\.passthrough\(\))?|\{\s*type\s*:\s*["'`]object["'`]\s*\})/i,
        message: "Tool input schema accepts an unconstrained object.",
        fix: "Declare explicit properties and reject unknown inputs unless the handler has a documented guard."
      },
      {
        subtype: "no_required",
        pattern: /properties\s*:\s*\{[\s\S]{1,400}\}(?![\s\S]{0,160}required\s*:)/i,
        message: "Tool schema declares properties but no required fields while handler field usage is visible.",
        fix: "Add required fields for values the handler dereferences."
      },
      {
        subtype: "url_as_string",
        pattern: /(?:url|uri|endpoint|webhook|callback)\s*[:=]\s*(?:z\.string\(\)(?!\.url)|\{\s*type\s*:\s*["'`]string["'`](?![\s\S]{0,80}format\s*:\s*["'`](?:uri|url)))/i,
        message: "URL-shaped input is modeled as a plain string.",
        fix: "Use a URL or URI validator and keep SSRF checks in the handler."
      },
      {
        subtype: "parameterless_tool_accepts_any_object",
        pattern: /(?:z\.object\(\s*\{\s*\}\s*\)\.passthrough\(\)|additionalProperties\s*:\s*true)/i,
        severity: "medium",
        confidence: "medium",
        message: "Parameterless tool accepts an open object instead of a strict empty object.",
        fix: "Use a strict empty schema for parameterless tools."
      }
    ];

    for (const check of checks) {
      if ((check.subtype === "unconstrained_object" || check.subtype === "no_required") && !hasHandlerFieldUse(content)) continue;
      if (check.subtype === "parameterless_tool_accepts_any_object" && hasHandlerFieldUse(content)) continue;
      const match = firstMatch(content, [check.pattern]);
      if (!match) continue;
      findings.push(
        makeFinding(context, {
          ruleId: "MCP-QUAL-001",
          subtype: check.subtype,
          baseSeverity: check.severity ?? "high",
          confidence: check.confidence ?? "high",
          index: match.index,
          excerpt: match.match[0],
          toolName: extractToolName(content, match.index),
          message: check.message,
          fix: check.fix,
          metadata: { schema_subtype: check.subtype }
        })
      );
    }

    return findings;
  }
};
