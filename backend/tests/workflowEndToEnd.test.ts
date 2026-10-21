import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { AgentController } from '../src/agent/agentController.js';
import { handleToolCall } from '../src/mcp/tools.js';
import { checkBedrockHealth } from '../src/bedrock/bedrockClient.js';

describe('End-to-End Bug Detection, Patch Approval & Verification Workflow', () => {
  const workspaceRoot = path.resolve('../sample-project/checkout_service');
  const agentController = new AgentController(workspaceRoot);

  beforeAll(() => {
    // Ensure clean state before tests
    agentController.resetSampleWorkspace();
  });

  afterAll(() => {
    // Leave workspace in clean state
    agentController.resetSampleWorkspace();
  });

  it('verifies that the seeded sample project tests FAIL initially', async () => {
    const testResult = await handleToolCall('run_tests', {}, workspaceRoot);
    expect(testResult.passed).toBe(false);
    expect(testResult.exitCode).toBe(1);
    expect(testResult.stderr || testResult.stdout).toMatch(/FAIL/i);
  });

  it('runs agent investigation and generates a validated patch proposal', async () => {
    const prompt = 'Find the bug, explain its cause, propose a fix, and run the tests.';
    const result = await agentController.investigate(prompt, 'local_demo');

    expect(result.provider).toBe('local_demo');
    expect(result.completed).toBe(true);
    expect(result.rootCauseAnalysis).toBeDefined();
    expect(result.rootCauseAnalysis?.culpritFile).toContain('pricing.py');
    expect(result.requiresApproval).toBe(true);
    expect(result.patchProposal).toBeDefined();
    expect(result.patchProposal.patchId).toMatch(/^patch_/);
    expect(result.patchProposal.diff).toContain('-    return round(subtotal * rate, 2)');
    expect(result.patchProposal.diff).toContain('+    return round(subtotal * (1.0 - rate), 2)');
  });

  it('applies the approved patch and verifies tests PASS on real execution', async () => {
    // 1. Run investigation to get a fresh patch ID
    const inv = await agentController.investigate('Find and fix bug', 'local_demo');
    const patchId = inv.patchProposal.patchId;

    // 2. Approve and apply
    const approval = await agentController.approveAndVerify(patchId);

    expect(approval.patchResult.status).toBe('APPLIED');
    expect(approval.testResult.passed).toBe(true);
    expect(approval.testResult.exitCode).toBe(0);
    expect(approval.isVerified).toBe(true);
    expect(approval.testResult.stderr || approval.testResult.stdout).toContain('OK');
  });

  it('resets the sample workspace back to its seeded-bug state', async () => {
    const reset = agentController.resetSampleWorkspace();
    expect(reset.success).toBe(true);

    // Verify tests fail again after reset
    const testResult = await handleToolCall('run_tests', {}, workspaceRoot);
    expect(testResult.passed).toBe(false);
    expect(testResult.exitCode).toBe(1);
  });

  it('reports Bedrock unconfigured status accurately without fabricating success', async () => {
    const health = await checkBedrockHealth();
    // Since AWS credentials are not set in this test environment
    expect(health.isConnected).toBe(false);
    expect(health.statusMessage).toContain('AWS credentials not detected');
  });
});
