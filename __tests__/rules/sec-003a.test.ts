import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "sec-003a-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-SEC-003a", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-SEC-003a");
}

test("MCP-SEC-003a flags non-loopback binds and downgrades dynamic hosts", () => {
  const positive = scanFixture("positive");
  assert.equal(positive.some((finding) => finding.confidence === "high" && String(finding.metadata.bind_expression).includes("0.0.0.0")), true);
  assert.equal(positive.some((finding) => finding.confidence === "high" && String(finding.metadata.bind_expression).includes("::")), true);
  assert.equal(positive.some((finding) => finding.confidence === "high" && finding.message.includes("omits host")), true);
  assert.equal(positive.some((finding) => finding.confidence === "high" && String(finding.metadata.bind_expression).includes('""')), true);
  assert.equal(scanFixture("negative").length, 0);
  assert.equal(scanFixture("synthetic").some((finding) => finding.confidence === "medium"), true);
});
