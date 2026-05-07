import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { toBadge } from "./reporters/badge.js";
import { toJson } from "./reporters/json.js";
import { toMarkdown } from "./reporters/markdown.js";
import { toSarif } from "./reporters/sarif.js";
import { rules } from "./rules/index.js";
import { lineAt } from "./rules/common.js";
import { applyPresentation, scoreFindings } from "./scoring.js";
import type { Finding, Language, ScanConfig, ScanCoverage, ScanResult, SourceFile } from "./types.js";

type ScanOptions = {
  write?: boolean;
  config?: Partial<ScanConfig>;
};

type RuntimeIgnore = {
  reason: string;
  test(relativePath: string): boolean;
};

type WalkedFile = {
  absolutePath: string;
  relativePath: string;
};

const supportedLanguages: Language[] = ["typescript", "python"];

const hardIgnoredDirs = new Set([".git", "node_modules", "dist", "coverage", ".mcp-lint", ".codex-local", ".context"]);

const runtimeIgnores: RuntimeIgnore[] = [
  { reason: "tests", test: (relativePath) => /(^|\/)(?:test|tests|__tests__|__mocks__)(?:\/|$)/i.test(relativePath) },
  { reason: "fixtures", test: (relativePath) => /(^|\/)(?:fixture|fixtures|__fixtures__)(?:\/|$)/i.test(relativePath) },
  { reason: "scripts", test: (relativePath) => /(^|\/)scripts(?:\/|$)/i.test(relativePath) },
  { reason: "examples", test: (relativePath) => /(^|\/)examples?(?:\/|$)/i.test(relativePath) },
  { reason: "non_runtime_app", test: (relativePath) => /(^|\/)(?:ui|frontend|client|web)(?:\/|$)/i.test(relativePath) },
  { reason: "generated", test: (relativePath) => /(^|\/)(?:generated|__generated__|__snapshots__|__toolsnaps__|snapshots?)(?:\/|$)/i.test(relativePath) },
  { reason: "type_declarations", test: (relativePath) => /\.d\.[cm]?ts$/i.test(relativePath) },
  { reason: "test_files", test: (relativePath) => /(?:^|\/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(relativePath) },
  {
    reason: "build_config",
    test: (relativePath) =>
      /(?:^|\/)[^/]*\.config\.[cm]?[jt]sx?$/i.test(relativePath) ||
      /(?:^|\/)(?:rollup|vite|webpack|esbuild|tsup|jest|vitest|babel|eslint|prettier|tailwind|postcss)\.config\.[cm]?[jt]sx?$/i.test(
        relativePath
      ) ||
      /(?:^|\/)update-readme\.js$/i.test(relativePath)
  }
];

function languageFor(filePath: string): Language | undefined {
  if (/\.d\.[cm]?ts$/i.test(filePath)) return "typescript";
  if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/i.test(filePath)) return "typescript";
  if (/\.py$/i.test(filePath)) return "python";
  return undefined;
}

function detectedLanguageFor(filePath: string): string | undefined {
  if (languageFor(filePath)) return languageFor(filePath);
  if (/\.go$/i.test(filePath)) return "go";
  if (/\.rs$/i.test(filePath)) return "rust";
  if (/\.java$/i.test(filePath)) return "java";
  if (/\.(?:cs|fs|vb)$/i.test(filePath)) return "csharp";
  if (/\.rb$/i.test(filePath)) return "ruby";
  if (/\.php$/i.test(filePath)) return "php";
  if (/\.kt$/i.test(filePath)) return "kotlin";
  if (/\.swift$/i.test(filePath)) return "swift";
  if (/\.(?:c|cc|cpp|cxx|h|hpp)$/i.test(filePath)) return "cpp";
  return undefined;
}

function runtimeIgnoreReason(relativePath: string): string | undefined {
  return runtimeIgnores.find((ignore) => ignore.test(relativePath))?.reason;
}

function walk(root: string, current = root): WalkedFile[] {
  const entries = readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const files: WalkedFile[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (hardIgnoredDirs.has(entry.name)) continue;
      files.push(...walk(root, path.join(current, entry.name)));
    } else if (entry.isFile()) {
      const absolutePath = path.join(current, entry.name);
      files.push({ absolutePath, relativePath: path.relative(root, absolutePath).split(path.sep).join("/") });
    }
  }
  return files;
}

