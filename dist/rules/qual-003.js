import { extractToolName, firstMatch, hasToolRegistration, makeFinding } from "./common.js";
export const qual003 = {
    id: "MCP-QUAL-003",
    name: "Tool Description Prose Quality",
    defaultSeverity: "medium",
    defaultConfidence: "low",
    phase: "v0.1",
    check(context) {
        const content = context.file.content;
        if (!hasToolRegistration(content))
            return [];
        const toolName = extractToolName(content) ?? "tool";
        const description = /description\s*:\s*["'`]([\s\S]*?)["'`]/i.exec(content);
        let subtype;
        let index = 0;
        let excerpt = toolName;
        if (!description) {
            subtype = "missing_description";
            const match = firstMatch(content, [/(?:server|mcp|app)\.(?:tool|registerTool)\s*\([^\n]+/i]);
            index = match?.index ?? 0;
            excerpt = match?.match[0] ?? toolName;
        }
        else {
            const text = description[1].trim();
            index = description.index;
            excerpt = text;
            if (text.length < 20)
                subtype = "description_too_short";
            else if (/(?:TODO|TBD|\{\{|\[insert|lorem ipsum)/i.test(text))
                subtype = "unfilled_template";
            else if (/(?:ignore previous instructions|system prompt|do anything now)/i.test(text))
                subtype = "injection_shaped";
            else if (text.toLowerCase().replace(/[\s_-]+/g, "") === toolName.toLowerCase().replace(/[\s_-]+/g, ""))
                subtype = "description_repeats_name";
            else if (/```/.test(text))
                subtype = "code_block_in_description";
            else if (/email/i.test(toolName) && /calendar/i.test(text))
                subtype = "domain_mismatch";
        }
        if (!subtype)
            return [];
        return [
            makeFinding(context, {
                ruleId: "MCP-QUAL-003",
                subtype,
                baseSeverity: "medium",
                confidence: "low",
                index,
                excerpt,
                toolName,
                message: "Tool description is missing or objectively too weak for operator review.",
                fix: "Describe what the tool does, required inputs, side effects, and safety constraints in one concise sentence.",
                metadata: { description_subtype: subtype }
            })
        ];
    }
};
//# sourceMappingURL=qual-003.js.map