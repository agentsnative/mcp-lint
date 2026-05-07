import { execFileSync } from "node:child_process";
import { matchesAny, pass, pathExists, printViolations, repoFiles, type Violation } from "./lib.ts";

const files = repoFiles();
const violations: Violation[] = [];

for (const file of files) {
  if (
    matchesAny(file, [
      "**/plan.md",
      "**/tasks.md",
      "**/research.md",
      "**/data-model.md",
      "**/quickstart.md",
      "**/contracts/**",
      "**/.speckit-private/**"
    ])
  ) {
    violations.push({
      code: "speckit_artifacts.generated_private_artifact",
      file,
      action: "move generated SpecKit implementation artifacts to private storage"
    });
  }
}

for (const required of [".specify/memory/constitution.md", "specs/000-system/spec.md"]) {
  if (!pathExists(required)) {
    violations.push({
      code: "speckit_artifacts.missing_required_public_artifact",
      file: required,
      action: "add the scrubbed public artifact before committing"
    });
  }
}

if (violations.length > 0) {
  printViolations("speckit artifact policy", violations);
  process.exit(1);
}

try {
  execFileSync("pnpm", ["exec", "tsx", "scripts/specs/validate-public-specs.ts", "specs"], {
    stdio: "inherit"
  });
} catch {
  process.exit(1);
}

pass("speckit artifact policy checked");
