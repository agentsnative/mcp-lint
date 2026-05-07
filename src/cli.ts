#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { rules } from "./rules/index.js";
import { scanPath } from "./scan.js";
import type { ScanScope } from "./types.js";

function usage(): string {
  return [
    "Usage:",
    "  mcp-lint scan <path> [--all-files]",
    "  mcp-lint rules",
    "",
    "MCP-Lint performs deterministic static analysis for TypeScript and Python MCP server repositories.",
    "Unsupported languages and repositories with no supported runtime source are reported as not evaluated."
  ].join("\n");
}

export function main(argv = process.argv.slice(2)): number {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    console.log(usage());
    return command ? 0 : 1;
  }
  if (command === "rules") {
    for (const rule of rules) {
      console.log(`${rule.id}\t${rule.defaultSeverity}\t${rule.defaultConfidence}\t${rule.phase}\t${rule.name}`);
    }
    return 0;
  }
  if (command !== "scan") {
    console.error(`Unknown command: ${command}`);
    console.error(usage());
    return 1;
  }
  const target = rest.find((arg) => !arg.startsWith("--")) ?? ".";
  const scanScope: ScanScope = rest.includes("--all-files") ? "all-files" : "runtime";
  const result = scanPath(target, { config: { scan_scope: scanScope } });
  const raw = result.summary.raw_score === null ? "not_evaluated" : String(result.summary.raw_score);
  const effective = result.summary.effective_score === null ? "not_evaluated" : String(result.summary.effective_score);
  console.log(`MCP-Lint status=${result.summary.status} raw_score=${raw} effective_score=${effective}`);
  console.log(`Findings: ${result.summary.finding_count}; artifacts written to ${target.replace(/\/$/, "")}/.mcp-lint`);
  const selectedScore = result.summary.score_mode === "effective" ? result.summary.effective_score : result.summary.raw_score;
  return selectedScore !== null && selectedScore <= 50 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = main();
}
