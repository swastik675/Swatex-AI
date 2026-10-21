# Swatex AI — Friction Log
**Amazon Developer Hackathon 2026**

This log documents specific friction points encountered during development, the impact observed, workarounds implemented, and actionable suggestions for developer tool improvement.

---

### Friction Entry 1: Windows Command Line Argument Quoting in `cmd.exe`
- **Task**: Execute allowlisted test discovery command `python -m unittest discover -s tests -p "test_*.py"` via `child_process.spawn`.
- **Expected Outcome**: Python discovers tests matching `test_*.py` and runs the test suite.
- **Actual Outcome**: In Windows `cmd.exe /c`, literal quotation marks were passed into Python's discovery parser, returning exit code 5 (`No tests discovered`).
- **Severity**: High (blocked automated test execution).
- **Workaround**: Sanitized command string before spawning on Windows to use unquoted `test_*.py` pattern or bare `discover -s tests`.
- **Actionable Suggestion**: Test runner tools should normalize glob arguments across platform shells automatically.

---

### Friction Entry 2: Python 3.14 ANSI Color Escape Codes in Automated Assertions
- **Task**: Inspect stdout/stderr from test runner execution in Vitest assertions (`expect(output).toContain('FAIL:')`).
- **Expected Outcome**: Direct string matching passes.
- **Actual Outcome**: Python 3.14 terminal color formatting wrapped `FAIL:` in ANSI escape sequences (`\u001b[31mFAIL:\u001b[0m`), causing substring match failure.
- **Severity**: Medium (caused false positive test failures).
- **Workaround**: Added `stripAnsi` regex sanitizer in `commandRunner.ts` and updated test assertions to use regex `/FAIL/i`.
- **Actionable Suggestion**: Node subprocess test runners should strip ANSI sequences by default when parsing raw stdout/stderr for structured results.

---

### Friction Entry 3: MCP TypeScript SDK Session Lifecycle with HTTP Servers
- **Task**: Mount MCP Server on an Express web server over Server-Sent Events (SSE) and HTTP POST.
- **Expected Outcome**: Simple middleware or route handler for SSE and message dispatching.
- **Actual Outcome**: Required manual lifecycle management: tracking active sessions in a `Map<string, SSEServerTransport>`, handling session lookup, and routing post messages manually.
- **Severity**: Medium (developer friction / boilerplate).
- **Workaround**: Implemented custom session manager in `backend/src/mcp/server.ts` with explicit session map and error fallbacks.
- **Actionable Suggestion**: `@modelcontextprotocol/sdk` should ship with built-in Express / Koa / Fastify route handlers or middleware.

---

### Friction Entry 4: Browser Driver Download Failure in Automated Testing
- **Task**: Launch Playwright automated browser test via browser subagent.
- **Expected Outcome**: Browser opens `http://localhost:5173/` and executes visual test flow.
- **Actual Outcome**: Remote download of Playwright binary `playwright-1.57.0-win32_x64.zip` returned 404 from upstream CDN.
- **Severity**: Low to Medium (browser automation blocked; API and frontend verification conducted via curl / HTTP tests).
- **Workaround**: Verified all endpoints and fullstack workflows directly using Vite build, Vitest suite, and PowerShell HTTP client.
- **Actionable Suggestion**: Pre-install or cache local browser drivers in development environments.
