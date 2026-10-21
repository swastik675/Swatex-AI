# Swatex AI — Product Feedback & SDK Evaluation
**Amazon Developer Hackathon 2026**

## 1. AWS SDK for JavaScript v3 (`@aws-sdk/client-bedrock-runtime`)

### What Worked Well:
- **Converse API (`ConverseCommand`)**: The unified Converse API is a massive improvement over raw model-specific payload formats (e.g. Anthropic JSON vs Titan JSON). The tool-use protocol (`toolConfig` and `toolResult`) is clean, standardized, and ergonomic.
- **Modular Packaging**: Small bundle footprint compared to AWS SDK v2, allowing only the Bedrock runtime client to be imported.
- **Error Types**: Explicit error constructors (`AccessDeniedException`, `ResourceNotFoundException`, `UnrecognizedClientException`) enabled clear, actionable user diagnostics.

### Suggestions for Improvement:
- **Local Sandbox / Mock Mode**: Providing an official local mock transport in the AWS SDK (e.g. `BedrockRuntimeMockClient` with record/replay) would make developer onboarding and unit testing significantly faster without needing live AWS credentials for test suites.
- **Tool Schema Ergonomics**: In TypeScript, the typing of `ToolInput` inside `ToolUse` is typed as a generic `DocumentType`, which requires manual type assertions (`as Record<string, any>`). More strongly-typed schema inference from JSON schemas would prevent type errors.

---

## 2. Official Model Context Protocol TypeScript SDK (`@modelcontextprotocol/sdk`)

### What Worked Well:
- **Specification Compliance**: The `Server`, `SSEServerTransport`, and request schemas (`ListToolsRequestSchema`, `CallToolRequestSchema`) implement the standard MCP protocol cleanly.
- **Streamable HTTP Support**: The emerging Streamable HTTP transport standard enables web and backend clients to connect seamlessly without requiring stdio pipes.

### Suggestions for Improvement:
- **Express / Framework Middleware Helper**: Currently, connecting `SSEServerTransport` with Express requires custom session tracking maps and boilerplate for `handlePostMessage`. An official `expressMcpMiddleware()` or `fastifyMcpPlugin()` would save developers substantial setup time.
- **Input Schema Type Validation**: Integrating Zod directly with tool definitions so tool arguments are auto-parsed and validated would reduce boilerplate in tool handlers.

---

## 3. Python `unittest` & Node.js Subprocess Execution on Windows

### What Worked Well:
- Zero dependency footprint: Built-in `unittest` in Python and `node --test` in Node.js make sample projects fast and universally reproducible across developer machines.

### Nuances Encountered:
- **Windows `cmd.exe` Argument Escaping**: Passing wildcard patterns like `test_*.py` wrapped in quotes inside `cmd.exe /c` caused unittest discovery to look for literal quotes. Sanitizing arguments to unquoted patterns resolved the issue.
- **Terminal ANSI Color Codes**: Python 3.14 on Windows terminal emits ANSI color escape sequences (`\u001b[31mFAIL\u001b[0m`), which can break naive substring assertions in test runners if not stripped or matched with regular expressions.