function loadSourceFiles(
  root: string,
  config: ScanConfig
): {
  sourceFiles: SourceFile[];
  coverage: Pick<ScanCoverage, "status" | "supported_languages" | "detected_languages" | "runtime_file_count" | "ignored_file_count" | "ignored_files_by_reason">;
} {
  const walked = walk(root);
  const detected = new Set<string>();
  const ignoredByReason: Record<string, number> = {};
  const sourceFiles: SourceFile[] = [];

  for (const file of walked) {
    const detectedLanguage = detectedLanguageFor(file.relativePath);
    if (detectedLanguage) detected.add(detectedLanguage);
    const language = languageFor(file.relativePath);
    if (!language) continue;
    const ignoredReason = config.scan_scope === "runtime" ? runtimeIgnoreReason(file.relativePath) : undefined;
    if (ignoredReason) {
      ignoredByReason[ignoredReason] = (ignoredByReason[ignoredReason] ?? 0) + 1;
      continue;
    }
    sourceFiles.push({
      path: file.absolutePath,
      relativePath: file.relativePath,
      language,
      content: readFileSync(file.absolutePath, "utf8")
    });
  }

  const detectedLanguages = [...detected].sort();
  const detectedUnsupported = detectedLanguages.some((language) => !supportedLanguages.includes(language as Language));
  const status = sourceFiles.length > 0 ? "evaluated" : detectedUnsupported ? "unsupported_language" : "no_supported_runtime_source";

  return {
    sourceFiles,
    coverage: {
      status,
      supported_languages: supportedLanguages,
      detected_languages: detectedLanguages,
      runtime_file_count: sourceFiles.length,
      ignored_file_count: Object.values(ignoredByReason).reduce((total, count) => total + count, 0),
      ignored_files_by_reason: ignoredByReason
    }
  };
}

function applyInlineSuppressions(findings: Finding[], files: SourceFile[]): Finding[] {
  const byPath = new Map(files.map((file) => [file.relativePath, file.content]));
  return findings.map((finding) => {
    const content = byPath.get(finding.location.path);
    if (!content) return finding;
    const current = lineAt(content, finding.location.line);
    const previous = lineAt(content, finding.location.line - 1);
    const marker = [current, previous].find((line) => line.includes("mcp-lint-disable") && line.includes(finding.rule_id));
    if (!marker) return finding;
    const reason = /--\s*(.+)$/.exec(marker)?.[1]?.trim();
    if (!reason) return finding;
    return { ...finding, suppressed: true, suppression_reason: reason };
  });
}

export function scanPath(targetPath: string, options: ScanOptions = {}): ScanResult {
  const root = path.resolve(targetPath);
  const loaded = loadConfig(root);
  const config: ScanConfig = {
    ...loaded,
    ...options.config,
    severity_overrides: { ...loaded.severity_overrides, ...(options.config?.severity_overrides ?? {}) },
    suppressions: [...loaded.suppressions, ...(options.config?.suppressions ?? [])]
  };
  const { sourceFiles, coverage } = loadSourceFiles(root, config);
  const rawFindings =
    coverage.status === "evaluated" ? sourceFiles.flatMap((file) => rules.flatMap((rule) => rule.check({ root, file }))) : [];
  const suppressed = applyInlineSuppressions(rawFindings, sourceFiles);
  const findings = applyPresentation(suppressed, config).sort((a, b) =>
    `${a.location.path}:${a.location.line}:${a.rule_id}:${a.subtype ?? ""}`.localeCompare(
      `${b.location.path}:${b.location.line}:${b.rule_id}:${b.subtype ?? ""}`
    )
  );
  const summary = scoreFindings(findings, config, coverage);
  const result: ScanResult = {
    schema_version: "0.1.0",
    tool: "mcp-lint",
    scanned_path: ".",
    summary,
    findings
  };

  if (options.write !== false) {
    const outputDir = path.resolve(root, config.output_dir);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, "results.json"), toJson(result));
    writeFileSync(path.join(outputDir, "report.md"), toMarkdown(result));
    writeFileSync(path.join(outputDir, "badge.txt"), toBadge(result));
    writeFileSync(path.join(outputDir, "results.sarif"), toSarif(result));
  }

  return result;
}
