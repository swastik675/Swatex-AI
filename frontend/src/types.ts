export interface BedrockHealth {
  isConfigured: boolean;
  isConnected: boolean;
  modelId: string;
  region: string;
  statusMessage: string;
  diagnostics?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  workspace: {
    path: string;
    exists: boolean;
  };
  bedrock: BedrockHealth;
  mcp: {
    status: string;
    protocolVersion: string;
    toolCount: number;
    streamableHttpEndpoint: string;
    sseEndpoint: string;
  };
}

export interface ConfigResponse {
  workspaceRoot: string;
  bedrock: {
    region: string;
    modelId: string;
    hasExplicitCredentials: boolean;
  };
  defaultTestCommand: string;
}

export interface FileEntry {
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
}

export interface FileListResponse {
  workspace: string;
  totalEntries: number;
  files: FileEntry[];
}

export interface AgentStepTrace {
  stepNumber: number;
  timestamp: string;
  type: 'thought' | 'tool_call' | 'tool_result' | 'patch_proposed' | 'error';
  toolName?: string;
  toolInput?: Record<string, any>;
  toolOutput?: any;
  message?: string;
  durationMs?: number;
}

export interface PatchProposal {
  patchId: string;
  filePath: string;
  diff: string;
  addedLinesCount: number;
  removedLinesCount: number;
  explanation: string;
  status: string;
  createdAt: string;
}

export interface TestExecutionResult {
  command: string;
  passed: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  summary: string;
}

export interface AgentExecutionResult {
  provider: 'aws_bedrock' | 'local_demo';
  modelId: string;
  completed: boolean;
  finalMessage: string;
  rootCauseAnalysis?: {
    culpritFile: string;
    culpritLine?: number;
    explanation: string;
  };
  patchProposal?: PatchProposal;
  testResults?: TestExecutionResult;
  timeline: AgentStepTrace[];
  isVerified: boolean;
  requiresApproval: boolean;
}

export interface MCPToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}
