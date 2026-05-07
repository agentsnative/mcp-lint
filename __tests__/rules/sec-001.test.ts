import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "sec-001-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-SEC-001", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-SEC-001");
}

test("MCP-SEC-001 detects execution in tool handlers and respects operator gates", () => {
  const positive = scanFixture("positive");
  assert.equal(positive.some((finding) => finding.subtype === "shell_exec" && finding.base_severity === "critical"), true);
  assert.equal(positive.some((finding) => finding.subtype === "language_eval" && finding.base_severity === "critical"), true);
  assert.equal(positive.some((finding) => finding.tool_name === "run_helper" && finding.subtype === "shell_exec"), true);
  assert.equal(scanFixture("negative").length, 0);
  assert.equal(scanFixture("synthetic").some((finding) => finding.confidence === "medium"), true);
});
