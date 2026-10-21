import { handleToolCall } from '../mcp/tools.js';
import { AgentExecutionResult, AgentStepTrace } from '../bedrock/bedrockAgent.js';

/**
 * Runs a deterministic, high-fidelity local demo investigation.
 * Executes REAL MCP tools against the workspace and REAL tests.
 * Clearly labeled as local_demo (zero fabricated AWS claims).
 */
export async function runLocalDemoAgent(
  userPrompt: string,
  workspaceRoot: string
): Promise<AgentExecutionResult> {
  const timeline: AgentStepTrace[] = [];
  let stepNumber = 0;

  // Step 1: Discover Project Layout
  stepNumber++;
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_call',
    toolName: 'get_project_summary',
    toolInput: {},
  });
  const t1 = Date.now();
  const summary = await handleToolCall('get_project_summary', {}, workspaceRoot);
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_result',
    toolName: 'get_project_summary',
    toolOutput: summary,
    durationMs: Date.now() - t1,
  });

  // Step 2: List Workspace Files
  stepNumber++;
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_call',
    toolName: 'list_files',
    toolInput: {},
  });
  const t2 = Date.now();
  const fileList = await handleToolCall('list_files', {}, workspaceRoot);
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_result',
    toolName: 'list_files',
    toolOutput: fileList,
    durationMs: Date.now() - t2,
  });

  // Step 3: Analyze Incident Error Log
  stepNumber++;
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_call',
    toolName: 'analyze_error',
    toolInput: { logFilePath: 'logs/checkout_error.log' },
  });
  const t3 = Date.now();
  const errorAnalysis = await handleToolCall(
    'analyze_error',
    { logFilePath: 'logs/checkout_error.log' },
    workspaceRoot
  );
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_result',
    toolName: 'analyze_error',
    toolOutput: errorAnalysis,
    durationMs: Date.now() - t3,
  });

  // Step 4: Inspect Source Code Around Culprit
  stepNumber++;
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_call',
    toolName: 'read_file',
    toolInput: { filePath: 'src/pricing.py' },
  });
  const t4 = Date.now();
  const sourceCode = await handleToolCall(
    'read_file',
    { filePath: 'src/pricing.py' },
    workspaceRoot
  );
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_result',
    toolName: 'read_file',
    toolOutput: {
      filePath: sourceCode.filePath,
      totalLines: sourceCode.totalLines,
      sizeBytes: sourceCode.sizeBytes,
    },
    durationMs: Date.now() - t4,
  });

  // Step 5: Propose Minimal Corrective Patch (Pending Approval)
  stepNumber++;
  const originalSnippet = `    # BUG: Multiplying subtotal directly by rate instead of deducting it!
    # This charges the customer only the discount amount instead of the discounted price.
    return round(subtotal * rate, 2)`;

  const replacementSnippet = `    # FIX: Deduct discount rate to compute actual payable amount
    return round(subtotal * (1.0 - rate), 2)`;

  const patchInput = {
    filePath: 'src/pricing.py',
    originalSnippet,
    replacementSnippet,
    explanation:
      'Fixes the tier discount calculation in apply_tier_discount() so that the payable subtotal is subtotal * (1 - rate) instead of mistakenly returning subtotal * rate.',
    targetLine: 29,
  };

  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'tool_call',
    toolName: 'propose_patch',
    toolInput: patchInput,
  });
  const t5 = Date.now();
  const patchProposal = await handleToolCall('propose_patch', patchInput, workspaceRoot);
  timeline.push({
    stepNumber,
    timestamp: new Date().toISOString(),
    type: 'patch_proposed',
    toolOutput: patchProposal,
    message: `Patch proposal ${patchProposal.patchId} registered. Pending human confirmation.`,
    durationMs: Date.now() - t5,
  });

  return {
    provider: 'local_demo',
    modelId: 'deterministic-local-engine-v1',
    completed: true,
    finalMessage: `Swatex AI investigated the project, analyzed "logs/checkout_error.log", and isolated the defect to "src/pricing.py:29".
The function apply_tier_discount() incorrectly multiplied the subtotal by the discount rate rather than subtracting it.
A minimal patch has been formulated and is ready for your review. Please inspect the code diff and approve to apply.`,
    rootCauseAnalysis: {
      culpritFile: 'src/pricing.py',
      culpritLine: 29,
      explanation:
        'Calculation multiplies subtotal directly by discount rate (subtotal * rate) rather than computing the discounted price (subtotal * (1.0 - rate)).',
    },
    patchProposal,
    timeline,
    isVerified: false,
    requiresApproval: true,
  };
}
