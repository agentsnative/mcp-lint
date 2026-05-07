import { changedFilesAgainstBase, matchesAny, pass, printViolations, readYamlFile, type RuleCatalog, type Violation } from "./lib.ts";

const catalog = readYamlFile<RuleCatalog>("policy/rule-catalog.yml");
const changed = changedFilesAgainstBase();
const violations: Violation[] = [];

function changedAny(patterns: string[]): boolean {
  return changed.some((file) => matchesAny(file, patterns));
}

for (const rule of catalog.rules ?? []) {
  const sourcePatterns = rule.source_glob ?? [];
  if (changedAny(sourcePatterns)) {
    if (!changedAny(rule.test_glob ?? [])) {
      violations.push({
        code: "tdd.rule_change_missing_test",
        file: sourcePatterns.join(", "),
        action: `add or update tests for ${rule.id} before changing rule source`
      });
    }
    if (!changedAny(rule.fixture_glob ?? [])) {
      violations.push({
        code: "tdd.rule_change_missing_fixture",
        file: sourcePatterns.join(", "),
        action: `add or update fixtures for ${rule.id} before changing rule source`
      });
    }
  }
}

const reporterSensitive = ["src/reporters/**", "src/scoring.ts", "src/finding*.ts", "src/sarif*.ts", "src/badge*.ts"];
const goldenPatterns = [
  "**/results.json",
  "**/report.md",
  "**/results.sarif",
  "**/badge.txt",
  "**/*.snap",
  "**/__snapshots__/**",
  "__tests__/golden/**"
];

if (changedAny(reporterSensitive) && !changedAny(goldenPatterns)) {
  violations.push({
    code: "tdd.reporter_change_missing_golden",
    file: reporterSensitive.join(", "),
    action: "add or update golden output before changing reporter, scoring, SARIF, or badge behavior"
  });
}

if (violations.length > 0) {
  printViolations("tdd", violations);
  process.exit(1);
}

pass(`TDD diff gate checked ${changed.length} changed files`);
