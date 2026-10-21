import path from 'path';
import fs from 'fs';
import { runBedrockAgent, AgentExecutionResult } from '../bedrock/bedrockAgent.js';
import { runLocalDemoAgent } from './localDemoAgent.js';
import { handleToolCall } from '../mcp/tools.js';
import { checkBedrockHealth } from '../bedrock/bedrockClient.js';

export interface ApprovalExecutionResult {
  patchResult: any;
  testResult: any;
  isVerified: boolean;
  message: string;
}

export class AgentController {
  private workspaceRoot: string;

  constructor(initialWorkspaceRoot: string) {
    this.workspaceRoot = path.resolve(initialWorkspaceRoot);
  }

  getWorkspace(): string {
    return this.workspaceRoot;
  }

  setWorkspace(newRoot: string): void {
    this.workspaceRoot = path.resolve(newRoot);
  }

  /**
   * Dispatches investigation based on requested provider mode ('aws_bedrock' | 'local_demo')
   */
  async investigate(prompt: string, requestedMode: 'aws_bedrock' | 'local_demo'): Promise<AgentExecutionResult> {
    if (requestedMode === 'aws_bedrock') {
      const health = await checkBedrockHealth();
      if (!health.isConnected) {
        throw new Error(
          `AWS Bedrock mode unavailable: ${health.statusMessage} ${health.diagnostics || ''}. Switch to Local Demo Mode to test the workflow without AWS credentials.`
        );
      }
      return await runBedrockAgent(prompt, this.workspaceRoot);
    }

    // Default: Local Deterministic Demo Mode using Real Local MCP Tools & Real Tests
    return await runLocalDemoAgent(prompt, this.workspaceRoot);
  }

  /**
   * Applies an approved patch and immediately executes allowlisted tests
   */
  async approveAndVerify(patchId: string): Promise<ApprovalExecutionResult> {
    // 1. Apply patch
    const patchResult = await handleToolCall('apply_patch', { patchId }, this.workspaceRoot);

    // 2. Run real tests against modified workspace
    const testResult = await handleToolCall('run_tests', {}, this.workspaceRoot);

    const isVerified = Boolean(testResult.passed);

    return {
      patchResult,
      testResult,
      isVerified,
      message: isVerified
        ? `Patch applied successfully. All unit tests verified PASSING (Exit Code: ${testResult.exitCode}).`
        : `Patch applied, but automated tests reported failures. Further review required.`,
    };
  }

  /**
   * Resets sample workspace to pristine seeded-bug state
   */
  resetSampleWorkspace(): { success: boolean; message: string } {
    const pristineDir = path.resolve(this.workspaceRoot, '..', 'checkout_service_pristine');

    if (!fs.existsSync(pristineDir)) {
      throw new Error(`Pristine sample backup not found at ${pristineDir}`);
    }

    // Copy files from pristine to workspace
    function copyRecursive(src: string, dest: string) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    copyRecursive(pristineDir, this.workspaceRoot);

    // Remove any backup files
    const bakFile = path.join(this.workspaceRoot, 'src', 'pricing.py.bak');
    if (fs.existsSync(bakFile)) {
      fs.unlinkSync(bakFile);
    }

    return {
      success: true,
      message: 'Sample checkout service workspace restored to initial seeded-bug state.',
    };
  }
}
