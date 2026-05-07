import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "sec-006-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-SEC-006", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-SEC-006");
}

test("MCP-SEC-006 detects missing Origin validation independently of auth", () => {
  const positive = scanFixture("positive");
  assert.equal(positive.some((finding) => finding.confidence === "high"), true);
  assert.equal(positive.some((finding) => /wildcard CORS/i.test(finding.message)), true);
  assert.equal(positive.some((finding) => finding.location.path.endsWith("handler-only-origin.ts")), true);
  assert.equal(scanFixture("negative").length, 0);
  assert.equal(scanFixture("synthetic").some((finding) => finding.rule_id === "MCP-SEC-006"), true);
});
