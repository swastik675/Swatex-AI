import React from 'react';
import {
  Terminal,
  Cpu,
  Server,
  Zap,
  Settings,
  HelpCircle,
  ShieldCheck,
  Radio,
  Layers,
} from 'lucide-react';
import { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  mode: 'aws_bedrock' | 'local_demo';
  onOpenMcpModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  mode,
  onOpenMcpModal,
  onOpenSettingsModal,
}) => {
  const isBedrockConnected = health?.bedrock?.isConnected;
  const isMcpOnline = health?.mcp?.status === 'ONLINE';

  return (
    <header className="h-14 bg-devDark-900 border-b border-devDark-750 flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Brand Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Terminal className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Swatex <span className="text-cyan-400 font-extrabold">AI</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-devDark-800 text-slate-400 border border-devDark-700">
              Hackathon 2026
            </span>
          </div>
          <span className="text-[10px] text-slate-400 tracking-wide font-medium hidden sm:inline -mt-0.5">
            Code Smarter. Debug Faster.
          </span>
        </div>
      </div>

      {/* Central Status Indicators */}
      <div className="hidden md:flex items-center gap-2 text-xs">
        {/* Active Mode Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${
            mode === 'aws_bedrock'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{mode === 'aws_bedrock' ? 'AWS Bedrock AI Mode' : 'Local Deterministic Demo'}</span>
        </div>

        {/* AWS Bedrock Live Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${
            isBedrockConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-devDark-800 border-devDark-700 text-slate-400'
          }`}
          title={health?.bedrock?.statusMessage || 'AWS Bedrock Status'}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Bedrock:</span>
          <span className="font-mono text-[11px]">
            {isBedrockConnected ? 'Connected (Claude 3.5)' : 'Unconfigured (Fallback Active)'}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBedrockConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
        </div>

        {/* MCP Server Protocol Status */}
        <button
          onClick={onOpenMcpModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium transition hover:border-cyan-500/50 ${
            isMcpOnline
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
          title="Click to inspect MCP Server tools & Streamable HTTP endpoints"
        >
          <Server className="w-3.5 h-3.5" />
          <span>MCP Server:</span>
          <span className="font-mono text-[11px]">v2025-11-25 (8 tools)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMcpModal}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-devDark-800 hover:bg-devDark-750 text-slate-300 border border-devDark-700 transition"
          title="MCP Tool Discovery & Protocol Inspector"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">MCP Tools</span>
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="p-1.5 rounded-md bg-devDark-800 hover:bg-devDark-750 text-slate-300 border border-devDark-700 transition"
          title="AWS Configuration & Setup Instructions"
        >
          <Settings className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    </header>
  );
};
