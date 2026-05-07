import type { RuleModule } from "../types.js";
import { extractToolName, firstMatch, hasToolRegistration, makeFinding } from "./common.js";

const verbs = ["delete", "remove", "send", "create", "update", "write", "execute", "invoke", "run"];
const fields = ["id", "target", "recipient", "url", "path", "file", "key", "name"];

export const qual002: RuleModule = {
  id: "MCP-QUAL-002",
  name: "Destructive Tool Missing Safety Metadata",
  defaultSeverity: "medium",
  defaultConfidence: "medium",
  phase: "v0.1",
  check(context) {
    const content = context.file.content;
    if (!hasToolRegistration(content)) return [];
    if (/destructiveHint\s*:\s*(?:true|false)|idempotentHint|openWorldHint|readOnlyHint\s*:\s*true|(?:dry_run|preview)[\s\S]{0,80}default\s*:\s*true|operatorApproval/i.test(content)) return [];

    const toolName = extractToolName(content) ?? "";
    const matchedVerb = verbs.find((verb) => toolName.toLowerCase().startsWith(verb)) ?? verbs.find((verb) => new RegExp(`["'\`]${verb}[_-]`, "i").test(content));
    if (!matchedVerb) return [];
    const matchedField = fields.find((field) => new RegExp(`\\b${field}\\b`, "i").test(content));
    if (!matchedField) return [];

    const match = firstMatch(content, [/(?:server|mcp|app)\.(?:tool|registerTool)\s*\([^\n]+/i, /registerTool\s*\([^\n]+/i]);
    if (!match) return [];
    return [
      makeFinding(context, {
        ruleId: "MCP-QUAL-002",
        baseSeverity: "medium",
        confidence: "medium",
        index: match.index,
        excerpt: match.match[0],
        toolName,
        message: "Mutating tool name and target-like schema field are visible, but safety metadata or a safe preview default is missing.",
        fix: "Add explicit destructive/idempotent/open-world annotations or a dry_run/preview field that defaults to true.",
        metadata: { matched_verb: matchedVerb, matched_field: matchedField }
      })
    ];
  }
};
