import {
  BedrockRuntimeClient,
  ConverseCommand,
  Tool,
} from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient, getBedrockConfig } from './bedrockClient.js';
import { MCP_TOOL_DEFINITIONS, handleToolCall } from '../mcp/tools.js';

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
  patchProposal?: any;
  testResults?: any;
  timeline: AgentStepTrace[];
  isVerified: boolean;
  requiresApproval: boolean;
}

/**
 * Maps MCP Tool definitions to AWS Bedrock Converse ToolConfig specifications
 */
function getBedrockToolConfigs(): Tool[] {
  return MCP_TOOL_DEFINITIONS.map((tool) => ({
    toolSpec: {
      name: tool.name,
      description: tool.description,
      inputSchema: {
        json: tool.inputSchema,
      },
    },
  }));
}

/**
 * Runs the AI agent debugging loop powered by Amazon Bedrock
 */
export async function runBedrockAgent(
  userPrompt: string,
  workspaceRoot: string,
  maxSteps: number = 8
): Promise<AgentExecutionResult> {
  const config = getBedrockConfig();
  const client = getBedrockClient();
  const timeline: AgentStepTrace[] = [];
  const tools = getBedrockToolConfigs();

  const systemPrompt = [
    {
      text: `You are Swatex AI, an elite autonomous debugging engineer.
Your task is to investigate a project, identify bugs, inspect error logs, propose a minimal safe patch, wait for user review, and verify test passes.

Follow this systematic procedure:
1. Call "get_project_summary" and "list_files" to inspect the project layout.
2. Call "analyze_error" or "read_file" on relevant logs or source files to isolate the bug and exact root cause.
3. Call "propose_patch" with the minimal correct code change. NEVER assume a patch is applied automatically; propose_patch returns a patch proposal requiring user approval.
4. Do NOT attempt to run tests after a patch proposal until user approves.
5. Provide concise, high-signal explanations with file names and line numbers.`,
    },
  ];

  const messages: any[] = [
    {
      role: 'user',
      content: [{ text: userPrompt }],
    },
  ];

  let stepNumber = 0;
  let finalMessage = '';
  let patchProposal: any = null;
  let rootCause: any = null;
  let testResults: any = null;

  while (stepNumber < maxSteps) {
    stepNumber++;
    const stepStart = Date.now();

    const command = new ConverseCommand({
      modelId: config.modelId,
      system: systemPrompt,
      messages,
      toolConfig: {
        tools,
      },
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.1,
      },
    });

    const response = await client.send(command);
    const stopReason = response.stopReason;
    const outputMessage = response.output?.message;

    if (!outputMessage) {
      break;
    }

    messages.push(outputMessage);

    // Extract text responses
    for (const item of outputMessage.content || []) {
      if (item.text) {
        finalMessage += (finalMessage ? '\n\n' : '') + item.text;
        timeline.push({
          stepNumber,
          timestamp: new Date().toISOString(),
          type: 'thought',
          message: item.text,
        });
      }
    }

    // Process tool calls if any
    const toolUses = (outputMessage.content || []).filter((c: any) => c.toolUse);

    if (toolUses.length === 0 || stopReason === 'end_turn') {
      // Finished agent turns
      break;
    }

    const toolResultContents: any[] = [];

    for (const item of toolUses) {
      const toolUse = item.toolUse;
      if (!toolUse || !toolUse.name) {
        continue;
      }

      const toolName = toolUse.name;
      const toolInput: Record<string, any> = (typeof toolUse.input === 'object' && toolUse.input !== null)
        ? (toolUse.input as Record<string, any>)
        : {};
      const toolUseId = toolUse.toolUseId || `call_${Date.now()}`;

      const tStart = Date.now();
      timeline.push({
        stepNumber,
        timestamp: new Date().toISOString(),
        type: 'tool_call',
        toolName,
        toolInput,
      });

      let toolOutput: any;
      try {
        toolOutput = await handleToolCall(toolName, toolInput, workspaceRoot);

        // Keep track of key outputs
        if (toolName === 'analyze_error' && toolOutput.identifiedCulprit) {
          rootCause = {
            culpritFile: toolOutput.identifiedCulprit.file,
            culpritLine: toolOutput.identifiedCulprit.line,
            explanation: toolOutput.identifiedCulprit.cause,
          };
        }

        if (toolName === 'propose_patch') {
          patchProposal = toolOutput;
          timeline.push({
            stepNumber,
            timestamp: new Date().toISOString(),
            type: 'patch_proposed',
            toolOutput,
            message: `Patch proposed for ${toolOutput.filePath}. Pending user authorization.`,
          });
        }

        if (toolName === 'run_tests') {
          testResults = toolOutput;
        }

        timeline.push({
          stepNumber,
          timestamp: new Date().toISOString(),
          type: 'tool_result',
          toolName,
          toolOutput,
          durationMs: Date.now() - tStart,
        });
      } catch (err: any) {
        toolOutput = { error: err.message };
        timeline.push({
          stepNumber,
          timestamp: new Date().toISOString(),
          type: 'error',
          toolName,
          message: err.message,
          durationMs: Date.now() - tStart,
        });
      }

      toolResultContents.push({
        toolResult: {
          toolUseId,
          content: [
            {
              json: toolOutput,
            },
          ],
        },
      });
    }

    // Feed tool results back
    messages.push({
      role: 'user',
      content: toolResultContents,
    });

    // If a patch was proposed, stop the automated loop to require user approval
    if (patchProposal) {
      break;
    }
  }

  return {
    provider: 'aws_bedrock',
    modelId: config.modelId,
    completed: true,
    finalMessage:
      finalMessage ||
      'Swatex AI completed the investigation, diagnosed the bug, and formulated a patch proposal for your review.',
    rootCauseAnalysis: rootCause,
    patchProposal,
    testResults,
    timeline,
    isVerified: testResults ? testResults.passed : false,
    requiresApproval: Boolean(patchProposal && patchProposal.status === 'PENDING_APPROVAL'),
  };
}
