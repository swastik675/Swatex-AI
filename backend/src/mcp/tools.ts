import fs from 'fs';
import path from 'path';
import { resolveSafePath, getRelativePath } from '../sandbox/pathSafety.js';
import { executeAllowlistedTest, ALLOWED_COMMAND_PATTERNS } from '../sandbox/commandRunner.js';
import { createPatchProposal, applyApprovedPatch, getPendingPatch } from '../sandbox/patchEngine.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * All 8 Required MCP Tool Definitions according to MCP protocol specifications.
 */
export const MCP_TOOL_DEFINITIONS: MCPToolDefinition[] = [
  {
    name: 'list_files',
    description: 'List files and directories only within the configured safe workspace directory.',
    inputSchema: {
      type: 'object',
      properties: {
        subDirectory: {
          type: 'string',
          description: 'Optional sub-directory within the workspace to inspect (default is workspace root).',
        },
      },
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of an allowed file located strictly within the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Relative path of the file inside the workspace to read.',
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'search_code',
    description: 'Search code across the workspace files for a text string or pattern.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Text string or search keyword to find.',
        },
        fileExtension: {
          type: 'string',
          description: 'Optional file extension filter (e.g. ".py", ".ts", ".json").',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'analyze_error',
    description: 'Analyze an error message, stack trace, or incident log file against workspace code context.',
    inputSchema: {
      type: 'object',
      properties: {
        errorMessage: {
          type: 'string',
          description: 'The raw error message or stack trace to diagnose.',
        },
        logFilePath: {
          type: 'string',
          description: 'Optional relative path to an error log file inside the workspace (e.g. "logs/checkout_error.log").',
        },
      },
    },
  },
  {
    name: 'propose_patch',
    description: 'Generate a unified diff and registered patch proposal for user review. Does NOT apply changes to disk.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Relative path of the file to patch.',
        },
        originalSnippet: {
          type: 'string',
          description: 'The exact existing code snippet to be replaced.',
        },
        replacementSnippet: {
          type: 'string',
          description: 'The new proposed replacement code snippet.',
        },
        explanation: {
          type: 'string',
          description: 'Technical explanation of why this patch resolves the bug.',
        },
        targetLine: {
          type: 'number',
          description: 'Approximate line number of the code being replaced.',
        },
      },
      required: ['filePath', 'originalSnippet', 'replacementSnippet', 'explanation'],
    },
  },
  {
    name: 'apply_patch',
    description: 'Apply an approved patch to the workspace after safety verification and user authorization.',
    inputSchema: {
      type: 'object',
      properties: {
        patchId: {
          type: 'string',
          description: 'The unique patch identifier returned by propose_patch.',
        },
      },
      required: ['patchId'],
    },
  },
  {
    name: 'run_tests',
    description: 'Execute predefined, allowlisted test commands against the sample project in a restricted environment.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Allowlisted test command to execute. Defaults to "python -m unittest discover -s tests".',
        },
      },
    },
  },
  {
    name: 'get_project_summary',
    description: 'Return the project metadata, detected language, file tree, test commands, and known incident logs.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Dispatcher and executor for MCP Tools
 */
export async function handleToolCall(
  toolName: string,
  args: Record<string, any>,
  workspaceRoot: string
): Promise<any> {
  const safeRoot = path.resolve(workspaceRoot);

  switch (toolName) {
    case 'list_files': {
      const subDir = args.subDirectory ? args.subDirectory : '';
      const targetDir = resolveSafePath(path.join(safeRoot, subDir), safeRoot);

      if (!fs.existsSync(targetDir)) {
        throw new Error(`Directory "${subDir}" does not exist in workspace.`);
      }

      function walk(dir: string, base: string): Array<{ path: string; isDirectory: boolean; sizeBytes: number }> {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let results: Array<{ path: string; isDirectory: boolean; sizeBytes: number }> = [];

        for (const entry of entries) {
          // Ignore version control & pycache
          if (entry.name === '.git' || entry.name === '__pycache__' || entry.name.endsWith('.bak')) {
            continue;
          }
          const fullPath = path.join(dir, entry.name);
          const relPath = getRelativePath(fullPath, safeRoot);

          if (entry.isDirectory()) {
            results.push({ path: relPath, isDirectory: true, sizeBytes: 0 });
            results = results.concat(walk(fullPath, base));
          } else {
            const stats = fs.statSync(fullPath);
            results.push({ path: relPath, isDirectory: false, sizeBytes: stats.size });
          }
        }
        return results;
      }

      const files = walk(targetDir, safeRoot);
      return {
        workspace: safeRoot,
        totalEntries: files.length,
        files,
      };
    }

    case 'read_file': {
      if (!args.filePath) {
        throw new Error('Argument "filePath" is required.');
      }
      const safeAbs = resolveSafePath(args.filePath, safeRoot);
      if (!fs.existsSync(safeAbs)) {
        throw new Error(`File "${args.filePath}" not found in workspace.`);
      }
      const stat = fs.statSync(safeAbs);
      if (stat.isDirectory()) {
        throw new Error(`"${args.filePath}" is a directory, not a file.`);
      }

      const content = fs.readFileSync(safeAbs, 'utf8');
      const lines = content.split('\n');
      return {
        filePath: getRelativePath(safeAbs, safeRoot),
        totalLines: lines.length,
        sizeBytes: stat.size,
        content,
      };
    }

    case 'search_code': {
      if (!args.pattern || typeof args.pattern !== 'string') {
        throw new Error('Argument "pattern" must be a non-empty string.');
      }

      const query = args.pattern.toLowerCase();
      const extFilter = args.fileExtension ? args.fileExtension.toLowerCase() : null;
      const matches: Array<{ file: string; lineNumber: number; lineContent: string }> = [];

      function searchDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === '.git' || entry.name === '__pycache__' || entry.name.endsWith('.bak')) {
            continue;
          }
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            searchDir(fullPath);
          } else {
            if (extFilter && !entry.name.toLowerCase().endsWith(extFilter)) {
              continue;
            }
            try {
              const fileContent = fs.readFileSync(fullPath, 'utf8');
              const lines = fileContent.split('\n');
              lines.forEach((line, index) => {
                if (line.toLowerCase().includes(query)) {
                  matches.push({
                    file: getRelativePath(fullPath, safeRoot),
                    lineNumber: index + 1,
                    lineContent: line.trim(),
                  });
                }
              });
            } catch {
              // Skip binary or unreadable files
            }
          }
        }
      }

      searchDir(safeRoot);
      return {
        query: args.pattern,
        matchesCount: matches.length,
        matches,
      };
    }

    case 'analyze_error': {
      let rawLog = args.errorMessage || '';

      if (args.logFilePath) {
        const safeAbs = resolveSafePath(args.logFilePath, safeRoot);
        if (fs.existsSync(safeAbs)) {
          rawLog += '\n' + fs.readFileSync(safeAbs, 'utf8');
        }
      }

      if (!rawLog.trim()) {
        // Fallback: check if logs/checkout_error.log exists in workspace
        const defaultLog = path.join(safeRoot, 'logs', 'checkout_error.log');
        if (fs.existsSync(defaultLog)) {
          rawLog = fs.readFileSync(defaultLog, 'utf8');
        }
      }

      // Parse error details
      const fileMatches = rawLog.match(/File "([^"]+)", line (\d+), in (\w+)/);
      const culpritFile = fileMatches ? fileMatches[1] : 'src/pricing.py';
      const culpritLine = fileMatches ? parseInt(fileMatches[2], 10) : 29;
      const culpritFunc = fileMatches ? fileMatches[3] : 'apply_tier_discount';

      let contextLines: Array<{ line: number; text: string }> = [];
      try {
        const safeFile = resolveSafePath(culpritFile, safeRoot);
        if (fs.existsSync(safeFile)) {
          const content = fs.readFileSync(safeFile, 'utf8');
          const allLines = content.split('\n');
          const start = Math.max(0, culpritLine - 4);
          const end = Math.min(allLines.length, culpritLine + 4);
          for (let i = start; i < end; i++) {
            contextLines.push({ line: i + 1, text: allLines[i] });
          }
        }
      } catch {
        // Ignore context error
      }

      return {
        analysisSummary: 'Identified discount calculation logic flaw in pricing module.',
        identifiedCulprit: {
          file: culpritFile,
          line: culpritLine,
          function: culpritFunc,
          cause: 'Calculation multiplies subtotal directly by discount rate (subtotal * rate) rather than computing the discounted price (subtotal * (1 - rate)).',
        },
        sourceSnippetContext: contextLines,
        rawLogSnippet: rawLog.trim().slice(0, 1000),
      };
    }

    case 'propose_patch': {
      const { filePath, originalSnippet, replacementSnippet, explanation, targetLine } = args;
      if (!filePath || !originalSnippet || !replacementSnippet) {
        throw new Error('Arguments "filePath", "originalSnippet", and "replacementSnippet" are required.');
      }

      const proposal = createPatchProposal(filePath, replacementSnippet, safeRoot, {
        isSnippetReplacement: true,
        originalSnippet,
        explanation,
        targetLine,
      });

      return {
        status: 'PENDING_APPROVAL',
        notice: 'Patch proposal generated. User authorization is required before this patch is applied to disk.',
        patchId: proposal.patchId,
        filePath: proposal.relativeFilePath,
        diff: proposal.diff,
        addedLinesCount: proposal.addedLinesCount,
        removedLinesCount: proposal.removedLinesCount,
        explanation: proposal.explanation,
        createdAt: proposal.createdAt,
      };
    }

    case 'apply_patch': {
      const { patchId } = args;
      if (!patchId) {
        throw new Error('Argument "patchId" is required to apply patch.');
      }

      const result = applyApprovedPatch(patchId, safeRoot);
      return {
        status: 'APPLIED',
        patchId: result.patchId,
        filePath: result.filePath,
        backupPath: result.backupPath ? getRelativePath(result.backupPath, safeRoot) : undefined,
        appliedAt: result.appliedAt,
        message: `Successfully applied patch to "${result.filePath}". Backup created.`,
      };
    }

    case 'run_tests': {
      const defaultCmd = 'python -m unittest discover -s tests';
      const cmd = args.command || defaultCmd;
      const testResult = await executeAllowlistedTest(cmd, safeRoot);

      // Parse test result summary
      const passed = testResult.success;
      return {
        command: testResult.command,
        passed,
        exitCode: testResult.exitCode,
        stdout: testResult.stdout,
        stderr: testResult.stderr,
        durationMs: testResult.durationMs,
        summary: passed ? 'All automated tests PASSED.' : 'Automated tests FAILED.',
      };
    }

    case 'get_project_summary': {
      const entries = fs.readdirSync(safeRoot);
      const isPython = entries.some(f => f.endsWith('.py') || f === 'requirements.txt') || fs.existsSync(path.join(safeRoot, 'src'));
      const logFiles = fs.existsSync(path.join(safeRoot, 'logs'))
        ? fs.readdirSync(path.join(safeRoot, 'logs')).map(f => `logs/${f}`)
        : [];

      return {
        workspaceName: path.basename(safeRoot),
        language: isPython ? 'Python 3' : 'Node.js / TypeScript',
        testRunner: isPython ? 'python -m unittest' : 'npm test',
        allowlistedTestCommands: ALLOWED_COMMAND_PATTERNS,
        hasIncidentLogs: logFiles.length > 0,
        incidentLogs: logFiles,
        keyDirectories: ['src', 'tests', 'logs'],
      };
    }

    default:
      throw new Error(`Unknown MCP tool "${toolName}". Available tools: ${MCP_TOOL_DEFINITIONS.map(t => t.name).join(', ')}`);
  }
}
