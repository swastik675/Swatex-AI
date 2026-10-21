import React from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Info,
  Clock,
  FileCheck,
} from 'lucide-react';
import { PatchProposal } from '../types';

interface DiffViewerProps {
  proposal: PatchProposal | null;
  onApprove: (patchId: string) => void;
  onReject: () => void;
  isApplying: boolean;
  isApplied: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  proposal,
  onApprove,
  onReject,
  isApplying,
  isApplied,
}) => {
  if (!proposal) {
    return (
      <div className="p-8 rounded-lg bg-devDark-900 border border-devDark-750 text-center text-slate-500 text-xs select-none">
        No active patch proposal. Run an investigation to diagnose bugs and generate a safe patch for review.
      </div>
    );
  }

  const diffLines = proposal.diff.split('\n');

  return (
    <div className="rounded-lg bg-devDark-900 border border-devDark-750 overflow-hidden shadow-lg">
      {/* Header with Patch Info */}
      <div className="p-3.5 bg-devDark-850 border-b border-devDark-750 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs text-slate-200">
            Proposed Code Patch
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-devDark-800 text-slate-400 border border-devDark-700">
            {proposal.patchId}
          </span>
          <span className="text-[10px] font-mono text-slate-300">
            {proposal.filePath}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            +{proposal.addedLinesCount} lines
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            -{proposal.removedLinesCount} lines
          </span>
        </div>
      </div>

      {/* Explanation Banner */}
      {proposal.explanation && (
        <div className="p-3 bg-indigo-950/20 border-b border-devDark-750 text-xs text-indigo-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{proposal.explanation}</p>
        </div>
      )}

      {/* Diff Code Container */}
      <div className="p-3 bg-devDark-950 font-mono text-xs overflow-x-auto max-h-72">
        {diffLines.map((line, idx) => {
          let lineClass = 'text-slate-400';
          if (line.startsWith('+') && !line.startsWith('+++')) {
            lineClass = 'diff-add px-2 py-0.5 rounded-sm block my-0.5 font-medium';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            lineClass = 'diff-del px-2 py-0.5 rounded-sm block my-0.5 font-medium';
          } else if (line.startsWith('@@')) {
            lineClass = 'diff-chunk px-2 py-0.5 rounded-sm block my-0.5';
          }

          return (
            <div key={idx} className={lineClass}>
              {line || ' '}
            </div>
          );
        })}
      </div>

      {/* Human-in-the-Loop Approval Action Bar */}
      <div className="p-3.5 bg-devDark-900 border-t border-devDark-750 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isApplied
              ? 'Patch has been verified and applied to workspace.'
              : 'Explicit user authorization is required before modifying any file on disk.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isApplied ? (
            <>
              <button
                onClick={onReject}
                disabled={isApplying}
                className="px-3 py-1.5 rounded-md bg-devDark-800 hover:bg-devDark-750 text-slate-400 hover:text-slate-200 text-xs font-medium border border-devDark-700 transition"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(proposal.patchId)}
                disabled={isApplying}
                className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
                <span>{isApplying ? 'Applying & Running Tests...' : 'Approve & Apply Patch'}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/30">
              <FileCheck className="w-4 h-4" />
              <span>Patch Successfully Applied</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
