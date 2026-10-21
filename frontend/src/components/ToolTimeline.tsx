import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
  GitPullRequest,
  CheckSquare,
  Search,
  FileText,
  Activity,
} from 'lucide-react';
import { AgentStepTrace } from '../types';

interface ToolTimelineProps {
  timeline: AgentStepTrace[];
  isInvestigating: boolean;
}

export const ToolTimeline: React.FC<ToolTimelineProps> = ({
  timeline,
  isInvestigating,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const getToolIcon = (toolName?: string, type?: string) => {
    if (type === 'patch_proposed') return <GitPullRequest className="w-4 h-4 text-emerald-400" />;
    switch (toolName) {
      case 'get_project_summary':
      case 'list_files':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'search_code':
        return <Search className="w-4 h-4 text-indigo-400" />;
      case 'analyze_error':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'propose_patch':
        return <GitPullRequest className="w-4 h-4 text-emerald-400" />;
      case 'apply_patch':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'run_tests':
        return <Wrench className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          Tool Execution Timeline ({timeline.length} actions)
        </span>
        {isInvestigating && (
          <span className="flex items-center gap-1.5 text-xs text-cyan-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Agent reasoning & executing tools...
          </span>
        )}
      </div>

      {timeline.length === 0 && !isInvestigating && (
        <div className="p-6 rounded-lg bg-devDark-900 border border-devDark-750 text-center text-slate-400 text-xs">
          No tool executions recorded yet. Launch an investigation or prompt Swatex AI to begin.
        </div>
      )}

      <div className="space-y-2">
        {timeline.map((step, idx) => {
          const isExpanded = expandedSteps[step.stepNumber];
          const isPatch = step.type === 'patch_proposed';

          return (
            <div
              key={idx}
              className={`rounded-lg border transition ${
                isPatch
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-devDark-900 border-devDark-750 hover:border-devDark-600'
              }`}
            >
              {/* Header Row */}
              <div
                onClick={() => toggleStep(step.stepNumber)}
                className="p-3 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-devDark-800 border border-devDark-700 flex items-center justify-center text-[10px] font-mono text-slate-400 shrink-0">
                    {step.stepNumber}
                  </span>
                  <div className="p-1 rounded bg-devDark-800 border border-devDark-700 shrink-0">
                    {getToolIcon(step.toolName, step.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-medium text-slate-200">
                      {step.toolName || step.type}
                    </span>
                    {step.message && (
                      <p className="text-[11px] text-slate-400 truncate max-w-md">
                        {step.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step.durationMs !== undefined && (
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-devDark-800 px-2 py-0.5 rounded border border-devDark-750">
                      <Clock className="w-3 h-3" />
                      {step.durationMs}ms
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-devDark-800 text-[11px] font-mono space-y-2">
                  {step.toolInput && (
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">
                        Input Arguments:
                      </span>
                      <pre className="mt-1 p-2 rounded bg-devDark-950 border border-devDark-800 text-slate-300 overflow-x-auto">
                        {JSON.stringify(step.toolInput, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.toolOutput && (
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">
                        Tool Output:
                      </span>
                      <pre className="mt-1 p-2 rounded bg-devDark-950 border border-devDark-800 text-slate-300 overflow-x-auto max-h-48">
                        {JSON.stringify(step.toolOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
