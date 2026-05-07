export function toBadge(result) {
    if (result.summary.status !== "evaluated") {
        const detected = result.summary.detected_languages.length > 0 ? ` detected=${result.summary.detected_languages.join(",")}` : "";
        return `mcp-lint: not evaluated status=${result.summary.status}${detected}\n`;
    }
    const score = result.summary.score_mode === "effective" ? result.summary.effective_score : result.summary.raw_score;
    const context = result.summary.score_mode === "effective"
        ? ` effective_score suppressions=${result.summary.suppression_count} overrides=${result.summary.override_count}`
        : " raw_score";
    return `mcp-lint: ${score}/100${context}\n`;
}
//# sourceMappingURL=badge.js.map