import assert from "node:assert/strict";
import { cpSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { scanPath } from "../../src/scan.ts";

function scanFixture(kind: string) {
  const repo = path.join(mkdtempSync(path.join(os.tmpdir(), "qual-001-")), "repo");
  cpSync(path.resolve("__tests__/fixtures/MCP-QUAL-001", kind), repo, { recursive: true });
  return scanPath(repo, { write: false }).findings.filter((finding) => finding.rule_id === "MCP-QUAL-001");
}

test("MCP-QUAL-001 reports hard schema defects and skips well-typed URL schemas", () => {
  const positive = scanFixture("positive");
  assert.equal(positive.some((finding) => finding.subtype === "missing_schema"), true);
  assert.equal(positive.some((finding) => finding.subtype === "unconstrained_object"), true);
  assert.equal(positive.some((finding) => finding.subtype === "no_required"), true);
  assert.equal(positive.some((finding) => finding.subtype === "url_as_string"), true);
  assert.equal(scanFixture("negative").length, 0);
  const synthetic = scanFixture("synthetic");
  assert.equal(
    synthetic.some(
      (finding) =>
        finding.subtype === "parameterless_tool_accepts_any_object" &&
        finding.base_severity === "medium" &&
        finding.confidence === "medium"
    ),
    true
  );
  assert.equal(synthetic.some((finding) => finding.subtype === "unconstrained_object"), false);
});
