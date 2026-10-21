# Swatex AI — Code Smarter. Debug Faster.
**Amazon Developer Hackathon 2026**  
**Primary Track:** Alexa+  
**Mini Challenge:** AWS Builder  
**GitHub Repository:** `swatex-ai`

> *"Describe the bug. Swatex investigates the project, identifies likely causes, proposes a safe fix, runs tests, and explains verified results through an AI agent using developer tools."*

---

## 🌟 Overview
**Swatex AI** is a professional, developer-first autonomous debugging assistant designed to eliminate the manual toil of diagnosing production bugs, reproducing failures, navigating unfamiliar codebases, and crafting patches.

Built with **Amazon Bedrock** and the **Official Model Context Protocol (MCP)** specification (v2025-11-25), Swatex AI connects conversational intent with real sandboxed developer tools to inspect repositories, parse incident logs, formulate verified diffs, enforce human-in-the-loop authorization, and run real unit test suites.

---

## 🚀 Key Features

- 🧠 **Dual Reasoning Engine**:
  - **Amazon Bedrock AI Engine**: Powered by Anthropic Claude 3.5 Sonnet / Amazon Nova Pro via the Bedrock Converse API with bounded multi-turn tool reasoning.
  - **Deterministic Local Demo Mode**: High-fidelity local mode using the exact same real MCP tools and real test execution. Zero fabricated AWS responses.
- 🔌 **Official Model Context Protocol (MCP) Server**:
  - Spec version **2025-11-25** or later.
  - Supports both **Streamable HTTP** (`POST /mcp`) and **Server-Sent Events** (`GET /mcp/sse`).
  - 8 discoverable, sandboxed tools with JSON-schema argument validation.
- 🛡️ **Restricted Security Sandbox**:
  - **Path Traversal Protection**: Strict workspace path normalization (`resolveSafePath`) rejecting `../`, `..\\`, absolute paths, and null-byte injections.
  - **Command Allowlist**: Strict allowlist restricting subprocess execution exclusively to predefined test runners.
  - **Human-in-the-Loop Patch Approval**: Generates unified diffs without touching disk; requires explicit human authorization and creates `.bak` backups before applying.
- 🧪 **Seeded E-Commerce Sample Microservice**:
  - Realistic pricing & loyalty discount service (`sample-project/checkout_service`).
  - Seeded revenue calculation defect in `src/pricing.py:29`.
  - Production incident log in `logs/checkout_error.log`.
  - Python `unittest` suite that fails before patch (exit code 1) and passes after patch (exit code 0).
  - One-click instant reset to pristine bug state.
- 💻 **Dark Developer Workspace UI**:
  - Built with React, Vite, TypeScript, Tailwind CSS, and Lucide icons.
  - Brand header displaying **Swatex AI** and tagline *"Code Smarter. Debug Faster."*
  - Live status badges for Amazon Bedrock and MCP Server.
  - Interactive file explorer & syntax-highlighted code viewer.
  - Step-by-step tool execution timeline with duration and raw JSON inspection.
  - Unified patch diff viewer with colored additions and deletions.
  - Real terminal test runner output console.

---

## 📐 Architecture
See [`docs/ARCHITECTURE.md`](file:///d:/DevPilot-AI/docs/ARCHITECTURE.md) for detailed architecture diagrams and workflows.

```
┌─────────────────────────────────────────────────────────────┐
│                     Swatex AI Frontend                      │
│               React + Vite + Tailwind CSS                   │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / SSE
┌──────────────────────────────▼──────────────────────────────┐
│                     Swatex AI Backend                       │
│                   Express + TypeScript                      │
├──────────────────────────────┬──────────────────────────────┤
│      Amazon Bedrock Client   │     Official MCP Server      │
│      AWS SDK JS v3 (Converse)│     Spec v2025-11-25         │
└──────────────────────────────┴───────────────▲──────────────┘
                                               │
                               ┌───────────────▼──────────────┐
                               │       Security Sandbox       │
                               │  • Path Traversal Guard      │
                               │  • Test Command Allowlist    │
                               │  • Patch Checksum & Backup   │
                               └───────────────▲──────────────┘
                                               │
                               ┌───────────────▼──────────────┐
                               │  checkout_service Workspace  │
                               │  pricing.py & unit tests     │
                               └──────────────────────────────┘
```

---

## 🛠️ The 8 MCP Tools
Swatex implements all 8 required tools per the MCP specification:

1. `list_files` — List files only within the configured sample workspace.
2. `read_file` — Read an allowed file within the workspace.
3. `search_code` — Search code for a specified text pattern or keyword.
4. `analyze_error` — Parse incident logs/stack traces and identify culprit file and line.
5. `propose_patch` — Generate a unified diff proposal without modifying disk.
6. `apply_patch` — Safely apply approved patch after integrity checks.
7. `run_tests` — Run predefined allowlisted test commands in restricted sandbox.
8. `get_project_summary` — Return language, file tree, test runner, and incident logs.

Full JSON schemas and tool documentation are in [`docs/MCP_TOOLS.md`](file:///d:/DevPilot-AI/docs/MCP_TOOLS.md).

---

## ⚡ Quick Start

### 1. Install & Build
```bash
# Backend
cd backend
npm install
npm run build

# Frontend
cd ../frontend
npm install
npm run build

# Return to root
cd ..
```

### 2. Run Automated Tests
```bash
cd backend
npm test
```
*Expected: 20 passed tests across 4 test suites in ~3.3 seconds.*

### 3. Start Dev Servers
**Terminal 1 (Backend)**:
```bash
cd backend
npm run dev
```
*Backend runs on `http://localhost:4000` (MCP endpoint on `http://localhost:4000/mcp`).*

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📖 Documentation Directory
- [**Installation & Setup Guide**](file:///d:/DevPilot-AI/SETUP.md): Step-by-step setup instructions.
- [**System Architecture**](file:///d:/DevPilot-AI/docs/ARCHITECTURE.md): Deep-dive into agent loops and security boundaries.
- [**MCP Tool Reference**](file:///d:/DevPilot-AI/docs/MCP_TOOLS.md): Complete schemas and endpoint definitions.
- [**AWS Bedrock Guide**](file:///d:/DevPilot-AI/docs/AWS_BEDROCK_SETUP.md): Model access, IAM policies, and credentials guide.
- [**Automated Testing Guide**](file:///d:/DevPilot-AI/docs/TESTING.md): Vitest test runner documentation.
- [**3-Minute Demo Script**](file:///d:/DevPilot-AI/docs/DEMO_SCRIPT.md): Hackathon video walkthrough script.
- [**Product Feedback Draft**](file:///d:/DevPilot-AI/docs/PRODUCT_FEEDBACK.md): Detailed developer feedback on AWS & MCP SDKs.
- [**Friction Log**](file:///d:/DevPilot-AI/docs/FRICTION_LOG.md): Observations, workarounds, and actionable suggestions.
- [**Submission Checklist**](file:///d:/DevPilot-AI/docs/SUBMISSION_CHECKLIST.md): Tracked submission items.

---

## 📄 License
This project is licensed under the MIT License — see [`LICENSE`](file:///d:/DevPilot-AI/LICENSE) for details.
