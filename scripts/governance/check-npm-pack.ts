import { matchesAny, pass, printViolations, type Violation } from "./lib.ts";
import { execFileSync } from "node:child_process";

const violations: Violation[] = [];

let raw = "";
try {
  raw = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
} catch (error) {
  const err = error as { stdout?: Buffer | string; stderr?: Buffer | string };
  console.error(String(err.stdout ?? "") + String(err.stderr ?? ""));
  process.exit(1);
}

const jsonStart = raw.indexOf("[");
const packs = JSON.parse(raw.slice(jsonStart)) as Array<{ files: Array<{ path: string }> }>;
const packageFiles = packs.flatMap((pack) => pack.files.map((file) => file.path));

const blockedPatterns = [
  "specs/**",
  ".specify/**",
  "__tests__/**",
  "policy/**",
  "scripts/**",
  "**/plan.md",
  "**/tasks.md",
  "**/research.md",
  "**/data-model.md",
  "**/quickstart.md",
  "**/contracts/**",
  "**/*requirements*prompt*.md",
  "**/*governance-prompt*.md",
  "**/private-strategy/**"
];

const allowedPatterns = ["dist/**", "bin/**", "action.yml", "README.md", "LICENSE", "NOTICE", "SECURITY.md", "package.json"];

for (const file of packageFiles) {
  if (matchesAny(file, blockedPatterns)) {
    violations.push({
      code: "npm_pack.blocked_artifact",
      file,
      action: "remove private, governance, test, or spec artifacts from npm package files"
    });
  }
  if (!matchesAny(file, allowedPatterns)) {
    violations.push({
      code: "npm_pack.unexpected_artifact",
      file,
      action: "add only runtime/package artifacts to the npm files allowlist"
    });
  }
}

if (violations.length > 0) {
  printViolations("npm pack", violations);
  process.exit(1);
}

pass(`npm pack dry-run checked ${packageFiles.length} files`);
