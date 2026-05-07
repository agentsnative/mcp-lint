import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "__tests__";

function collectTests(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTests(filePath));
    } else if (entry.isFile() && filePath.endsWith(".test.ts")) {
      files.push(filePath);
    }
  }

  return files;
}

if (!statSync(root).isDirectory()) {
  console.error(`test root not found: ${root}`);
  process.exit(1);
}

const testFiles = collectTests(root).sort();

if (testFiles.length === 0) {
  console.error(`no test files found under ${root}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", "--import", "tsx", ...testFiles], {
  stdio: "inherit"
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
