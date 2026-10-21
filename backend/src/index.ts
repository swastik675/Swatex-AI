import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { createDevPilotMCPServer } from './mcp/server.js';
import { checkBedrockHealth, getBedrockConfig } from './bedrock/bedrockClient.js';
import { AgentController } from './agent/agentController.js';
import { handleToolCall, MCP_TOOL_DEFINITIONS } from './mcp/tools.js';

// Resolve current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root or local .env
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const PORT = parseInt(process.env.PORT || '4000', 10);
const defaultWorkspace = path.resolve(
  __dirname,
  '../../sample-project/checkout_service'
);
const workspaceRoot = process.env.SAMPLE_WORKSPACE_PATH
  ? path.resolve(process.env.SAMPLE_WORKSPACE_PATH)
  : defaultWorkspace;

console.log(`[DevPilot Backend] Initializing with workspace: ${workspaceRoot}`);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize MCP Server
const mcpManager = createDevPilotMCPServer(workspaceRoot);
mcpManager.setupRoutes(app);

// Initialize Agent Controller
const agentController = new AgentController(workspaceRoot);

// REST API Endpoints

/**
 * Health check & diagnostic status
 */
app.get('/api/health', async (req, res) => {
  const bedrockHealth = await checkBedrockHealth();
  res.json({
    status: 'HEALTHY',
    service: 'Swatex AI Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    workspace: {
      path: workspaceRoot,
      exists: fs.existsSync(workspaceRoot),
    },
    bedrock: bedrockHealth,
    mcp: {
      status: 'ONLINE',
      protocolVersion: '2025-11-25',
      toolCount: MCP_TOOL_DEFINITIONS.length,
      streamableHttpEndpoint: '/mcp',
      sseEndpoint: '/mcp/sse',
    },
  });
});

/**
 * Current environment configuration
 */
app.get('/api/config', async (req, res) => {
  const bedrockConfig = getBedrockConfig();
  res.json({
    workspaceRoot,
    bedrock: {
      region: bedrockConfig.region,
      modelId: bedrockConfig.modelId,
      hasExplicitCredentials: bedrockConfig.hasExplicitCredentials,
    },
    defaultTestCommand: 'python -m unittest discover -s tests -p "test_*.py"',
  });
});

/**
 * Workspace file listing
 */
app.get('/api/files', async (req, res) => {
  try {
    const result = await handleToolCall('list_files', {}, workspaceRoot);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Read specific file content
 */
app.get('/api/file', async (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ error: 'Query parameter "path" is required.' });
    return;
  }
  try {
    const result = await handleToolCall('read_file', { filePath }, workspaceRoot);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * Run autonomous agent investigation
 */
app.post('/api/agent/investigate', async (req, res) => {
  const { prompt, mode = 'local_demo' } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Field "prompt" is required.' });
    return;
  }

  try {
    const result = await agentController.investigate(prompt, mode);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      provider: mode,
    });
  }
});

/**
 * Approve and apply proposed patch, followed by automated test execution
 */
app.post('/api/agent/approve-patch', async (req, res) => {
  const { patchId } = req.body || {};
  if (!patchId) {
    res.status(400).json({ error: 'Field "patchId" is required.' });
    return;
  }

  try {
    const result = await agentController.approveAndVerify(patchId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Reset sample workspace to initial buggy state
 */
app.post('/api/agent/reset-sample', (req, res) => {
  try {
    const result = agentController.resetSampleWorkspace();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Directly execute allowlisted tests
 */
app.post('/api/test/run', async (req, res) => {
  const { command } = req.body || {};
  try {
    const result = await handleToolCall('run_tests', { command }, workspaceRoot);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * List MCP Tools
 */
app.get('/api/mcp/tools', (req, res) => {
  res.json({
    protocolVersion: '2025-11-25',
    tools: MCP_TOOL_DEFINITIONS,
  });
});

/**
 * Directly invoke MCP tool (inspector)
 */
app.post('/api/mcp/invoke', async (req, res) => {
  const { name, arguments: args = {} } = req.body || {};
  if (!name) {
    res.status(400).json({ error: 'Tool "name" is required.' });
    return;
  }

  try {
    const result = await handleToolCall(name, args, workspaceRoot);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Swatex AI Backend Server running on http://localhost:${PORT}`);
  console.log(` MCP Streamable HTTP endpoint: http://localhost:${PORT}/mcp`);
  console.log(` MCP SSE endpoint:            http://localhost:${PORT}/mcp/sse`);
  console.log(` REST API Health:              http://localhost:${PORT}/api/health`);
  console.log(` Target Sample Workspace:     ${workspaceRoot}`);
  console.log(`=======================================================`);
});

export { app };
