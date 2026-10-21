# Swatex AI — Hackathon Demo Script (Under 3 Minutes)
**Amazon Developer Hackathon 2026**
**Tagline:** Code Smarter. Debug Faster.

## Video / Live Presentation Outline

### 0:00 – 0:30: The Problem & The Pitch
- **Visual**: Show Swatex AI dark workspace (`http://localhost:5173`).
- **Speaker**:
  > "Hi everyone, I'm presenting **Swatex AI: Code Smarter. Debug Faster.** for the Alexa+ Track and AWS Builder Challenge.
  > Modern developer debugging is fragmented. When a production incident occurs, developers spend hours grepping logs, inspecting repositories, writing patches, and manually running tests.
  > Swatex AI changes this: Describe the bug. Swatex investigates the project, identifies the cause, proposes a safe patch, runs tests, and explains verified results through an autonomous AI agent using the official Model Context Protocol and Amazon Bedrock."

### 0:30 – 1:00: Inspecting the Environment & MCP Discovery
- **Visual**:
  - Point to Header badges: **MCP Server v2025-11-25** and **AWS Bedrock**.
  - Click **MCP Tools** button in header to open the MCP Server Inspector.
  - Show the 8 registered MCP tools (`list_files`, `read_file`, `search_code`, `analyze_error`, `propose_patch`, `apply_patch`, `run_tests`, `get_project_summary`).
  - Click **Invoke Tool** on `list_files` to show live JSON-RPC response from `http://localhost:4000/mcp`.
  - Close the modal.
- **Speaker**:
  > "Swatex runs a real Model Context Protocol server over Streamable HTTP and SSE, allowing any MCP-compliant agent or client to discover and invoke tools safely."

### 1:00 – 1:45: Autonomous Bug Investigation
- **Visual**:
  - Click the **"Full Hackathon Workflow"** prompt on the sidebar:
    *"Find the bug, explain its cause, propose a fix, and run the tests."*
  - Watch the live **Tool Execution Timeline** populate with step-by-step traces (`get_project_summary`, `list_files`, `analyze_error`, `read_file`, `propose_patch`).
  - Show the **Root Cause Diagnosed** card:
    *"Calculation multiplies subtotal directly by discount rate (subtotal * rate) rather than computing the discounted price."*
  - Show the **Proposed Code Patch** diff with line additions (+ green) and deletions (- red).
- **Speaker**:
  > "Swatex autonomously traversed the workspace, parsed the production incident log in `logs/checkout_error.log`, located the flawed function in `src/pricing.py:29`, and formulated a minimal patch diff.
  > Crucially, for security and safety, Swatex does NOT apply patches without explicit human approval."

### 1:45 – 2:30: Human-in-the-Loop Approval & Real Test Verification
- **Visual**:
  - Click the green button **"Approve & Apply Patch"**.
  - Show the patch being safely applied to disk (with an automated `.bak` backup).
  - Show the real test runner execute `python -m unittest discover -s tests` live in the console.
  - Show the console turning green: `Ran 6 tests in 0.005s - OK`.
  - Show the top badge update to: **VERIFIED — All Tests Passing**.
- **Speaker**:
  > "With one click, the patch is applied safely. The allowlisted test suite runs live in a restricted sandbox. All 6 unit tests pass, and the incident is completely verified."

### 2:30 – 3:00: Reset & Closing Summary
- **Visual**:
  - Click **"Reset Sample Bug"** in the sidebar. Show the workspace instantly restored to its seeded bug state ready for another run.
  - Show the Settings modal displaying Amazon Bedrock Claude 3.5 Sonnet configuration.
- **Speaker**:
  > "Swatex AI bridges autonomous AI reasoning with developer-grade security, real tool protocols, and verifiable test execution: Code Smarter. Debug Faster. Thank you!"
