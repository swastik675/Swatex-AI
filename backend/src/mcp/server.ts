import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { MCP_TOOL_DEFINITIONS, handleToolCall } from './tools.js';

export interface MCPServerManager {
  server: Server;
  setupRoutes: (app: express.Express) => void;
  getWorkspaceRoot: () => string;
  setWorkspaceRoot: (root: string) => void;
}

export function createDevPilotMCPServer(initialWorkspaceRoot: string): MCPServerManager {
  let workspaceRoot = initialWorkspaceRoot;

  const server = new Server(
    {
      name: 'devpilot-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 1. Tool Discovery Handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOL_DEFINITIONS,
    };
  });

  // 2. Tool Execution Handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      const result = await handleToolCall(name, args, workspaceRoot);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      if (err.name === 'SecurityError') {
        throw new McpError(ErrorCode.InvalidParams, `DevPilot Security Error: ${err.message}`);
      }
      throw new McpError(ErrorCode.InternalError, `Tool execution error [${name}]: ${err.message}`);
    }
  });

  // Map to store active SSE transports by session ID
  const sseTransports = new Map<string, SSEServerTransport>();

  function setupRoutes(app: express.Express) {
    // Standard MCP SSE Transport endpoint
    app.get('/mcp/sse', async (req, res) => {
      console.log('[DevPilot MCP] New SSE connection requested');
      const transport = new SSEServerTransport('/mcp/messages', res);
      const sessionId = transport.sessionId;
      sseTransports.set(sessionId, transport);

      transport.onclose = () => {
        console.log(`[DevPilot MCP] SSE Session ${sessionId} closed`);
        sseTransports.delete(sessionId);
      };

      await server.connect(transport);
    });

    // POST endpoint for incoming MCP client messages for SSE session
    app.post('/mcp/messages', async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = sseTransports.get(sessionId);

      if (!transport) {
        res.status(404).json({ error: `MCP session "${sessionId}" not found or expired.` });
        return;
      }

      await transport.handlePostMessage(req, res);
    });

    // Direct Streamable HTTP / JSON-RPC fallback endpoint for web clients and tests
    app.post('/mcp', async (req, res) => {
      const { jsonrpc, id, method, params } = req.body || {};

      if (jsonrpc !== '2.0' || !method) {
        res.status(400).json({
          jsonrpc: '2.0',
          id: id ?? null,
          error: { code: -32600, message: 'Invalid JSON-RPC 2.0 Request' },
        });
        return;
      }

      try {
        if (method === 'initialize') {
          res.json({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2025-11-25',
              serverInfo: {
                name: 'devpilot-mcp-server',
                version: '1.0.0',
              },
              capabilities: {
                tools: {},
              },
            },
          });
          return;
        }

        if (method === 'tools/list') {
          res.json({
            jsonrpc: '2.0',
            id,
            result: {
              tools: MCP_TOOL_DEFINITIONS,
            },
          });
          return;
        }

        if (method === 'tools/call') {
          const { name, arguments: args = {} } = params || {};
          const result = await handleToolCall(name, args, workspaceRoot);
          res.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          });
          return;
        }

        res.status(404).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method "${method}" not found` },
        });
      } catch (err: any) {
        res.status(500).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: err.name === 'SecurityError' ? -32602 : -32603,
            message: err.message,
          },
        });
      }
    });

    // Simple GET info endpoint for inspector
    app.get('/mcp/status', (req, res) => {
      res.json({
        status: 'ONLINE',
        protocolVersion: '2025-11-25',
        activeSessions: sseTransports.size,
        availableTools: MCP_TOOL_DEFINITIONS.map(t => t.name),
        workspaceRoot,
      });
    });
  }

  return {
    server,
    setupRoutes,
    getWorkspaceRoot: () => workspaceRoot,
    setWorkspaceRoot: (root: string) => {
      workspaceRoot = root;
    },
  };
}
