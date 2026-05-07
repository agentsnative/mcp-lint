import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { minimatch } from "minimatch";
import YAML from "yaml";

export type RuleCatalogEntry = {
  id: string;
  name?: string;
  severity: string;
  confidence: string;
  build_order: number;
  spec: string;
  source_glob?: string[];
  test_glob?: string[];
  fixture_glob?: string[];
};

export type RuleCatalog = {
  rules: RuleCatalogEntry[];
};

export type ForbiddenPattern = {
  name: string;
  pattern: string;
  severity?: string;
  remediation?: string;
};

export type ForbiddenPolicy = {
  forbidden_patterns: ForbiddenPattern[];
};

export type Violation = {
  code: string;
  file: string;
  line?: number;
  action: string;
  match?: string;
};

export function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function readYamlFile<T>(filePath: string): T {
  const raw = readFileSync(filePath, "utf8");
  return YAML.parse(raw) as T;
}

export function pathExists(filePath: string): boolean {
  return existsSync(filePath);
}

export function isDirectory(filePath: string): boolean {
  return existsSync(filePath) && statSync(filePath).isDirectory();
}

export function repoFiles(): string[] {
  try {
    const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return out
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(normalizePath)
      .sort();
  } catch {
    return walkFiles(process.cwd()).map((file) => normalizePath(path.relative(process.cwd(), file))).sort();
  }
}

export function walkFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const entries = readdirSync(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

export function matchesAny(filePath: string, patterns: string[]): boolean {
  const normalized = normalizePath(filePath);
  return patterns.some((pattern) =>
    minimatch(normalized, pattern, {
      dot: true,
      nocase: false,
      nonegate: true
    })
  );
}

export function isTextFile(filePath: string): boolean {
  const base = path.basename(filePath);
  if (base === ".gitignore" || base === "package.json" || base.endsWith(".yml") || base.endsWith(".yaml")) {
    return true;
  }
  return [
    ".md",
    ".txt",
    ".json",
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".cjs",
    ".html",
    ".css",
    ".sh",
    ".toml"
  ].includes(path.extname(filePath));
}

export function readTextFile(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

export function findForbiddenContent(
  files: string[],
  policyPath = "policy/forbidden-patterns.yml",
  options: { showMatches?: boolean } = {}
): Violation[] {
  const policy = readYamlFile<ForbiddenPolicy>(policyPath);
  const violations: Violation[] = [];

  for (const file of files) {
    if (!isTextFile(file) || !existsSync(file)) continue;
    const lines = readTextFile(file).split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      for (const rule of policy.forbidden_patterns ?? []) {
        const regex = new RegExp(rule.pattern, "i");
        const match = regex.exec(lines[i]);
        if (!match) continue;
        violations.push({
          code: `forbidden_content_patterns.${rule.name}`,
          file,
          line: i + 1,
          action: rule.remediation ?? "remove private or unsafe content before committing",
          match: options.showMatches ? match[0] : undefined
        });
      }
    }
  }

  return violations;
}

export function printViolations(title: string, violations: Violation[], showMatches = false): void {
  if (violations.length === 0) return;
  console.error(`FAIL ${title}`);
  for (const violation of violations) {
    console.error(`- ${violation.code}`);
    console.error(`  File: ${violation.file}${violation.line ? `:${violation.line}` : ""}`);
    console.error(`  Action: ${violation.action}`);
    if (showMatches && violation.match) {
      console.error(`  Match: ${violation.match}`);
    }
  }
}

export function pass(message: string): void {
  console.log(`PASS ${message}`);
}

export function fail(message: string, violations: Violation[] = []): never {
  if (violations.length > 0) {
    printViolations(message, violations);
  } else {
    console.error(`FAIL ${message}`);
  }
  process.exit(1);
}

export function changedFilesAgainstBase(): string[] {
  const files = new Set<string>();
  const commands: string[][] = [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"]
  ];

  for (const args of commands) {
    try {
      const out = execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      for (const line of out.split("\n")) {
        const trimmed = line.trim();
        if (trimmed) files.add(normalizePath(trimmed));
      }
    } catch {
      // Fallback commands are best effort. A missing base ref should not hide
      // working-tree changes discovered by later commands.
    }
  }

  return [...files].sort();
}

export function countRegex(content: string, regex: RegExp): number {
  return [...content.matchAll(regex)].length;
}

export function execCommand(command: string, args: string[]): { ok: boolean; output: string } {
  try {
    const output = execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return { ok: true, output };
  } catch (error) {
    const err = error as { stdout?: Buffer | string; stderr?: Buffer | string };
    const stdout = err.stdout ? String(err.stdout) : "";
    const stderr = err.stderr ? String(err.stderr) : "";
    return { ok: false, output: `${stdout}${stderr}` };
  }
}
