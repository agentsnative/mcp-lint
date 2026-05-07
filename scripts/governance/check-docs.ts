import { findForbiddenContent, pass, pathExists, printViolations, readYamlFile, type Violation } from "./lib.ts";

type RequiredArtifacts = {
  required_files: string[];
  required_rule_docs: string[];
};

const required = readYamlFile<RequiredArtifacts>("policy/required-artifacts.yml");
const requiredFiles = [...(required.required_files ?? []), ...(required.required_rule_docs ?? [])];
const violations: Violation[] = [];

for (const file of requiredFiles) {
  if (!pathExists(file)) {
    violations.push({
      code: "docs.missing_required_artifact",
      file,
      action: "add a real public-safe artifact, not placeholder text"
    });
  }
}

violations.push(
  ...findForbiddenContent(
    requiredFiles.filter((file) => pathExists(file)),
    "policy/forbidden-patterns.yml"
  )
);

if (violations.length > 0) {
  printViolations("docs", violations);
  process.exit(1);
}

pass(`docs checked ${requiredFiles.length} required artifacts`);
