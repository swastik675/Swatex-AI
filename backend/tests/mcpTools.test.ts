import { describe, it, expect } from 'vitest';
import path from 'path';
import { MCP_TOOL_DEFINITIONS, handleToolCall } from '../src/mcp/tools.js';

describe('Official MCP Tools Verification', () => {
  const workspaceRoot = path.resolve('../sample-project/checkout_service');

  it('declares exactly all 8 required MCP tools with JSON schemas', () => {
    const requiredNames = [
      'list_files',
      'read_file',
      'search_code',
      'analyze_error',
      'propose_patch',
      'apply_patch',
      'run_tests',
      'get_project_summary',
    ];

    expect(MCP_TOOL_DEFINITIONS).toHaveLength(8);
    for (const name of requiredNames) {
      const tool = MCP_TOOL_DEFINITIONS.find((t) => t.name === name);
      expect(tool).toBeDefined();
      expect(tool?.description).toBeTruthy();
      expect(tool?.inputSchema.type).toBe('object');
    }
  });

  it('executes get_project_summary and detects project layout', async () => {
    const summary = await handleToolCall('get_project_summary', {}, workspaceRoot);
    expect(summary.workspaceName).toBe('checkout_service');
    expect(summary.language).toContain('Python');
    expect(summary.testRunner).toContain('unittest');
    expect(summary.allowlistedTestCommands.length).toBeGreaterThan(0);
  });

  it('executes list_files strictly inside the workspace', async () => {
    const listing = await handleToolCall('list_files', {}, workspaceRoot);
    expect(listing.files.length).toBeGreaterThan(0);
    const filePaths = listing.files.map((f: any) => f.path);
    expect(filePaths).toContain('src/pricing.py');
    expect(filePaths).toContain('tests/test_pricing.py');
  });

  it('executes read_file for allowed workspace files', async () => {
    const fileData = await handleToolCall('read_file', { filePath: 'src/pricing.py' }, workspaceRoot);
    expect(fileData.filePath).toBe('src/pricing.py');
    expect(fileData.content).toContain('def apply_tier_discount');
  });

  it('executes search_code across workspace files', async () => {
    const search = await handleToolCall('search_code', { pattern: 'apply_tier_discount' }, workspaceRoot);
    expect(search.matchesCount).toBeGreaterThanOrEqual(1);
    expect(search.matches.some((m: any) => m.file.includes('pricing.py'))).toBe(true);
  });

  it('executes analyze_error and pinpoints the defect location', async () => {
    const analysis = await handleToolCall(
      'analyze_error',
      { logFilePath: 'logs/checkout_error.log' },
      workspaceRoot
    );
    expect(analysis.identifiedCulprit.file).toBe('src/pricing.py');
    expect(analysis.identifiedCulprit.function).toBe('apply_tier_discount');
    expect(analysis.identifiedCulprit.cause).toContain('discount rate');
  });

  it('rejects arbitrary, non-allowlisted shell commands in run_tests', async () => {
    await expect(
      handleToolCall('run_tests', { command: 'rm -rf /' }, workspaceRoot)
    ).rejects.toThrow(/Execution blocked by security policy/);

    await expect(
      handleToolCall('run_tests', { command: 'powershell -c whoami' }, workspaceRoot)
    ).rejects.toThrow(/Execution blocked by security policy/);
  });
});
