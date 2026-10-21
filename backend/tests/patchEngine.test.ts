import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import {
  createPatchProposal,
  applyApprovedPatch,
  rollbackPatch,
  getPendingPatch,
} from '../src/sandbox/patchEngine.js';

describe('Patch Proposal & Safe Application Engine', () => {
  const workspaceRoot = path.resolve('../sample-project/checkout_service');
  const testFileRel = 'src/test_patch_dummy.txt';
  const testFileAbs = path.resolve(workspaceRoot, testFileRel);

  beforeEach(() => {
    fs.writeFileSync(testFileAbs, 'line 1\noriginal bug line\nline 3\n', 'utf8');
  });

  afterEach(() => {
    if (fs.existsSync(testFileAbs)) {
      fs.unlinkSync(testFileAbs);
    }
    const bak = `${testFileAbs}.bak`;
    if (fs.existsSync(bak)) {
      fs.unlinkSync(bak);
    }
  });

  it('generates a clean unified diff without mutating the disk file', () => {
    const proposal = createPatchProposal(
      testFileRel,
      'corrected line',
      workspaceRoot,
      {
        isSnippetReplacement: true,
        originalSnippet: 'original bug line',
        explanation: 'Fixes dummy bug',
      }
    );

    expect(proposal.patchId).toMatch(/^patch_/);
    expect(proposal.diff).toContain('-original bug line');
    expect(proposal.diff).toContain('+corrected line');
    expect(proposal.addedLinesCount).toBe(1);
    expect(proposal.removedLinesCount).toBe(1);

    // Verify file on disk is UNTOUCHED
    const onDisk = fs.readFileSync(testFileAbs, 'utf8');
    expect(onDisk).toContain('original bug line');
  });

  it('applies an approved patch only when authorized by patchId', () => {
    const proposal = createPatchProposal(
      testFileRel,
      'corrected line',
      workspaceRoot,
      {
        isSnippetReplacement: true,
        originalSnippet: 'original bug line',
      }
    );

    const applyResult = applyApprovedPatch(proposal.patchId, workspaceRoot);
    expect(applyResult.success).toBe(true);
    expect(applyResult.backupPath).toBeDefined();

    // Now disk should have the patched content
    const updatedContent = fs.readFileSync(testFileAbs, 'utf8');
    expect(updatedContent).toContain('corrected line');
    expect(updatedContent).not.toContain('original bug line');

    // And .bak file should exist
    expect(fs.existsSync(applyResult.backupPath!)).toBe(true);

    // Rollback works
    const rolledBack = rollbackPatch(testFileRel, workspaceRoot);
    expect(rolledBack).toBe(true);
    const rolledBackContent = fs.readFileSync(testFileAbs, 'utf8');
    expect(rolledBackContent).toContain('original bug line');
  });

  it('rejects patch application if target file was modified unexpectedly', () => {
    const proposal = createPatchProposal(
      testFileRel,
      'corrected line',
      workspaceRoot,
      {
        isSnippetReplacement: true,
        originalSnippet: 'original bug line',
      }
    );

    // Mutate file externally before approval
    fs.writeFileSync(testFileAbs, 'tampered file content', 'utf8');

    expect(() => {
      applyApprovedPatch(proposal.patchId, workspaceRoot);
    }).toThrow(/Patch safety verification failed/);
  });
});
