import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "sec-004-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-SEC-004", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-SEC-004");
}

test("MCP-SEC-004 reports secret hygiene issues without exposing raw secret values", () => {
  const positive = scanFixture("positive");
  assert.equal(positive.some((finding) => finding.subtype === "direct_env_logging"), true);
  assert.equal(positive.some((finding) => finding.subtype === "provider_pattern_hardcoded_secret"), true);
  assert.equal(JSON.stringify(positive).includes("API_TOKEN"), false);
  assert.equal(JSON.stringify(positive).includes("sk-dummy1"), false);
  assert.equal(scanFixture("negative").length, 0);
  assert.equal(scanFixture("synthetic").some((finding) => finding.subtype === "query_param_secret"), true);
});
