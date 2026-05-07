import { confidenceMeetsThreshold, severityImpact } from "./rules/common.js";
const publicV0ScoredRules = new Set(["MCP-SEC-003a", "MCP-SEC-003b", "MCP-SEC-001", "MCP-SEC-005", "MCP-QUAL-001"]);
const rulePenaltyCaps = {
    "MCP-SEC-001": 50,
    "MCP-SEC-003a": 20,
    "MCP-SEC-003b": 20,
    "MCP-SEC-005": 20,
    "MCP-QUAL-001": 20
};
function impactFor(severity, confidence, threshold) {
    if (confidence === "low")
        return 0;
    if (!confidenceMeetsThreshold(confidence, threshold))
        return 0;
    return severityImpact[severity];
}
function normalizeIdentifier(value) {
    if (typeof value !== "string")
        return undefined;
    const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
    return normalized || undefined;
}
function normalizedRuntimeRoot(filePath) {
    const parts = filePath.split("/");
    if (parts.length <= 1)
        return ".";
    const first = parts[0];
    if (["src", "lib", "app", "server", "mcp", "packages", "services"].includes(first)) {
        return parts.slice(0, Math.min(parts.length - 1, 2)).join("/");
    }
    return first;
}
function routeOrToolIdentifier(finding) {
    const tool = normalizeIdentifier(finding.tool_name);
    if (tool)
        return `tool:${tool}`;
    const route = normalizeIdentifier(finding.metadata.route ?? finding.metadata.route_path ?? finding.metadata.path);
    if (route)
        return `route:${route}`;
    const bindExpression = normalizeIdentifier(finding.metadata.bind_expression);
    if (bindExpression)
        return `bind:${bindExpression.replace(/['"`]/g, "")}`;
    return undefined;
}
function dedupeKey(finding) {
    const subtype = finding.subtype ?? "default";
    const root = normalizedRuntimeRoot(finding.location.path);
    const identifier = routeOrToolIdentifier(finding) ?? `file:${finding.location.path}`;
    return [finding.rule_id, subtype, root, identifier].join("|");
}
function scoreCategoryFor(finding, config) {
    if (!publicV0ScoredRules.has(finding.rule_id)) {
        return finding.confidence === "low" ? "advisory" : "preview";
    }
    if (finding.confidence === "low" || !confidenceMeetsThreshold(finding.confidence, config.confidence_threshold))
        return "advisory";
    return "scored";
}
export function applyPresentation(findings, config) {
    const prepared = findings.map((finding) => {
        const override = config.severity_overrides[finding.rule_id];
        const configSuppression = config.suppressions.find((suppression) => {
            if (suppression.rule_id !== finding.rule_id)
                return false;
            if (suppression.fingerprint && suppression.fingerprint !== finding.fingerprint)
                return false;
            if (suppression.path && suppression.path !== finding.location.path)
                return false;
            return true;
        });
        const next = { ...finding };
        if (override) {
            next.effective_severity = override;
            next.severity = override;
        }
        if (configSuppression) {
            next.suppressed = true;
            next.suppression_reason = configSuppression.reason;
        }
        next.score_category = scoreCategoryFor(next, config);
        next.score_dedupe_key = dedupeKey(next);
        next.raw_score_impact = 0;
        next.score_impact = 0;
        next.score_applied = false;
        return next;
    });
    const rawUsedByRule = new Map();
    const effectiveUsedByRule = new Map();
    const rawDedupe = new Set();
    const effectiveDedupe = new Set();
    return prepared.map((finding) => {
        const next = { ...finding };
        if (next.score_category !== "scored")
            return next;
        const rawImpact = impactFor(next.base_severity, next.confidence, config.confidence_threshold);
        const effectiveImpact = next.suppressed ? 0 : impactFor(next.effective_severity, next.confidence, config.confidence_threshold);
        const cap = rulePenaltyCaps[next.rule_id] ?? 0;
        if (rawImpact > 0 && !rawDedupe.has(next.score_dedupe_key)) {
            const used = rawUsedByRule.get(next.rule_id) ?? 0;
            const allowed = Math.max(0, cap - used);
            next.raw_score_impact = Math.min(rawImpact, allowed);
            if (next.raw_score_impact > 0) {
                rawUsedByRule.set(next.rule_id, used + next.raw_score_impact);
                rawDedupe.add(next.score_dedupe_key);
            }
        }
        if (effectiveImpact > 0 && !effectiveDedupe.has(next.score_dedupe_key)) {
            const used = effectiveUsedByRule.get(next.rule_id) ?? 0;
            const allowed = Math.max(0, cap - used);
            next.score_impact = Math.min(effectiveImpact, allowed);
            if (next.score_impact > 0) {
                effectiveUsedByRule.set(next.rule_id, used + next.score_impact);
                effectiveDedupe.add(next.score_dedupe_key);
                next.score_applied = true;
            }
        }
        return next;
    });
}
export function scoreFindings(findings, config, coverage) {
    const rawPenalty = findings.reduce((total, finding) => total + finding.raw_score_impact, 0);
    const effectivePenalty = findings.reduce((total, finding) => total + finding.score_impact, 0);
    const evaluated = coverage.status === "evaluated";
    let rawScore = evaluated ? Math.max(0, 100 - rawPenalty) : null;
    let effectiveScore = evaluated ? Math.max(0, 100 - effectivePenalty) : null;
    const rawCritical = findings.some((finding) => finding.base_severity === "critical" && finding.raw_score_impact > 0);
    const effectiveCritical = findings.some((finding) => finding.effective_severity === "critical" && !finding.suppressed && finding.score_impact > 0);
    if (rawCritical && rawScore !== null)
        rawScore = Math.min(rawScore, 50);
    if (effectiveCritical && effectiveScore !== null)
        effectiveScore = Math.min(effectiveScore, 50);
    const possibleRawPenalty = findings
        .filter((finding) => finding.score_category === "scored")
        .reduce((total, finding) => total + impactFor(finding.base_severity, finding.confidence, config.confidence_threshold), 0);
    const scoreCapApplied = evaluated && possibleRawPenalty > rawPenalty;
    return {
        ...coverage,
        raw_score: rawScore,
        effective_score: effectiveScore,
        score_mode: config.score_mode,
        finding_count: findings.length,
        visible_finding_count: findings.filter((finding) => finding.score_category === "scored" && finding.score_impact > 0).length,
        scored_finding_count: findings.filter((finding) => finding.score_category === "scored").length,
        preview_finding_count: findings.filter((finding) => finding.score_category === "preview").length,
        advisory_count: findings.filter((finding) => finding.score_category === "advisory").length,
        suppression_count: findings.filter((finding) => finding.suppressed).length,
        override_count: findings.filter((finding) => finding.base_severity !== finding.effective_severity).length,
        critical_cap_applied: rawCritical || effectiveCritical,
        score_cap_applied: scoreCapApplied
    };
}
//# sourceMappingURL=scoring.js.map