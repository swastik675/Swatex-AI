import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  AlertCircle,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Bug,
} from 'lucide-react';
import { AgentExecutionResult } from '../types';

interface ChatPanelProps {
  prompt: string;
  setPrompt: (p: string) => void;
  onSend: (customPrompt?: string) => void;
  isInvestigating: boolean;
  agentResult: AgentExecutionResult | null;
  error: string | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  prompt,
  setPrompt,
  onSend,
  isInvestigating,
  agentResult,
  error,
}) => {
  const [inputVal, setInputVal] = useState(prompt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isInvestigating) return;
    onSend(inputVal);
  };

  return (
    <div className="flex flex-col h-full bg-devDark-900 border-r border-devDark-750">
      {/* Investigation Status Header */}
      <div className="p-3.5 border-b border-devDark-750 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Autonomous Investigation
          </span>
        </div>
        {agentResult?.provider && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              agentResult.provider === 'aws_bedrock'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
            }`}
          >
            {agentResult.provider === 'aws_bedrock' ? 'AWS Bedrock Engine' : 'Local Deterministic'}
          </span>
        )}
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* User Prompt Bubble if available */}
        {prompt && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0 mt-0.5">
              YOU
            </div>
            <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-xs text-slate-200 leading-relaxed max-w-[90%]">
              {prompt}
            </div>
          </div>
        )}

        {/* Loading State Indicator */}
        {isInvestigating && (
          <div className="flex items-start gap-2.5 animate-pulse">
            <div className="w-6 h-6 rounded bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0 mt-0.5">
              AI
            </div>
            <div className="p-3 rounded-lg bg-devDark-950 border border-devDark-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-medium text-cyan-300">
                  Swatex is actively inspecting the workspace...
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calling MCP tools (list_files, analyze_error, search_code) to isolate defect and formulate safe fix.
              </p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Investigation Error</span>
              <p className="text-slate-300 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Root Cause Card */}
        {agentResult?.rootCauseAnalysis && (
          <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-amber-400" />
                Root Cause Diagnosed
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {agentResult.rootCauseAnalysis.culpritFile}
                {agentResult.rootCauseAnalysis.culpritLine ? `:${agentResult.rootCauseAnalysis.culpritLine}` : ''}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {agentResult.rootCauseAnalysis.explanation}
            </p>
          </div>
        )}

        {/* Agent Response Message */}
        {agentResult?.finalMessage && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0 mt-0.5">
              AI
            </div>
            <div className="p-3.5 rounded-lg bg-devDark-950 border border-devDark-800 text-xs text-slate-200 leading-relaxed space-y-2 max-w-[95%]">
              <div className="whitespace-pre-wrap">{agentResult.finalMessage}</div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form at bottom */}
      <form onSubmit={handleSubmit} className="p-3.5 border-t border-devDark-750 bg-devDark-950">
        <div className="relative">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe the bug or task (e.g. 'Find the bug, explain its cause, propose a fix, and run the tests')..."
            rows={2}
            className="w-full pl-3 pr-10 py-2 rounded-lg bg-devDark-900 border border-devDark-750 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-xs text-slate-100 placeholder-slate-500 resize-none outline-none font-sans"
            disabled={isInvestigating}
          />
          <button
            type="submit"
            disabled={isInvestigating || !inputVal.trim()}
            className="absolute right-2 bottom-3 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition"
            title="Start autonomous investigation"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 font-mono">
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span className="text-slate-400">Restricted Execution Sandbox Active</span>
        </div>
      </form>
    </div>
  );
};
