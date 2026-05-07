import { findForbiddenContent, matchesAny, pass, printViolations, readYamlFile, repoFiles, type Violation } from "./lib.ts";

type PublicSurfacePolicy = {
  public_allowed: string[];
  public_blocked: string[];
};

const showMatches = process.argv.includes("--show-matches");
const policy = readYamlFile<PublicSurfacePolicy>("policy/public-surface.yml");
const files = repoFiles();
const violations: Violation[] = [];

for (const file of files) {
  if (matchesAny(file, policy.public_blocked ?? [])) {
    violations.push({
      code: "public_surface.blocked_path",
      file,
      action: "move this private or generated artifact out of the public repo"
    });
  }

  if (!matchesAny(file, policy.public_allowed ?? [])) {
    violations.push({
      code: "public_surface.unexpected_path",
      file,
      action: "add a public allowlist entry only if this artifact is safe and intentional"
    });
  }
}

const contentScanFiles = files.filter(
  (file) => !matchesAny(file, ["policy/**", "scripts/**", ".gitignore", "__tests__/**/__fixtures__/**"])
);
violations.push(...findForbiddenContent(contentScanFiles, "policy/forbidden-patterns.yml", { showMatches }));

if (violations.length > 0) {
  printViolations("public surface", violations, showMatches);
  process.exit(1);
}

pass(`public surface checked ${files.length} files`);
