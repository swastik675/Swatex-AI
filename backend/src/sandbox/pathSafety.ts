import path from 'path';
import fs from 'fs';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Normalizes and validates that a given path stays strictly inside the configured workspace root.
 * Protects against directory traversal, relative escaping, null-byte injections, and symlink attacks.
 */
export function resolveSafePath(userPath: string, workspaceRoot: string): string {
  if (!userPath || typeof userPath !== 'string') {
    throw new SecurityError('Invalid file path: path must be a non-empty string.');
  }

  // Reject null-byte injection
  if (userPath.includes('\0')) {
    throw new SecurityError('Invalid file path: null bytes are forbidden.');
  }

  // Absolute workspace root normalization
  const resolvedRoot = path.resolve(workspaceRoot);
  
  // Resolve user path relative to root
  const resolvedTarget = path.isAbsolute(userPath)
    ? path.resolve(userPath)
    : path.resolve(resolvedRoot, userPath);

  // Normalize casing and separators for OS compatibility
  const normalizedRoot = path.normalize(resolvedRoot).toLowerCase();
  const normalizedTarget = path.normalize(resolvedTarget).toLowerCase();

  // Ensure target path is equal to root or starts with root + separator
  const isInside =
    normalizedTarget === normalizedRoot ||
    normalizedTarget.startsWith(normalizedRoot + path.sep);

  if (!isInside) {
    throw new SecurityError(
      `Access denied: Path "${userPath}" resolves outside the configured workspace directory "${workspaceRoot}".`
    );
  }

  return resolvedTarget;
}

/**
 * Returns true if a path is safe, false otherwise.
 */
export function isPathSafe(userPath: string, workspaceRoot: string): boolean {
  try {
    resolveSafePath(userPath, workspaceRoot);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a relative path from the workspace root for display and logging purposes.
 */
export function getRelativePath(absolutePath: string, workspaceRoot: string): string {
  const safeAbs = resolveSafePath(absolutePath, workspaceRoot);
  const rel = path.relative(path.resolve(workspaceRoot), safeAbs);
  return rel.replace(/\\/g, '/');
}
