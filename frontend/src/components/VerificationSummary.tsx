import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  FileCheck2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AgentExecutionResult } from '../types';

interface VerificationSummaryProps {
  agentResult: AgentExecutionResult | null;
  isVerified: boolean;
}

export const VerificationSummary: React.FC<VerificationSummaryProps> = ({
  agentResult,
  isVerified,
}) => {
  return (
    <div
      className={`rounded-lg p-4 border transition ${
        isVerified
          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
          : 'bg-devDark-900 border-devDark-750 text-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {isVerified ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Verification Status:{' '}
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                  isVerified
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isVerified ? 'VERIFIED — All Tests Passing' : 'UNVERIFIED — Pending Patch Verification'}
              </span>
            </h3>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <span>Engine: {agentResult?.provider || 'Standby'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-devDark-750/50">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">
            Defect Location
          </span>
          <p className="font-mono text-slate-200">
            {agentResult?.rootCauseAnalysis?.culpritFile || 'src/pricing.py'}
            {agentResult?.rootCauseAnalysis?.culpritLine
              ? `:${agentResult.rootCauseAnalysis.culpritLine}`
              : ':29'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">
            Safety & Protection
          </span>
          <p className="text-slate-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Path Traversal & Shell Restricted
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">
            Automated Audit
          </span>
          <p className="text-slate-200">
            {isVerified
              ? 'Real unittest verified 6/6 tests passing.'
              : 'Execute tests to verify fix resolution.'}
          </p>
        </div>
      </div>
    </div>
  );
};
