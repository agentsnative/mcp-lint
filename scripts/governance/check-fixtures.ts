import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isDirectory, pass, pathExists, printViolations, readYamlFile, type RuleCatalog, type Violation } from "./lib.ts";

const catalog = readYamlFile<RuleCatalog>("policy/rule-catalog.yml");
const violations: Violation[] = [];
const fixtureKinds = ["positive", "negative", "synthetic", "real"];

for (const rule of catalog.rules ?? []) {
  const base = path.join("__tests__/fixtures", rule.id);
  for (const kind of fixtureKinds) {
    const dir = path.join(base, kind);
    if (!isDirectory(dir)) {
      violations.push({
        code: "fixtures.missing_fixture_directory",
        file: dir,
        action: "add the fixture directory before implementing rule behavior"
      });
    }
  }

  const realDir = path.join(base, "real");
  if (!isDirectory(realDir)) continue;
  const entries = readdirSync(realDir).filter((entry) => ![".gitkeep", "SOURCE.md"].includes(entry));
  if (entries.length === 0) continue;

  const sourceFile = path.join(realDir, "SOURCE.md");
  if (!pathExists(sourceFile)) {
    violations.push({
      code: "fixtures.missing_real_fixture_source",
      file: sourceFile,
      action: "move this fixture to private storage or add complete provenance"
    });
    continue;
  }

  const source = readFileSync(sourceFile, "utf8").toLowerCase();
  for (const field of [
    "source",
    "commit",
    "file",
    "lines",
    "license",
    "disclosure_status",
    "fixture_purpose",
    "maintainer_dispute_status"
  ]) {
    if (!source.includes(field)) {
      violations.push({
        code: "fixtures.incomplete_real_fixture_source",
        file: sourceFile,
        action: `add ${field} provenance`
      });
    }
  }

  if (rule.id.startsWith("MCP-SEC-")) {
    const disclosureMatch = /^disclosure_status:\s*(fixed|timeline_expired|not-applicable)\s*$/im.exec(source);
    if (!disclosureMatch) {
      violations.push({
        code: "fixtures.invalid_security_disclosure_status",
        file: sourceFile,
        action: "move this fixture to private workspace or rewrite as synthetic"
      });
    }
  }
}

if (violations.length > 0) {
  printViolations("fixtures", violations);
  process.exit(1);
}

pass(`fixture directories checked for ${catalog.rules.length} rules`);
