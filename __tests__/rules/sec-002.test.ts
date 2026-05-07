import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "sec-002-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-SEC-002", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-SEC-002");
}

test("MCP-SEC-002 reports uncontained file paths and accepts real containment", () => {
  assert.equal(scanFixture("positive").some((finding) => finding.confidence === "medium"), true);
  assert.equal(scanFixture("negative").length, 0);
  assert.equal(scanFixture("synthetic").some((finding) => finding.confidence === "low"), true);
});
