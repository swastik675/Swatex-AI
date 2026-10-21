# Swatex AI — Model Context Protocol (MCP) Tool Reference
**Protocol Specification Version: 2025-11-25**  
**Server Implementation: Official TypeScript MCP SDK (`@modelcontextprotocol/sdk`)**

## Endpoints
- **Streamable HTTP (JSON-RPC 2.0)**: `POST http://localhost:4000/mcp`
- **Server-Sent Events (SSE)**: `GET http://localhost:4000/mcp/sse`
- **Session Messages**: `POST http://localhost:4000/mcp/messages?sessionId=<id>`
- **Status & Health**: `GET http://localhost:4000/mcp/status`

---

## Tool 1: `list_files`
- **Description**: List files and directories strictly inside the configured safe workspace directory.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "subDirectory": {
        "type": "string",
        "description": "Optional sub-directory within workspace (default: workspace root)"
      }
    }
  }
  ```
- **Security**: Rejects any `subDirectory` resolving outside the workspace.

---

## Tool 2: `read_file`
- **Description**: Read the UTF-8 contents of an allowed file located strictly within the workspace.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "filePath": {
        "type": "string",
        "description": "Relative path of the file inside workspace to read."
      }
    },
    "required": ["filePath"]
  }
  ```
- **Returns**: `{ filePath, totalLines, sizeBytes, content }`

---

## Tool 3: `search_code`
- **Description**: Search code across the workspace files for a text string or pattern.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Text string or search keyword to find."
      },
      "fileExtension": {
        "type": "string",
        "description": "Optional file extension filter (e.g. \".py\", \".ts\")."
      }
    },
    "required": ["pattern"]
  }
  ```
- **Returns**: `{ query, matchesCount, matches: [{ file, lineNumber, lineContent }] }`

---

## Tool 4: `analyze_error`
- **Description**: Analyze an error message, stack trace, or incident log file against workspace code context.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "errorMessage": {
        "type": "string",
        "description": "Raw error message or stack trace."
      },
      "logFilePath": {
        "type": "string",
        "description": "Optional relative path to an error log file in workspace."
      }
    }
  }
  ```
- **Returns**: Culprit file, line number, offending function, and contextual code snippet.

---

## Tool 5: `propose_patch`
- **Description**: Generate a unified diff and registered patch proposal for user review. Does NOT apply changes to disk.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "filePath": { "type": "string", "description": "Relative file path" },
      "originalSnippet": { "type": "string", "description": "Exact existing code snippet" },
      "replacementSnippet": { "type": "string", "description": "New replacement code snippet" },
      "explanation": { "type": "string", "description": "Technical rationale" },
      "targetLine": { "type": "number", "description": "Approximate line number" }
    },
    "required": ["filePath", "originalSnippet", "replacementSnippet", "explanation"]
  }
  ```
- **Returns**: `{ status: "PENDING_APPROVAL", patchId, diff, addedLinesCount, removedLinesCount, explanation }`

---

## Tool 6: `apply_patch`
- **Description**: Apply an approved patch to the workspace after safety verification and user authorization.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "patchId": {
        "type": "string",
        "description": "The unique patch identifier returned by propose_patch."
      }
    },
    "required": ["patchId"]
  }
  ```
- **Safety**: Validates original content checksum. Generates `.bak` backup file before writing.

---

## Tool 7: `run_tests`
- **Description**: Execute predefined, allowlisted test commands against the sample project in a restricted environment.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "Allowlisted test command. Defaults to \"python -m unittest discover -s tests\"."
      }
    }
  }
  ```
- **Allowlist**:
  - `python -m unittest discover -s tests`
  - `python -m unittest tests/test_pricing.py`
  - `python -m unittest`
  - `node --test`
  - `npm test`

---

## Tool 8: `get_project_summary`
- **Description**: Return project metadata, detected language, file tree, test commands, and known incident logs.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {}
  }
  ```
