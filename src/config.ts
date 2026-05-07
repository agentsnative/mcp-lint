import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Confidence, ScanConfig, ScanScope, Severity } from "./types.js";

const severities = new Set(["critical", "high", "medium", "low"]);
const confidences = new Set(["high", "medium", "low"]);

export const defaultConfig: ScanConfig = {
  confidence_threshold: "high",
  output_dir: ".mcp-lint",
  score_mode: "raw",
  scan_scope: "runtime",
  severity_overrides: {},
  suppressions: []
};

function asConfidence(value: unknown, fallback: Confidence): Confidence {
  const normalized = String(value ?? "").toLowerCase();
  return confidences.has(normalized) ? (normalized as Confidence) : fallback;
}

function asSeverity(value: unknown): Severity | undefined {
  const normalized = String(value ?? "").toLowerCase();
  return severities.has(normalized) ? (normalized as Severity) : undefined;
}

function asScanScope(value: unknown, fallback: ScanScope): ScanScope {
  const normalized = String(value ?? "").toLowerCase();
  return normalized === "all-files" || normalized === "all_files" || normalized === "all" ? "all-files" : fallback;
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  return trimmed.replace(/^["'](.*)["']$/, "$1");
}

function parseScalar(raw: string): string | boolean | number {
  const value = stripQuotes(raw.replace(/\s+#.*$/, "").trim());
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseConfigYaml(content: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let section: "severity_overrides" | "severityOverrides" | "suppressions" | undefined;
  let currentSuppression: Record<string, unknown> | undefined;

  for (const rawLine of content.split(/\r?\n/)) {
    const lineWithoutComment = rawLine.replace(/\s+#.*$/, "");
    if (!lineWithoutComment.trim()) continue;
    const topLevel = !/^\s/.test(lineWithoutComment);
    const line = lineWithoutComment.trim();

    if (topLevel) {
      section = undefined;
      currentSuppression = undefined;
      const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
      if (!match) continue;
      const [, key, value = ""] = match;
      if ((key === "severity_overrides" || key === "severityOverrides") && value.trim() === "") {
        section = key;
        root[key] = {};
      } else if (key === "suppressions" && value.trim() === "") {
        section = "suppressions";
        root.suppressions = [];
      } else {
        root[key] = parseScalar(value);
      }
      continue;
    }

    if (section === "severity_overrides" || section === "severityOverrides") {
      const match = /^([A-Za-z0-9_-]+):\s*(.+)$/.exec(line);
      if (match) {
        const overrides = root[section] as Record<string, unknown>;
        overrides[match[1]] = parseScalar(match[2]);
      }
      continue;
    }

    if (section === "suppressions") {
      const listMatch = /^-\s*([A-Za-z0-9_-]+):\s*(.+)$/.exec(line);
      if (listMatch) {
        currentSuppression = { [listMatch[1]]: parseScalar(listMatch[2]) };
        (root.suppressions as Array<Record<string, unknown>>).push(currentSuppression);
        continue;
      }
      const fieldMatch = /^([A-Za-z0-9_-]+):\s*(.+)$/.exec(line);
      if (fieldMatch && currentSuppression) {
        currentSuppression[fieldMatch[1]] = parseScalar(fieldMatch[2]);
      }
    }
  }

  return root;
}

export function loadConfig(root: string): ScanConfig {
  const candidates = ["mcp-lint.yml", "mcp-lint.yaml", ".mcp-lint.yml", ".mcp-lint.yaml"];
  const file = candidates.map((candidate) => path.join(root, candidate)).find((candidate) => existsSync(candidate));
  if (!file) return { ...defaultConfig, severity_overrides: {}, suppressions: [] };

  const raw = parseConfigYaml(readFileSync(file, "utf8"));
  const rawOverrides = (raw.severity_overrides ?? raw.severityOverrides ?? {}) as Record<string, unknown>;
  const severity_overrides: Record<string, Severity> = {};
  for (const [ruleId, severity] of Object.entries(rawOverrides)) {
    const normalized = asSeverity(severity);
    if (normalized) severity_overrides[ruleId] = normalized;
  }

  const suppressions = Array.isArray(raw.suppressions)
    ? raw.suppressions
        .map((entry) => entry as Record<string, unknown>)
        .filter((entry) => typeof entry.rule_id === "string" && typeof entry.reason === "string" && entry.reason.trim())
        .map((entry) => ({
          rule_id: String(entry.rule_id),
          path: typeof entry.path === "string" ? entry.path : undefined,
          fingerprint: typeof entry.fingerprint === "string" ? entry.fingerprint : undefined,
          reason: String(entry.reason).trim()
        }))
    : [];

  return {
    confidence_threshold: asConfidence(raw.confidence_threshold ?? raw.confidenceThreshold, defaultConfig.confidence_threshold),
    output_dir: typeof raw.output_dir === "string" ? raw.output_dir : defaultConfig.output_dir,
    score_mode: raw.score_mode === "effective" ? "effective" : "raw",
    scan_scope: asScanScope(raw.scan_scope ?? raw.scanScope, defaultConfig.scan_scope),
    severity_overrides,
    suppressions
  };
}
