# Swatex AI — System Architecture
**Amazon Developer Hackathon 2026 (Alexa+ Track & AWS Builder Challenge)**
**Tagline:** Code Smarter. Debug Faster.

## 1. High-Level Overview
Swatex AI is a developer-focused autonomous AI debugging assistant. When a bug occurs or a user describes an incident, Swatex investigates the project workspace, identifies the defect root cause, formulates a safe minimal patch, waits for human approval, applies the patch, runs allowlisted tests, and verifies the results.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Swatex AI Frontend (React + Vite)               │
│   • Dark Developer Workspace      • Real-time Tool Execution Timeline  │
│   • Live Diff & Approval UI       • Live Terminal Test Output          │
└───────────────────▲────────────────────────────────────▲───────────────┘
                    │ REST API / WebSocket               │ SSE / Streamable HTTP
┌───────────────────▼────────────────────────────────────▼───────────────┐
│                        Swatex AI Backend (Express + Node.js)           │
│   • Agent Controller Orchestrator  • Security Sandbox Boundary         │
│   • Safe Patch & Backup Engine     • Command Allowlist Runner          │
└───────────────────▲────────────────────────────────────▲───────────────┘
                    │                                    │
       ┌────────────▼────────────┐          ┌────────────▼────────────┐
       │   Amazon Bedrock Client │          │    Official MCP Server  │
       │   AWS SDK v3 (Converse) │          │   v2025-11-25 Protocol  │
       │   Claude 3.5 / Nova Pro │          │   8 Sandboxed Tools     │
       └─────────────────────────┘          └────────────▲────────────┘
                                                         │
                                            ┌────────────▼────────────┐
                                            │ Sample Target Workspace │
                                            │ checkout_service        │
                                            │ tests & incident logs   │
                                            └─────────────────────────┘
```

---

## 2. Core Architectural Pillars

### A. Dual Reasoning Engine (AWS Bedrock & Local Deterministic Demo)
1. **Amazon Bedrock AI Engine**:
   - Uses `@aws-sdk/client-bedrock-runtime` and the Bedrock `Converse` API.
   - Maps the 8 MCP tools into Bedrock tool specifications.
   - Coordinates an autonomous multi-turn reasoning loop with bounded iterations (`MAX_STEPS = 8`) to prevent runaway API loops.
   - Diagnoses credentials, IAM permissions, model enablement, and quota errors gracefully.
2. **Local Deterministic Demo Engine**:
   - Executes if AWS credentials are not configured or when requested by the user.
   - Runs against the **exact same** real MCP tool handlers and real test runner.
   - Accurately executes local commands without mocking or fabricating AWS responses.

### B. Model Context Protocol (MCP) Server
- Implements the official Model Context Protocol (spec version `2025-11-25`).
- Supports both:
  - **Streamable HTTP Transport**: Direct JSON-RPC 2.0 at `POST /mcp` (`initialize`, `tools/list`, `tools/call`).
  - **Server-Sent Events (SSE) Transport**: At `GET /mcp/sse` and `POST /mcp/messages`.
- Exposes 8 sandboxed tools with JSON schema argument validation:
  1. `list_files`
  2. `read_file`
  3. `search_code`
  4. `analyze_error`
  5. `propose_patch`
  6. `apply_patch`
  7. `run_tests`
  8. `get_project_summary`

### C. Security Sandbox & Protection Boundaries
1. **Path Traversal Rejection**:
   - Resolves all paths with canonicalized boundaries (`resolveSafePath`).
   - Strictly blocks traversal attempts (`../`, `..\\`, absolute OS paths, null-byte injections).
2. **Command Allowlist**:
   - Forbids arbitrary shell execution from AI models.
   - Restricts commands strictly to predefined test runners (e.g. `python -m unittest discover -s tests`).
3. **Human-in-the-Loop Patch Approval**:
   - AI tools can only propose patches via `propose_patch`.
   - Patches are registered with a cryptographic checksum and unique `patchId`.
   - Applying a patch (`apply_patch`) requires explicit human authorization, checks file checksum integrity, and creates a `.bak` backup file before writing.
