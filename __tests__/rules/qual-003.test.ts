import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "qual-003-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-QUAL-003", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-QUAL-003");
}

test("MCP-QUAL-003 emits advisory zero-score description findings", () => {
  const positive = scanFixture("positive");
  assert.equal(positive.some((finding) => finding.subtype === "missing_description"), true);
  assert.equal(positive.every((finding) => finding.score_impact === 0 && finding.raw_score_impact === 0), true);
  assert.equal(scanFixture("negative").length, 0);
  assert.equal(scanFixture("synthetic").some((finding) => finding.subtype === "description_too_short"), true);
});
