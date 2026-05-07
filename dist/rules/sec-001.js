import { extractToolName, hasToolRegistration, makeFinding } from "./common.js";
function hasOperatorGate(content) {
    return /(?:ENABLE_(?:SHELL|EXEC|EVAL)|ALLOW_(?:SHELL|EXEC|EVAL))[\s\S]{0,120}(?:!==?\s*["'`]true["'`]|===?\s*["'`]true["'`])|allowedCommands?\.includes|requireOperatorApproval|operatorApproved|hostApproval|outOfBandApproval/i.test(content);
}
const dangerousPatterns = [
    /(?:child_process\.)?(?:exec|execSync)\s*\(([^)]*)\)/gi,
    /spawn(?:Sync)?\s*\([^)]*shell\s*:\s*true[^)]*\)/gi,
    /(?:os\.system|os\.popen|subprocess\.[A-Za-z_]+)\s*\([^)]*shell\s*=\s*True[^)]*\)/gi,
    /\beval\s*\(([^)]*)\)/gi,
    /new\s+Function\s*\(/gi,
    /\bvm\.[A-Za-z_]+\s*\(/gi,
    /\bpickle\.loads\s*\(/gi,
    /\bexec\s*\(([^)]*)\)/gi,
    /\bcompile\s*\([^)]*\)[\s\S]{0,80}\bexec\s*\(/gi,
    /\bpage\.evaluate\s*\(/gi
];
function findMatchingDelimiter(content, openIndex, open, close) {
    let depth = 0;
    let quote;
    for (let index = openIndex; index < content.length; index += 1) {
        const current = content[index];
        const next = content[index + 1];
        if (quote) {
            if (current === "\\") {
                index += 1;
                continue;
            }
            if (current === quote)
                quote = undefined;
            continue;
        }
        if (current === "/" && next === "/") {
            const end = content.indexOf("\n", index + 2);
            if (end === -1)
                return -1;
            index = end;
            continue;
        }
        if (current === "/" && next === "*") {
            const end = content.indexOf("*/", index + 2);
            if (end === -1)
                return -1;
            index = end + 1;
            continue;
        }
        if (current === '"' || current === "'" || current === "`") {
            quote = current;
            continue;
        }
        if (current === open)
            depth += 1;
        if (current === close) {
            depth -= 1;
            if (depth === 0)
                return index;
        }
    }
    return -1;
}
function pythonBlockEnd(content, start) {
    const lineStart = content.lastIndexOf("\n", start) + 1;
    const indent = /^\s*/.exec(content.slice(lineStart))?.[0].length ?? 0;
    const rest = content.slice(start);
    const lines = rest.split(/\r?\n/);
    let offset = 0;
    for (let index = 1; index < lines.length; index += 1) {
        offset += lines[index - 1].length + 1;
        const line = lines[index];
        if (!line.trim())
            continue;
        const currentIndent = /^\s*/.exec(line)?.[0].length ?? 0;
        if (currentIndent <= indent)
            return start + offset;
    }
    return content.length;
}
function findToolSpans(content) {
    const spans = [];
    const callPattern = /(?:server|mcp|app)\.(?:tool|registerTool)\s*\(|registerTool\s*\(/gi;
    for (const match of content.matchAll(callPattern)) {
        const openIndex = content.indexOf("(", match.index);
        const closeIndex = findMatchingDelimiter(content, openIndex, "(", ")");
        if (closeIndex === -1)
            continue;
        spans.push({ start: match.index, end: closeIndex + 1, text: content.slice(match.index, closeIndex + 1) });
    }
    const decoratorPattern = /@(?:mcp|server)\.tool\s*\([^)]*\)\s*\n\s*(?:async\s+)?def\s+[A-Za-z_]\w*\s*\([^)]*\)\s*:/gi;
    for (const match of content.matchAll(decoratorPattern)) {
        const end = pythonBlockEnd(content, match.index);
        spans.push({ start: match.index, end, text: content.slice(match.index, end) });
    }
    return spans.sort((a, b) => a.start - b.start);
}
function findHelperSpans(content) {
    const helpers = [];
    const functionPattern = /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
    for (const match of content.matchAll(functionPattern)) {
        const openIndex = content.indexOf("{", match.index);
        const closeIndex = findMatchingDelimiter(content, openIndex, "{", "}");
        if (closeIndex === -1)
            continue;
        helpers.push({ name: match[1], start: match.index, end: closeIndex + 1, text: content.slice(match.index, closeIndex + 1) });
    }
    const arrowPattern = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/g;
    for (const match of content.matchAll(arrowPattern)) {
        const openIndex = content.indexOf("{", match.index);
        const closeIndex = findMatchingDelimiter(content, openIndex, "{", "}");
        if (closeIndex === -1)
            continue;
        helpers.push({ name: match[1], start: match.index, end: closeIndex + 1, text: content.slice(match.index, closeIndex + 1) });
    }
    const pythonPattern = /^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*:/gm;
    for (const match of content.matchAll(pythonPattern)) {
        const end = pythonBlockEnd(content, match.index);
        helpers.push({ name: match[1], start: match.index, end, text: content.slice(match.index, end) });
    }
    return helpers.sort((a, b) => a.start - b.start);
}
function firstDangerous(content) {
    let best;
    for (const pattern of dangerousPatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(content);
        if (!match)
            continue;
        if (!best || match.index < best.index)
            best = { index: match.index, match };
    }
    return best;
}
function callToHelper(content, helperName) {
    const pattern = new RegExp(`\\b${helperName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(`, "i");
    const match = pattern.exec(content);
    return match ? { index: match.index, match } : undefined;
}
function classifyDangerous(snippet) {
    if (/\beval\s*\(|new\s+Function/i.test(snippet))
        return { subtype: "language_eval", severity: "critical" };
    if (/\bvm\./i.test(snippet))
        return { subtype: "vm_eval", severity: "critical" };
    if (/page\.evaluate/i.test(snippet))
        return { subtype: "browser_context_eval", severity: "high" };
    if (/pickle\.loads/i.test(snippet))
        return { subtype: "unsafe_deserialization", severity: "high" };
    return { subtype: "shell_exec", severity: "critical" };
}
function isConstantArgument(snippet) {
    return /\(\s*["'`][^"'`]*["'`]\s*\)/.test(snippet);
}
export const sec001 = {
    id: "MCP-SEC-001",
    name: "Shell / Eval / Exec Exposed Without Operator Gate",
    defaultSeverity: "critical",
    defaultConfidence: "high",
    phase: "v0-alpha",
    check(context) {
        const content = context.file.content;
        if (!hasToolRegistration(content))
            return [];
        const toolSpans = findToolSpans(content);
        const helpers = findHelperSpans(content)
            .map((helper) => ({ helper, dangerous: firstDangerous(helper.text) }))
            .filter((entry) => Boolean(entry.dangerous));
        for (const toolSpan of toolSpans) {
            const direct = firstDangerous(toolSpan.text);
            if (direct && !hasOperatorGate(toolSpan.text.slice(0, direct.index))) {
                const snippet = direct.match[0];
                const { subtype, severity } = classifyDangerous(snippet);
                return [
                    makeFinding(context, {
                        ruleId: "MCP-SEC-001",
                        subtype,
                        baseSeverity: severity,
                        confidence: isConstantArgument(snippet) ? "medium" : "high",
                        index: toolSpan.start + direct.index,
                        excerpt: snippet,
                        toolName: extractToolName(content, toolSpan.start),
                        message: "MCP tool handler can reach shell, eval, or arbitrary execution without an operator-controlled gate.",
                        fix: "Add an operator-controlled env/config gate that defaults off, an allowlist, or host-side approval outside ordinary tool input.",
                        metadata: {
                            execution_context: subtype === "shell_exec" ? "local_process" : subtype,
                            escalation_reason: severity === "critical" ? "agent-controlled execution path" : undefined
                        }
                    })
                ];
            }
            for (const { helper, dangerous } of helpers) {
                const helperCall = callToHelper(toolSpan.text, helper.name);
                if (!helperCall)
                    continue;
                if (hasOperatorGate(toolSpan.text.slice(0, helperCall.index)))
                    continue;
                if (hasOperatorGate(helper.text.slice(0, dangerous.index)))
                    continue;
                const snippet = dangerous.match[0];
                const { subtype, severity } = classifyDangerous(snippet);
                return [
                    makeFinding(context, {
                        ruleId: "MCP-SEC-001",
                        subtype,
                        baseSeverity: severity,
                        confidence: isConstantArgument(snippet) ? "medium" : "high",
                        index: helper.start + dangerous.index,
                        excerpt: snippet,
                        toolName: extractToolName(content, toolSpan.start),
                        message: "MCP tool handler can reach shell, eval, or arbitrary execution without an operator-controlled gate.",
                        fix: "Add an operator-controlled env/config gate that defaults off, an allowlist, or host-side approval outside ordinary tool input.",
                        metadata: {
                            execution_context: subtype === "shell_exec" ? "local_process" : subtype,
                            escalation_reason: severity === "critical" ? "agent-controlled execution path" : undefined
                        }
                    })
                ];
            }
        }
        return [];
    }
};
//# sourceMappingURL=sec-001.js.map