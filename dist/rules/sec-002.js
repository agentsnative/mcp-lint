import { extractToolName, firstMatch, hasToolRegistration, makeFinding } from "./common.js";
function hasContainment(content) {
    return /(?:path\.resolve|realpath|resolve\(\))[\s\S]{0,180}(?:startsWith|is_relative_to|commonpath)|(?:commonpath|is_relative_to)\s*\(/i.test(content);
}
export const sec002 = {
    id: "MCP-SEC-002",
    name: "Path Traversal in File Tools",
    defaultSeverity: "high",
    defaultConfidence: "medium",
    phase: "v0.1",
    check(context) {
        const content = context.file.content;
        if (!hasToolRegistration(content))
            return [];
        if (hasContainment(content))
            return [];
        const sink = firstMatch(content, [
            /\bfs(?:\.promises)?\.(?:readFile|writeFile|unlink|rm|createReadStream|createWriteStream)\s*\(\s*(?:input\.|args\.|params\.)?(path|file|filename|target)\b/i,
            /\bopen\s*\(\s*(?:input\.|args\.|params\.)?(path|file|filename|target)\b/i,
            /\bPath\s*\(\s*(?:input\.|args\.|params\.)?(path|file|filename|target)\b[\s\S]{0,80}\.(?:read_text|write_text|unlink)\s*\(/i
        ]);
        if (!sink)
            return [];
        const plausibleHelper = /(?:validatePath|sanitizePath|normalizePath|checkPath)\s*\(/i.test(content);
        return [
            makeFinding(context, {
                ruleId: "MCP-SEC-002",
                baseSeverity: "high",
                confidence: plausibleHelper ? "low" : "medium",
                index: sink.index,
                excerpt: sink.match[0],
                toolName: extractToolName(content, sink.index),
                message: "Path-like tool input reaches a file API without visible containment under an approved root.",
                fix: "Resolve against an allowed root and reject paths outside that root using realpath/commonpath or an equivalent helper that gates execution.",
                metadata: {
                    path_param_name: sink.match[1] ?? "path",
                    limitation: "Symlink behavior depends on repository and filesystem state and is not dynamically verified."
                }
            })
        ];
    }
};
//# sourceMappingURL=sec-002.js.map