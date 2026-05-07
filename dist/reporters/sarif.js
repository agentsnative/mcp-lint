export function toSarif(result) {
    const visibleFindings = result.findings.filter((finding) => finding.score_category === "scored" && finding.score_impact > 0 && finding.score_applied);
    const rules = new Map(visibleFindings.map((finding) => [
        finding.rule_id,
        {
            id: finding.rule_id,
            name: finding.rule_id,
            shortDescription: { text: finding.rule_id },
            help: { text: finding.fix_suggestion }
        }
    ]));
    const sarif = {
        version: "2.1.0",
        $schema: "https://json.schemastore.org/sarif-2.1.0.json",
        runs: [
            {
                tool: {
                    driver: {
                        name: "mcp-lint",
                        informationUri: "https://github.com/agentsnative/mcp-lint",
                        rules: [...rules.values()]
                    }
                },
                results: visibleFindings.map((finding) => ({
                    ruleId: finding.rule_id,
                    level: finding.base_severity === "critical" || finding.base_severity === "high" ? "error" : "warning",
                    message: { text: finding.message },
                    locations: [
                        {
                            physicalLocation: {
                                artifactLocation: { uri: finding.location.path },
                                region: { startLine: finding.location.line, startColumn: finding.location.column }
                            }
                        }
                    ],
                    partialFingerprints: { primaryLocationLineHash: finding.fingerprint },
                    properties: {
                        subtype: finding.subtype,
                        confidence: finding.confidence,
                        base_severity: finding.base_severity,
                        effective_severity: finding.effective_severity,
                        score_category: finding.score_category,
                        score_dedupe_key: finding.score_dedupe_key,
                        score_applied: finding.score_applied,
                        suppressed: finding.suppressed,
                        suppression_reason: finding.suppression_reason,
                        fix_suggestion: finding.fix_suggestion,
                        metadata: finding.metadata
                    }
                }))
            }
        ]
    };
    return `${JSON.stringify(sarif, null, 2)}\n`;
}
//# sourceMappingURL=sarif.js.map