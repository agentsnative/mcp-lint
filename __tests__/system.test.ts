import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { toBadge } from "../src/reporters/badge.ts";
import { toMarkdown } from "../src/reporters/markdown.ts";
import { toSarif } from "../src/reporters/sarif.ts";
import { scanPath } from "../src/scan.ts";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const systemFixtureDir = path.join(testDir, "fixtures", "000-system");

function copyFixture(source: string, target: string): void {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyFixture(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

function readGolden(name: string): string {
  return readFileSync(path.join(systemFixtureDir, "golden", name), "utf8");
}

function write(root: string, relativePath: string, content: string): void {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

const mcpHttpRoute = [
  "import express from 'express';",
  "const app = express();",
  "app.post('/mcp', async (req, res) => { res.json({ ok: true }); });"
].join("\n");

test("scan writes required artifacts and matches 000-system goldens", () => {
  const repo = mkdtempSync(path.join(os.tmpdir(), "mcp-lint-system-"));
  copyFixture(path.join(systemFixtureDir, "repo"), repo);

  const result = scanPath(repo);
  assert.equal(result.summary.status, "evaluated");
  assert.equal(result.summary.score_mode, "raw");
  assert.equal(result.scanned_path, ".");
  assert.equal(typeof result.summary.raw_score, "number");
  assert.equal(typeof result.summary.effective_score, "number");
  assert.ok(result.findings.some((finding) => finding.rule_id === "MCP-SEC-003a"));
  for (const file of ["results.json", "report.md", "badge.txt", "results.sarif"]) {
    assert.equal(existsSync(path.join(repo, ".mcp-lint", file)), true, `${file} should be written`);
  }
  assert.equal(readFileSync(path.join(repo, ".mcp-lint", "results.json"), "utf8"), readGolden("results.json"));
  assert.equal(readFileSync(path.join(repo, ".mcp-lint", "report.md"), "utf8"), readGolden("report.md"));
  assert.equal(readFileSync(path.join(repo, ".mcp-lint", "badge.txt"), "utf8"), readGolden("badge.txt"));
  assert.equal(readFileSync(path.join(repo, ".mcp-lint", "results.sarif"), "utf8"), readGolden("results.sarif"));
});

test("default scan scope ignores tests scripts fixtures config d.ts and non-runtime UI", () => {
  const repo = mkdtempSync(path.join(os.tmpdir(), "mcp-lint-scope-"));
  write(repo, "src/server.ts", "export const ok = true;\n");
  write(repo, "tests/server.test.ts", mcpHttpRoute);
  write(repo, "scripts/eval_scenarios/server.ts", mcpHttpRoute);
  write(repo, "fixtures/server.ts", mcpHttpRoute);
  write(repo, "src/types.d.ts", "declare const x: string;\n");
  write(repo, "vite.config.ts", mcpHttpRoute);
  write(repo, "ui/src/App.tsx", mcpHttpRoute);

  const result = scanPath(repo, { write: false });
  assert.equal(result.summary.status, "evaluated");
  assert.equal(result.summary.runtime_file_count, 1);
  assert.equal(result.summary.ignored_file_count, 6);
  assert.equal(result.summary.finding_count, 0);
  assert.equal(result.summary.raw_score, 100);
});

test("test-only supported files are not evaluated", () => {
  const repo = mkdtempSync(path.join(os.tmpdir(), "mcp-lint-test-only-"));
  write(repo, "tests/server.test.ts", mcpHttpRoute);

  const result = scanPath(repo, { write: false });
  assert.equal(result.summary.status, "no_supported_runtime_source");
  assert.equal(result.summary.raw_score, null);
  assert.equal(result.summary.effective_score, null);
  assert.equal(result.summary.ignored_file_count, 1);
  assert.match(toBadge(result), /not evaluated/);
});

test("unsupported Go-only repos are not scored as clean", () => {
  const repo = mkdtempSync(path.join(os.tmpdir(), "mcp-lint-go-"));
  write(repo, "server.go", "package main\nfunc main() {}\n");

  const result = scanPath(repo, { write: false });
  assert.equal(result.summary.status, "unsupported_language");
  assert.equal(result.summary.raw_score, null);
  assert.equal(result.summary.effective_score, null);
  assert.deepEqual(result.summary.detected_languages, ["go"]);
  assert.equal(toBadge(result), "mcp-lint: not evaluated status=unsupported_language detected=go\n");
});

test("unsupported Go repos with non-runtime UI TypeScript are still not evaluated", () => {
  const repo = mkdtempSync(path.join(os.tmpdir(), "mcp-lint-go-ui-"));
  write(repo, "server.go", "package main\nfunc main() {}\n");
  write(repo, "ui/src/App.tsx", "export default function App() { return null; }\n");

  const result = scanPath(repo, { write: false });
  assert.equal(result.summary.status, "unsupported_language");
  assert.equal(result.summary.runtime_file_count, 0);
  assert.equal(result.summary.ignored_file_count, 1);
  assert.equal(result.summary.raw_score, null);
  assert.deepEqual(result.summary.detected_languages, ["go", "typescript"]);
});

test("preview rules do not affect score or SARIF by default", () => {
  const repo = mkdtempSync(path.join(os.tmpdir(), "mcp-lint-preview-"));
  write(repo, "src/server.ts", mcpHttpRoute);

  const result = scanPath(repo, { write: false });
  const sec006 = result.findings.find((finding) => finding.rule_id === "MCP-SEC-006");
  assert.equal(sec006?.score_category, "preview");
  assert.equal(sec006?.score_impact, 0);
  assert.equal(result.summary.preview_finding_count, 1);
  assert.equal(JSON.parse(toSarif(result)).runs[0].results.some((entry: { ruleId: string }) => entry.ruleId === "MCP-SEC-006"), false);
  assert.match(toMarkdown(result), /## Preview Findings/);
});

test("repeated findings are deduped and capped for scoring but preserved in results", () => {
  const repo = mkdtempSync(path.join(os.tmpdir(), "mcp-lint-repeat-"));
  for (let index = 0; index < 10; index += 1) {
    write(repo, `src/server-${index}.ts`, mcpHttpRoute);
  }

  const result = scanPath(repo, { write: false });
  assert.equal(result.findings.filter((finding) => finding.rule_id === "MCP-SEC-003b").length, 10);
  assert.equal(result.findings.filter((finding) => finding.rule_id === "MCP-SEC-006").length, 10);
  assert.equal(result.findings.filter((finding) => finding.rule_id === "MCP-SEC-003b" && finding.score_impact > 0).length, 1);
  assert.equal(result.summary.raw_score, 80);
  assert.equal(result.summary.score_cap_applied, true);
  assert.equal(JSON.parse(toSarif(result)).runs[0].results.length, 1);
});

test("effective score badges disclose suppressions and overrides", () => {
  const repo = mkdtempSync(path.join(os.tmpdir(), "mcp-lint-effective-"));
  copyFixture(path.join(systemFixtureDir, "repo"), repo);
  writeFileSync(
    path.join(repo, "mcp-lint.yml"),
    [
      "score_mode: effective",
      "severity_overrides:",
      "  MCP-SEC-003a: low",
      "suppressions:",
      "  - rule_id: MCP-SEC-003a",
      "    reason: approved documented exception"
    ].join("\n")
  );

  const result = scanPath(repo, { write: false });
  assert.equal(result.summary.raw_score, 80);
  assert.equal(result.summary.effective_score, 100);
  assert.equal(result.summary.suppression_count, 1);
  assert.equal(result.summary.override_count, 1);
  assert.equal(toBadge(result), "mcp-lint: 100/100 effective_score suppressions=1 overrides=1\n");
  assert.match(toMarkdown(result), /Suppression count: 1/);
  assert.match(toMarkdown(result), /Override count: 1/);
});
