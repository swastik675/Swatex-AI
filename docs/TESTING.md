# Swatex AI — Automated Testing & Verification Guide
**Tagline:** Code Smarter. Debug Faster.

## Test Architecture
Swatex AI contains automated unit, integration, and security test suites using **Vitest**.

### Test Suites
1. **Path Traversal & Security Sandbox (`backend/tests/pathSafety.test.ts`)**:
   - Verifies relative and canonical workspace path resolution.
   - Verifies strict rejection of `../`, `..\\`, absolute paths (`/etc/passwd`, `C:\Windows`), and null-byte injections.
2. **MCP Tool Schemas & Execution (`backend/tests/mcpTools.test.ts`)**:
   - Verifies presence and valid JSON schemas for all 8 official MCP tools.
   - Tests file listing, code reading, code pattern search, and error log diagnosis.
   - Verifies rejection of non-allowlisted shell commands.
3. **Patch Diff Engine (`backend/tests/patchEngine.test.ts`)**:
   - Tests clean unified diff generation without touching disk files.
   - Tests authorization via unique `patchId`.
   - Tests `.bak` backup file creation and rollback.
   - Tests rejection of patch application if target file was modified externally.
4. **End-to-End Workflow Verification (`backend/tests/workflowEndToEnd.test.ts`)**:
   - Verifies seeded sample tests FAIL before fix (exit code 1).
   - Verifies autonomous investigation finds defect and returns patch proposal.
   - Verifies patch approval and application.
   - Verifies tests PASS on real execution (exit code 0).
   - Verifies sample workspace reset returns to seeded bug state.

---

## Running the Automated Tests

### Run Backend & MCP Tests
```bash
cd backend
npm test
```
Or from root:
```bash
npm test
```

### Expected Output
```
✓ tests/pathSafety.test.ts (5 tests)
✓ tests/patchEngine.test.ts (3 tests)
✓ tests/mcpTools.test.ts (7 tests)
✓ tests/workflowEndToEnd.test.ts (5 tests)

Test Files  4 passed (4)
     Tests  20 passed (20)
```

---

## Testing the Sample Project Directly
You can run the Python unit tests in `sample-project/checkout_service`:
```bash
cd sample-project/checkout_service
python -m unittest discover -s tests
```
- **Before Fix**: 4 failures out of 6 tests (`FAILED (failures=4)`).
- **After Fix**: 6 passing tests (`Ran 6 tests ... OK`).
