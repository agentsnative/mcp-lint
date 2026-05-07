import { extractToolName, firstMatch, hasToolRegistration, makeFinding } from "./common.js";
function hasCompleteGuardBefore(content, index) {
    const prefix = content.slice(Math.max(0, index - 1200), index);
    const guardCall = /(?<!function )(?<!def )\b(?:assertSafeUrl|validateSafeUrl|ssrfGuard)\s*\(/i.test(prefix) ||
        /\b(?:isSafeUrl|allowedHosts\.includes|hostAllowlist\.includes|blockPrivate|isPrivateIp|recheckRedirect|redirectPolicy|safeUrl)\b/i.test(prefix);
    return guardCall;
}
function hasIncompleteGuardBefore(content, index) {
    const prefix = content.slice(Math.max(0, index - 1200), index);
    return /(?:denylist|blocklist|localhost|127\.0\.0\.1|metadata)/i.test(prefix);
}
export const sec005 = {
    id: "MCP-SEC-005",
    name: "SSRF URL-Fetch Tool Without Guard",
    defaultSeverity: "high",
    defaultConfidence: "high",
    phase: "v0-alpha",
    check(context) {
        const content = context.file.content;
        if (!hasToolRegistration(content))
            return [];
        if (/(?:fetch|axios|get|request|httpx|requests)\s*\(\s*["'`]https?:\/\//i.test(content) && !/\b(?:url|uri|endpoint|webhook|callback|host)\b/i.test(content))
            return [];
        const sink = firstMatch(content, [
            /\bfetch\s*\(\s*(?:input\.|args\.|params\.|request\.)?(url|uri|endpoint|webhook|callback|host)\b/i,
            /\b(?:axios|got|request|http\.get|https\.get|undici\.request)\s*\(\s*(?:input\.|args\.|params\.)?(url|uri|endpoint|webhook|callback|host)\b/i,
            /\b(?:requests|httpx)\.(?:get|post|request)\s*\(\s*(?:input\.|args\.|params\.)?(url|uri|endpoint|webhook|callback|host)\b/i,
            /\burllib\.request\.urlopen\s*\(\s*(?:input\.|args\.|params\.)?(url|uri|endpoint|webhook|callback|host)\b/i
        ]);
        if (!sink)
            return [];
        if (hasCompleteGuardBefore(content, sink.index))
            return [];
        const incomplete = hasIncompleteGuardBefore(content, sink.index);
        return [
            makeFinding(context, {
                ruleId: "MCP-SEC-005",
                subtype: incomplete ? "incomplete_ssrf_guard" : undefined,
                baseSeverity: "high",
                confidence: incomplete ? "medium" : "high",
                index: sink.index,
                excerpt: sink.match[0],
                toolName: extractToolName(content, sink.index),
                message: incomplete
                    ? "URL-fetching tool has only partial SSRF guard evidence before the HTTP client call."
                    : "User-controlled URL reaches an HTTP client without a visible SSRF guard.",
                fix: "Parse the URL, restrict schemes, block private/loopback/link-local ranges, recheck redirects, and set timeout and size limits before fetching.",
                metadata: {
                    url_param_name: sink.match[1] ?? "url",
                    required_blocks: ["private_ranges", "loopback", "link_local", "metadata_hosts", "redirect_recheck", "timeout", "size_limit"]
                }
            })
        ];
    }
};
//# sourceMappingURL=sec-005.js.map