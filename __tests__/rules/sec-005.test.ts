import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "sec-005-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-SEC-005", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-SEC-005");
}

test("MCP-SEC-005 detects user URL fetches and downgrades incomplete denylist guards", () => {
  assert.equal(scanFixture("positive").some((finding) => finding.confidence === "high"), true);
  assert.equal(scanFixture("negative").length, 0);
  assert.equal(scanFixture("synthetic").some((finding) => finding.subtype === "incomplete_ssrf_guard" && finding.confidence === "medium"), true);
  const suppressed = scanFixture("suppressed");
  assert.equal(suppressed.some((finding) => finding.suppressed && finding.suppression_reason?.includes("vendor relay")), true);
});
