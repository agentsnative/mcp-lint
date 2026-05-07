import { spawnSync } from "node:child_process";

const checks = [
  ["public surface", ["tsx", "scripts/governance/check-public-surface.ts"]],
  ["speckit artifact policy", ["tsx", "scripts/governance/check-speckit-artifacts.ts"]],
  ["public spec validation", ["tsx", "scripts/specs/validate-public-specs.ts", "specs"]],
  ["docs", ["tsx", "scripts/governance/check-docs.ts"]],
  ["fixtures", ["tsx", "scripts/governance/check-fixtures.ts"]],
  ["TDD diff gate", ["tsx", "scripts/governance/check-tdd.ts"]],
  ["npm pack gate", ["tsx", "scripts/governance/check-npm-pack.ts"]]
] as const;

const results: Array<{ name: string; status: number }> = [];

for (const [name, command] of checks) {
  console.log(`\n== ${name} ==`);
  const result = spawnSync("pnpm", ["exec", ...command], {
    stdio: "inherit",
    shell: false
  });
  results.push({ name, status: result.status ?? 1 });
}

console.log("\nGovernance summary:");
for (const result of results) {
  console.log(`- ${result.name}: ${result.status === 0 ? "PASS" : "FAIL"}`);
}

if (results.some((result) => result.status !== 0)) {
  process.exit(1);
}
