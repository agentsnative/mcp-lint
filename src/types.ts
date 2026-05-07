export type Severity = "critical" | "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";
export type Language = "typescript" | "python";
export type ScanStatus = "evaluated" | "unsupported_language" | "no_supported_runtime_source";
export type ScoreCategory = "scored" | "preview" | "advisory";
export type ScanScope = "runtime" | "all-files";

export type Location = {
  path: string;
  line: number;
  column: number;
};

export type Finding = {
  rule_id: string;
  subtype?: string;
  base_severity: Severity;
  effective_severity: Severity;
  severity: Severity;
  confidence: Confidence;
  location: Location;
  message: string;
  fix_suggestion: string;
  fingerprint: string;
  suppressed: boolean;
  suppression_reason?: string;
  score_impact: number;
  raw_score_impact: number;
  score_category: ScoreCategory;
  score_dedupe_key: string;
  score_applied: boolean;
  tool_name?: string;
  metadata: Record<string, unknown>;
};

export type SourceFile = {
  path: string;
  relativePath: string;
  language: Language;
  content: string;
};

export type ScanConfig = {
  confidence_threshold: Confidence;
  output_dir: string;
  score_mode: "raw" | "effective";
  scan_scope: ScanScope;
  severity_overrides: Record<string, Severity>;
  suppressions: Array<{
    rule_id: string;
    path?: string;
    fingerprint?: string;
    reason: string;
  }>;
};

export type ScanCoverage = {
  status: ScanStatus;
  supported_languages: Language[];
  detected_languages: string[];
  runtime_file_count: number;
  ignored_file_count: number;
  ignored_files_by_reason: Record<string, number>;
};

export type ScanSummary = ScanCoverage & {
  raw_score: number | null;
  effective_score: number | null;
  score_mode: "raw" | "effective";
  finding_count: number;
  visible_finding_count: number;
  scored_finding_count: number;
  preview_finding_count: number;
  advisory_count: number;
  suppression_count: number;
  override_count: number;
  critical_cap_applied: boolean;
  score_cap_applied: boolean;
};

export type ScanResult = {
  schema_version: string;
  tool: string;
  scanned_path: string;
  summary: ScanSummary;
  findings: Finding[];
};

export type RuleContext = {
  root: string;
  file: SourceFile;
};

export type RuleModule = {
  id: string;
  name: string;
  defaultSeverity: Severity;
  defaultConfidence: Confidence;
  phase: "v0-alpha" | "v0.1";
  check(context: RuleContext): Finding[];
};
