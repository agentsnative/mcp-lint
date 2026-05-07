function scoreImpactText(finding) {
    if (finding.score_category !== "scored")
        return "score_impact=0";
    if (!finding.score_applied)
        return `score_impact=0 deduped_or_capped dedupe_key=${finding.score_dedupe_key}`;
    return `score_impact=${finding.score_impact} dedupe_key=${finding.score_dedupe_key}`;
}
function findingLine(finding) {
    const subtype = finding.subtype ? `/${finding.subtype}` : "";
    const severity = finding.base_severity === finding.effective_severity
        ? finding.base_severity
        : `${finding.base_severity}->${finding.effective_severity}`;
    return `- ${finding.rule_id}${subtype} ${severity}/${finding.confidence} at ${finding.location.path}:${finding.location.line}: ${finding.message} (${scoreImpactText(finding)})`;
}
function section(title, findings, empty) {
    return ["", `## ${title}`, ...(findings.length > 0 ? findings.map(findingLine) : [empty])];
}
function nullableScore(score) {
    return score === null ? "not evaluated" : String(score);
}
export function toMarkdown(result) {
    const scored = result.findings.filter((finding) => finding.score_category === "scored");
    const preview = result.findings.filter((finding) => finding.score_category === "preview");
    const advisory = result.findings.filter((finding) => finding.score_category === "advisory");
    const lines = [
        "# MCP-Lint Report",
        "",
        `Status: ${result.summary.status}`,
        `Raw score: ${nullableScore(result.summary.raw_score)}`,
        `Effective score: ${nullableScore(result.summary.effective_score)}`,
        `Score mode: ${result.summary.score_mode}`,
        `Supported languages: ${result.summary.supported_languages.join(", ")}`,
        `Detected languages: ${result.summary.detected_languages.length > 0 ? result.summary.detected_languages.join(", ") : "none"}`,
        `Runtime file count: ${result.summary.runtime_file_count}`,
        `Ignored file count: ${result.summary.ignored_file_count}`,
        `Ignored files by reason: ${JSON.stringify(result.summary.ignored_files_by_reason)}`,
        `Finding count: ${result.summary.finding_count}`,
        `Visible finding count: ${result.summary.visible_finding_count}`,
        `Scored finding count: ${result.summary.scored_finding_count}`,
        `Preview finding count: ${result.summary.preview_finding_count}`,
        `Advisory count: ${result.summary.advisory_count}`,
        `Suppression count: ${result.summary.suppression_count}`,
        `Override count: ${result.summary.override_count}`,
        `Critical cap applied: ${result.summary.critical_cap_applied ? "yes" : "no"}`,
        `Score cap applied: ${result.summary.score_cap_applied ? "yes" : "no"}`
    ];
    if (result.summary.status !== "evaluated") {
        lines.push("", "## Not Evaluated / Unsupported Coverage", `This repository was not scored because status is \`${result.summary.status}\`.`, "Unsupported or non-runtime files can still be listed in coverage, but they do not produce a public V0 badge score.");
    }
    lines.push(...section("Scored Findings", scored, "No scored findings."), ...section("Preview Findings", preview, "No preview findings."), ...section("Advisory Findings", advisory, "No advisory findings."));
    return `${lines.join("\n")}\n`;
}
//# sourceMappingURL=markdown.js.map