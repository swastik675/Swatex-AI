import React from 'react';
import {
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react';
import { TestExecutionResult } from '../types';

interface TestResultsPanelProps {
  results: TestExecutionResult | null;
  isRunning: boolean;
  onRunAgain: () => void;
}

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({
  results,
  isRunning,
  onRunAgain,
}) => {
  return (
    <div className="rounded-lg bg-devDark-900 border border-devDark-750 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-3.5 bg-devDark-850 border-b border-devDark-750 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-xs text-slate-200">
            Automated Test Execution
          </span>
          {results && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                results.passed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {results.passed ? 'TESTS PASSED (Exit Code: 0)' : `TESTS FAILED (Exit Code: ${results.exitCode})`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {results?.durationMs !== undefined && (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-devDark-800 px-2 py-0.5 rounded border border-devDark-750">
              <Clock className="w-3 h-3" />
              {results.durationMs}ms
            </span>
          )}
          <button
            onClick={onRunAgain}
            disabled={isRunning}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-devDark-800 hover:bg-devDark-750 text-slate-300 text-xs font-medium border border-devDark-700 transition disabled:opacity-50"
            title="Re-run allowlisted test suite"
          >
            <Play className={`w-3 h-3 text-cyan-400 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Re-run Tests'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="p-3 bg-devDark-950 font-mono text-xs overflow-x-auto min-h-[140px] max-h-64">
        {results ? (
          <div>
            <div className="text-slate-500 text-[11px] mb-2">
              $ {results.command}
            </div>
            <pre className={`whitespace-pre-wrap ${results.passed ? 'text-emerald-300' : 'text-slate-300'}`}>
              {results.stdout || results.stderr || 'No console output.'}
            </pre>
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-slate-500 text-xs">
            No test execution on record. Run tests or approve a patch to verify.
          </div>
        )}
      </div>
    </div>
  );
};
