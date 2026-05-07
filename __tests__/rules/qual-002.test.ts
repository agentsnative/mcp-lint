import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "qual-002-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-QUAL-002", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-QUAL-002");
}

test("MCP-QUAL-002 flags destructive tools without meaningful safety metadata", () => {
  assert.equal(scanFixture("positive").some((finding) => finding.metadata.matched_verb === "delete"), true);
  assert.equal(scanFixture("negative").length, 0);
  assert.equal(scanFixture("synthetic").some((finding) => finding.rule_id === "MCP-QUAL-002"), true);
});
