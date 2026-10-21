import { spawn } from 'child_process';
import path from 'path';

export interface TestExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  command: string;
  timestamp: string;
}

// Strict allowlist of permitted test execution commands
// Exact command tokens allowed
export const ALLOWED_COMMAND_PATTERNS = [
  'python -m unittest discover -s tests',
  'python -m unittest discover -s tests -p "test_*.py"',
  'python -m unittest discover -s tests -p test_*.py',
  'python -m unittest tests/test_pricing.py',
  'python -m unittest',
  'node --test',
  'npm test',
];

/**
 * Validates if a test command is permitted by the allowlist.
 */
export function isCommandAllowed(command: string): boolean {
  const trimmed = command.trim();
  return ALLOWED_COMMAND_PATTERNS.some(allowed => 
    trimmed === allowed || trimmed.replace(/"/g, '') === allowed.replace(/"/g, '')
  );
}

/**
 * Safely executes an allowlisted test command in the designated workspace root.
 * Enforces timeout and strict process boundaries.
 */
export async function executeAllowlistedTest(
  command: string,
  workspaceRoot: string,
  timeoutMs: number = 15000
): Promise<TestExecutionResult> {
  const trimmed = command.trim();

  if (!isCommandAllowed(trimmed)) {
    throw new Error(
      `Execution blocked by security policy: Command "${command}" is not on the test allowlist. Permitted commands: [${ALLOWED_COMMAND_PATTERNS.join(', ')}]`
    );
  }

  const startTime = Date.now();
  const cwd = path.resolve(workspaceRoot);

  return new Promise((resolve) => {
    // Split command for spawn (using cmd / powershell wrapper only for Windows builtins safely)
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/sh';
    const shellArg = isWindows ? '/c' : '-c';
    const cmdToRun = isWindows ? trimmed.replace(/"test_\*\.py"/g, 'test_*.py') : trimmed;

    const child = spawn(shell, [shellArg, cmdToRun], {
      cwd,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        FORCE_COLOR: '0',
      },
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let killedDueToTimeout = false;

    const timer = setTimeout(() => {
      killedDueToTimeout = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      resolve({
        success: false,
        exitCode: -1,
        stdout,
        stderr: stderr + `\nProcess error: ${err.message}`,
        durationMs,
        command: trimmed,
        timestamp: new Date().toISOString(),
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      const finalExitCode = killedDueToTimeout ? -1 : (code ?? 0);
      const timeoutNotice = killedDueToTimeout ? '\n[DevPilot Execution Timeout: exceeded limit]' : '';
      const cleanStdout = (stdout + timeoutNotice).replace(/\u001b\[[0-9;]*m/g, '');
      const cleanStderr = stderr.replace(/\u001b\[[0-9;]*m/g, '');

      resolve({
        success: finalExitCode === 0,
        exitCode: finalExitCode,
        stdout: cleanStdout,
        stderr: cleanStderr,
        durationMs,
        command: trimmed,
        timestamp: new Date().toISOString(),
      });
    });
  });
}
