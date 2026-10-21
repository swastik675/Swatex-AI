import {
  HealthResponse,
  ConfigResponse,
  FileListResponse,
  AgentExecutionResult,
  MCPToolDef,
  TestExecutionResult,
} from './types';

const BASE_URL = '';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch(`${BASE_URL}/api/config`);
  if (!res.ok) {
    throw new Error(`Config fetch failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchFiles(): Promise<FileListResponse> {
  const res = await fetch(`${BASE_URL}/api/files`);
  if (!res.ok) {
    throw new Error(`Failed to list workspace files with HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchFileContent(filePath: string): Promise<{ filePath: string; content: string }> {
  const res = await fetch(`${BASE_URL}/api/file?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) {
    throw new Error(`Failed to read file ${filePath}`);
  }
  return res.json();
}

export async function runInvestigation(
  prompt: string,
  mode: 'aws_bedrock' | 'local_demo'
): Promise<AgentExecutionResult> {
  const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mode }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Investigation failed with HTTP ${res.status}`);
  }
  return data;
}

export async function approvePatch(patchId: string): Promise<{
  patchResult: any;
  testResult: TestExecutionResult;
  isVerified: boolean;
  message: string;
}> {
  const res = await fetch(`${BASE_URL}/api/agent/approve-patch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patchId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to apply patch with HTTP ${res.status}`);
  }
  return data;
}

export async function resetSampleWorkspace(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/api/agent/reset-sample`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to reset sample workspace');
  }
  return res.json();
}

export async function executeTestDirectly(command?: string): Promise<TestExecutionResult> {
  const res = await fetch(`${BASE_URL}/api/test/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to execute test');
  }
  return data;
}

export async function fetchMCPTools(): Promise<{ protocolVersion: string; tools: MCPToolDef[] }> {
  const res = await fetch(`${BASE_URL}/api/mcp/tools`);
  if (!res.ok) {
    throw new Error('Failed to fetch MCP tools');
  }
  return res.json();
}

export async function invokeMCPToolDirectly(name: string, args: Record<string, any>): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/mcp/invoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, arguments: args }),
  });
  return res.json();
}
