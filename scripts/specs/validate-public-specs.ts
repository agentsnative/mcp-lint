import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  findForbiddenContent,
  matchesAny,
  pass,
  printViolations,
  readYamlFile,
  repoFiles,
  type RuleCatalog,
  type Violation
} from "../governance/lib.ts";

type Args = {
  specsDir: string;
  catalog: string;
  forbidden: string;
  strict: boolean;
};

type Metadata = Record<string, string>;

function takeValue(argv: string[], index: number, flag: string): [string, number] {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`missing value for ${flag}`);
  return [value, index + 1];
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    specsDir: "specs",
    catalog: "policy/rule-catalog.yml",
    forbidden: "policy/forbidden-patterns.yml",
    strict: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--catalog") [args.catalog, i] = takeValue(argv, i, arg);
    else if (arg === "--forbidden") [args.forbidden, i] = takeValue(argv, i, arg);
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--no-strict") args.strict = false;
    else if (!arg.startsWith("--")) args.specsDir = arg;
    else throw new Error(`unknown argument: ${arg}`);
  }

  return args;
}

function requireIncludes(content: string, keywords: string[], file: string, violations: Violation[]): void {
  const normalized = content.toLowerCase();
  for (const keyword of keywords) {
    if (!normalized.includes(keyword.toLowerCase())) {
      violations.push({
        code: "public_specs.missing_contract_section",
        file,
        action: `add public-safe coverage for "${keyword}"`
      });
    }
  }
}

function resolveCatalogSpecPath(specsDir: string, catalogSpec: string): string {
  const relativeFromSpecs = path.relative("specs", catalogSpec);
  return path.join(specsDir, relativeFromSpecs);
}

function parseMetadata(content: string): Metadata {
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (frontmatter) {
    const parsed = YAML.parse(frontmatter[1]) as Record<string, unknown> | undefined;
    return Object.fromEntries(Object.entries(parsed ?? {}).map(([key, value]) => [key, String(value).trim()]));
  }

  // Backward-compatible fallback for existing public specs without frontmatter.
  const metadata: Metadata = {};
  for (const key of ["rule_id", "severity", "confidence", "phase"]) {
    const match = content.match(new RegExp(`^${key}:\\s*["']?([^"'\\n#]+)["']?\\s*$`, "im"));
    if (match?.[1]) metadata[key] = match[1].trim();
  }
  return metadata;
}

function normalize(filePath: string): string {
  return path.normalize(filePath);
}

let args: Args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const violations: Violation[] = [];
if (!existsSync(args.catalog)) {
  violations.push({ code: "public_specs.missing_catalog", file: args.catalog, action: "add policy/rule-catalog.yml" });
}
if (!existsSync(args.forbidden)) {
  violations.push({ code: "public_specs.missing_forbidden_policy", file: args.forbidden, action: "add policy/forbidden-patterns.yml" });
}
if (violations.length > 0) {
  printViolations("public specs", violations);
  process.exit(1);
}

const catalog = readYamlFile<RuleCatalog>(args.catalog);
if (!catalog.rules || catalog.rules.length === 0) {
  violations.push({ code: "public_specs.empty_catalog", file: args.catalog, action: "add the public rule catalog entries before validating specs" });
}

if (!existsSync(args.specsDir)) {
  violations.push({
    code: "public_specs.missing_specs_dir",
    file: args.specsDir,
    action: "create public-safe specs or run the rewrite pipeline from private inputs"
  });
} else {
  const generatedArtifactFiles = repoFiles().filter((file) =>
    matchesAny(file, [
      `${args.specsDir}/**/plan.md`,
      `${args.specsDir}/**/tasks.md`,
      `${args.specsDir}/**/research.md`,
      `${args.specsDir}/**/data-model.md`,
      `${args.specsDir}/**/quickstart.md`,
      `${args.specsDir}/**/contracts/**`
    ])
  );
  for (const file of generatedArtifactFiles) {
    violations.push({
      code: "public_specs.generated_speckit_artifact",
      file,
      action: "move generated implementation artifacts to private storage"
    });
  }

  const specFiles = repoFiles().filter((file) => matchesAny(file, [`${args.specsDir}/**/spec.md`])).map(normalize);
  violations.push(...findForbiddenContent(specFiles, args.forbidden));

  const expectedSpecs = new Set<string>([
    normalize(path.join(args.specsDir, "000-system/spec.md")),
    ...((catalog.rules ?? []).map((rule) => normalize(resolveCatalogSpecPath(args.specsDir, rule.spec))))
  ]);

  if (args.strict) {
    for (const file of specFiles) {
      if (!expectedSpecs.has(file)) {
        violations.push({
          code: "public_specs.extra_spec",
          file,
          action: "remove stale/unexpected spec.md or add it to policy/rule-catalog.yml"
        });
      }
    }
  }

  const systemSpec = path.join(args.specsDir, "000-system/spec.md");
  if (!existsSync(systemSpec)) {
    violations.push({
      code: "public_specs.missing_system_spec",
      file: systemSpec,
      action: "add a public-safe system spec"
    });
  } else {
    const content = readFileSync(systemSpec, "utf8");
    requireIncludes(
      content,
      [
        "CLI Shape",
        "Inputs",
        "Config",
        "Outputs",
        "Scoring",
        "Confidence Tiers",
        "Distribution",
        "Out-of-Scope",
        "Acceptance Criteria",
        "v0-alpha",
        "v0.1",
        "v1",
        "raw_score",
        "effective_score",
        "public badge",
        "suppression_count",
        "override_count",
        "HIGH-confidence-only default",
        "public/private artifact boundary"
      ],
      systemSpec,
      violations
    );
  }

  for (const rule of catalog.rules ?? []) {
    const specPath = resolveCatalogSpecPath(args.specsDir, rule.spec);
    if (!existsSync(specPath)) {
      violations.push({
        code: "public_specs.missing_rule_spec",
        file: specPath,
        action: `add public-safe spec for ${rule.id}`
      });
      continue;
    }

    const content = readFileSync(specPath, "utf8");
    const expectedPrefix = String(rule.build_order).padStart(3, "0");
    const specDir = path.basename(path.dirname(specPath));
    if (!specDir.startsWith(expectedPrefix)) {
      violations.push({
        code: "public_specs.build_order_mismatch",
        file: specPath,
        action: `spec directory should start with ${expectedPrefix}`
      });
    }

    const metadata = parseMetadata(content);
    if (metadata.rule_id !== rule.id) {
      violations.push({
        code: "public_specs.rule_id_mismatch",
        file: specPath,
        action: `include metadata/frontmatter: rule_id: ${rule.id}`
      });
    }
    if (metadata.severity !== rule.severity) {
      violations.push({
        code: "public_specs.severity_mismatch",
        file: specPath,
        action: `include metadata/frontmatter: severity: ${rule.severity}`
      });
    }
    if (metadata.confidence !== rule.confidence) {
      violations.push({
        code: "public_specs.confidence_mismatch",
        file: specPath,
        action: `include metadata/frontmatter: confidence: ${rule.confidence}`
      });
    }

    requireIncludes(
      content,
      [
        "Rule Intent",
        "User Scenario",
        "Functional Requirements",
        "Safe Patterns",
        "Finding Shape",
        "Edge Cases",
        "Fixture Expectations",
        "Acceptance Criteria",
        "Success Criteria"
      ],
      specPath,
      violations
    );
  }
}

if (violations.length > 0) {
  printViolations("public specs", violations);
  process.exit(1);
}

pass(`public specs validated for system spec and ${catalog.rules?.length ?? 0} rules`);
