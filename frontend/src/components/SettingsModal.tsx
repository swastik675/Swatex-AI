import React from 'react';
import {
  X,
  Settings,
  Cpu,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { BedrockHealth } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bedrockHealth: BedrockHealth | undefined;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  bedrockHealth,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-devDark-900 border border-devDark-750 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-devDark-850 border-b border-devDark-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Amazon Bedrock Integration & Environment
              </h2>
              <p className="text-[11px] text-slate-400">
                AWS Builder Mini-Challenge & Bedrock Runtime configuration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-devDark-750 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Live Status Card */}
          <div
            className={`p-3.5 rounded-lg border ${
              bedrockHealth?.isConnected
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
              {bedrockHealth?.isConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Amazon Bedrock Connected</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Amazon Bedrock Standby (Local Demo Active)</span>
                </>
              )}
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {bedrockHealth?.statusMessage}
            </p>
            {bedrockHealth?.diagnostics && (
              <p className="text-slate-400 text-[10px] font-mono mt-1 pt-1 border-t border-devDark-800">
                {bedrockHealth.diagnostics}
              </p>
            )}
          </div>

          {/* Setup Guide */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              How to Activate Live Amazon Bedrock
            </h3>

            <div className="space-y-2 text-slate-300">
              <div className="p-3 rounded-lg bg-devDark-950 border border-devDark-800 space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-devDark-800 text-center text-[10px] leading-4 text-cyan-400">1</span>
                  <span>Set AWS Credentials in .env</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Copy <code className="text-cyan-300">.env.example</code> to <code className="text-cyan-300">.env</code> in the repository root and fill in:
                </p>
                <pre className="p-2 rounded bg-devDark-900 border border-devDark-750 font-mono text-[11px] text-slate-300">
AWS_REGION=us-east-1&#10;AWS_ACCESS_KEY_ID=your-key-id&#10;AWS_SECRET_ACCESS_KEY=your-secret-key&#10;AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-devDark-950 border border-devDark-800 space-y-1">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-devDark-800 text-center text-[10px] leading-4 text-cyan-400">2</span>
                  <span>Enable Model Access in AWS Bedrock</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  In AWS Bedrock console, navigate to <strong>Model access</strong> and ensure Claude 3.5 Sonnet or Amazon Nova Pro is granted for your account.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-devDark-950 border border-devDark-800 space-y-1">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-devDark-800 text-center text-[10px] leading-4 text-cyan-400">3</span>
                  <span>Restart Dev Server & Select Bedrock Mode</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Swatex AI automatically verifies the live connection and unlocks Bedrock AI reasoning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-devDark-850 border-t border-devDark-750 flex items-center justify-between text-xs text-slate-400">
          <span>AWS Builder Challenge Ready</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-devDark-750 hover:bg-devDark-700 text-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
