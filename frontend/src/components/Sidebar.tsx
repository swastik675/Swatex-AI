import React from 'react';
import {
  FolderGit2,
  Bug,
  RotateCcw,
  Play,
  ShieldCheck,
  Cpu,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileCode,
  FileSearch,
} from 'lucide-react';

interface SidebarProps {
  mode: 'aws_bedrock' | 'local_demo';
  onModeChange: (mode: 'aws_bedrock' | 'local_demo') => void;
  onSelectPrompt: (prompt: string) => void;
  onResetSample: () => void;
  onRunTestsDirectly: () => void;
  isInvestigating: boolean;
  isResetting: boolean;
  isTesting: boolean;
  hasBedrockCredentials: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mode,
  onModeChange,
  onSelectPrompt,
  onResetSample,
  onRunTestsDirectly,
  isInvestigating,
  isResetting,
  isTesting,
  hasBedrockCredentials,
}) => {
  const quickPrompts = [
    {
      label: 'Full Hackathon Workflow',
      desc: 'Investigate, propose fix, and verify tests',
      prompt: 'Find the bug, explain its cause, propose a fix, and run the tests.',
    },
    {
      label: 'Inspect Discount Bug',
      desc: 'Check customer tier discount calculation',
      prompt: 'Analyze src/pricing.py and verify customer loyalty discounts.',
    },
    {
      label: 'Diagnose Incident Log',
      desc: 'Trace error in logs/checkout_error.log',
      prompt: 'Analyze logs/checkout_error.log and identify why the transaction rolled back.',
    },
  ];

  return (
    <aside className="w-72 bg-devDark-900 border-r border-devDark-750 flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Provider Selector Section */}
      <div className="p-3.5 border-b border-devDark-750">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
          Execution Engine
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-devDark-950 rounded-lg border border-devDark-800">
          <button
            onClick={() => onModeChange('local_demo')}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition text-xs ${
              mode === 'local_demo'
                ? 'bg-devDark-800 text-cyan-300 font-semibold shadow-sm border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4 mb-1 text-cyan-400" />
            <span>Local Demo</span>
            <span className="text-[9px] text-slate-400 font-mono">Real Tools</span>
          </button>

          <button
            onClick={() => onModeChange('aws_bedrock')}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition text-xs ${
              mode === 'aws_bedrock'
                ? 'bg-devDark-800 text-amber-300 font-semibold shadow-sm border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 mb-1 text-amber-400" />
            <span>AWS Bedrock</span>
            <span className="text-[9px] text-slate-400 font-mono">Claude 3.5</span>
          </button>
        </div>

        {mode === 'aws_bedrock' && !hasBedrockCredentials && (
          <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-snug">
            ⚠️ AWS credentials not detected. The request will diagnose setup instructions or you can switch to Local Demo.
          </div>
        )}
      </div>

      {/* Target Project Overview */}
      <div className="p-3.5 border-b border-devDark-750">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Sample Workspace
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Python 3
          </span>
        </div>

        <div className="p-2.5 bg-devDark-950 rounded-lg border border-devDark-800">
          <div className="flex items-center gap-2 mb-1.5">
            <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate">
              checkout_service
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            E-commerce pricing & loyalty discount calculation microservice.
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-devDark-850">
            <span>Tests: unittest</span>
            <span className="text-rose-400 flex items-center gap-1">
              <Bug className="w-3 h-3" /> Seeded Bug
            </span>
          </div>
        </div>
      </div>

      {/* Quick Prompts Section */}
      <div className="p-3.5 border-b border-devDark-750 flex-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
          Quick Prompts
        </label>
        <div className="space-y-2">
          {quickPrompts.map((qp, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt(qp.prompt)}
              disabled={isInvestigating}
              className="w-full text-left p-2.5 rounded-lg bg-devDark-950 hover:bg-devDark-850 border border-devDark-800 hover:border-indigo-500/40 transition group disabled:opacity-50"
            >
              <div className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                <span>{qp.label}</span>
                <Play className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {qp.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Quick Actions */}
      <div className="p-3.5 border-b border-devDark-750 space-y-2 bg-devDark-900/60">
        <button
          onClick={onRunTestsDirectly}
          disabled={isTesting || isInvestigating}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-devDark-800 hover:bg-devDark-750 text-slate-200 text-xs font-medium border border-devDark-700 transition disabled:opacity-50"
          title="Run allowlisted unittest command against sample project"
        >
          <Play className={`w-3.5 h-3.5 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
          <span>{isTesting ? 'Running Tests...' : 'Run Unit Tests Live'}</span>
        </button>

        <button
          onClick={onResetSample}
          disabled={isResetting || isInvestigating}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-devDark-800 hover:bg-devDark-750 text-slate-300 hover:text-rose-300 text-xs font-medium border border-devDark-700 transition disabled:opacity-50"
          title="Revert workspace files back to initial seeded bug state"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-rose-400 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset Sample Bug'}</span>
        </button>
      </div>

      {/* Security Sandbox Footer Indicator */}
      <div className="p-3 bg-devDark-950 text-[10px] text-slate-400 border-t border-devDark-800 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="leading-tight">
          Sandbox Active: Workspace path isolation & command allowlist enforced.
        </span>
      </div>
    </aside>
  );
};
