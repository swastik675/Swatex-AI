import { describe, it, expect } from 'vitest';
import path from 'path';
import { resolveSafePath, isPathSafe, SecurityError } from '../src/sandbox/pathSafety.js';

describe('Path Traversal Security & Sandbox', () => {
  const mockWorkspace = path.resolve('./sample-project/checkout_service');

  it('allows valid relative file paths inside the workspace', () => {
    const safe = resolveSafePath('src/pricing.py', mockWorkspace);
    expect(safe).toBe(path.resolve(mockWorkspace, 'src/pricing.py'));
  });

  it('allows valid subfolder paths', () => {
    const safe = resolveSafePath('logs/checkout_error.log', mockWorkspace);
    expect(safe).toBe(path.resolve(mockWorkspace, 'logs/checkout_error.log'));
  });

  it('strictly rejects path traversal using "../" attempting to escape workspace', () => {
    expect(() => {
      resolveSafePath('../../../Windows/System32/calc.exe', mockWorkspace);
    }).toThrow(SecurityError);

    expect(isPathSafe('../../package.json', mockWorkspace)).toBe(false);
  });

  it('strictly rejects absolute paths outside the workspace', () => {
    const outsidePath = process.platform === 'win32' ? 'C:\\Windows\\win.ini' : '/etc/passwd';
    expect(() => {
      resolveSafePath(outsidePath, mockWorkspace);
    }).toThrow(SecurityError);
  });

  it('rejects null byte injection attempts', () => {
    expect(() => {
      resolveSafePath('src/pricing.py\0.jpg', mockWorkspace);
    }).toThrow(SecurityError);
  });
});
