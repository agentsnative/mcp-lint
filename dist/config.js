import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
const severities = new Set(["critical", "high", "medium", "low"]);
const confidences = new Set(["high", "medium", "low"]);
export const defaultConfig = {
    confidence_threshold: "high",
    output_dir: ".mcp-lint",
    score_mode: "raw",
    scan_scope: "runtime",
    severity_overrides: {},
    suppressions: []
};
function asConfidence(value, fallback) {
    const normalized = String(value ?? "").toLowerCase();
    return confidences.has(normalized) ? normalized : fallback;
}
function asSeverity(value) {
    const normalized = String(value ?? "").toLowerCase();
    return severities.has(normalized) ? normalized : undefined;
}
function asScanScope(value, fallback) {
    const normalized = String(value ?? "").toLowerCase();
    return normalized === "all-files" || normalized === "all_files" || normalized === "all" ? "all-files" : fallback;
}
function stripQuotes(value) {
    const trimmed = value.trim();
    return trimmed.replace(/^["'](.*)["']$/, "$1");
}
function parseScalar(raw) {
    const value = stripQuotes(raw.replace(/\s+#.*$/, "").trim());
    if (value === "true")
        return true;
    if (value === "false")
        return false;
    if (/^-?\d+(?:\.\d+)?$/.test(value))
        return Number(value);
    return value;
}
function parseConfigYaml(content) {
    const root = {};
    let section;
    let currentSuppression;
    for (const rawLine of content.split(/\r?\n/)) {
        const lineWithoutComment = rawLine.replace(/\s+#.*$/, "");
        if (!lineWithoutComment.trim())
            continue;
        const topLevel = !/^\s/.test(lineWithoutComment);
        const line = lineWithoutComment.trim();
        if (topLevel) {
            section = undefined;
            currentSuppression = undefined;
            const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
            if (!match)
                continue;
            const [, key, value = ""] = match;
            if ((key === "severity_overrides" || key === "severityOverrides") && value.trim() === "") {
                section = key;
                root[key] = {};
            }
            else if (key === "suppressions" && value.trim() === "") {
                section = "suppressions";
                root.suppressions = [];
            }
            else {
                root[key] = parseScalar(value);
            }
            continue;
        }
        if (section === "severity_overrides" || section === "severityOverrides") {
            const match = /^([A-Za-z0-9_-]+):\s*(.+)$/.exec(line);
            if (match) {
                const overrides = root[section];
                overrides[match[1]] = parseScalar(match[2]);
            }
            continue;
        }
        if (section === "suppressions") {
            const listMatch = /^-\s*([A-Za-z0-9_-]+):\s*(.+)$/.exec(line);
            if (listMatch) {
                currentSuppression = { [listMatch[1]]: parseScalar(listMatch[2]) };
                root.suppressions.push(currentSuppression);
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
export function loadConfig(root) {
    const candidates = ["mcp-lint.yml", "mcp-lint.yaml", ".mcp-lint.yml", ".mcp-lint.yaml"];
    const file = candidates.map((candidate) => path.join(root, candidate)).find((candidate) => existsSync(candidate));
    if (!file)
        return { ...defaultConfig, severity_overrides: {}, suppressions: [] };
    const raw = parseConfigYaml(readFileSync(file, "utf8"));
    const rawOverrides = (raw.severity_overrides ?? raw.severityOverrides ?? {});
    const severity_overrides = {};
    for (const [ruleId, severity] of Object.entries(rawOverrides)) {
        const normalized = asSeverity(severity);
        if (normalized)
            severity_overrides[ruleId] = normalized;
    }
    const suppressions = Array.isArray(raw.suppressions)
        ? raw.suppressions
            .map((entry) => entry)
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
//# sourceMappingURL=config.js.map