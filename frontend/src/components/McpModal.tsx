import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Layers,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code,
} from 'lucide-react';
import { fetchMCPTools, invokeMCPToolDirectly } from '../api';
import { MCPToolDef } from '../types';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const [tools, setTools] = useState<MCPToolDef[]>([]);
  const [protocolVersion, setProtocolVersion] = useState<string>('2025-11-25');
  const [selectedTool, setSelectedTool] = useState<string>('list_files');
  const [toolArgs, setToolArgs] = useState<string>('{}');
  const [invokeResult, setInvokeResult] = useState<any>(null);
  const [isInvoking, setIsInvoking] = useState<boolean>(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchMCPTools()
        .then((data) => {
          setTools(data.tools);
          setProtocolVersion(data.protocolVersion);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentToolDef = tools.find((t) => t.name === selectedTool);

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    const def = tools.find((t) => t.name === toolName);
    if (toolName === 'read_file') {
      setToolArgs(JSON.stringify({ filePath: 'src/pricing.py' }, null, 2));
    } else if (toolName === 'search_code') {
      setToolArgs(JSON.stringify({ pattern: 'apply_tier_discount' }, null, 2));
    } else if (toolName === 'analyze_error') {
      setToolArgs(JSON.stringify({ logFilePath: 'logs/checkout_error.log' }, null, 2));
    } else if (toolName === 'run_tests') {
      setToolArgs(JSON.stringify({ command: 'python -m unittest discover -s tests' }, null, 2));
    } else {
      setToolArgs('{}');
    }
    setInvokeResult(null);
  };

  const handleInvoke = async () => {
    setIsInvoking(true);
    setInvokeResult(null);
    try {
      const parsedArgs = JSON.parse(toolArgs);
      const res = await invokeMCPToolDirectly(selectedTool, parsedArgs);
      setInvokeResult(res);
    } catch (err: any) {
      setInvokeResult({ error: err.message });
    } finally {
      setIsInvoking(false);
    }
  };

  const copyHttpEndpoint = () => {
    navigator.clipboard.writeText('http://localhost:4000/mcp');
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-devDark-900 border border-devDark-750 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-devDark-850 border-b border-devDark-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Server className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Model Context Protocol (MCP) Server
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Spec: v{protocolVersion}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Official TypeScript MCP SDK implementation with Streamable HTTP & SSE transports
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Endpoints Info Banner */}
          <div className="p-3.5 rounded-lg bg-devDark-950 border border-devDark-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                Streamable HTTP Endpoint
              </span>
              <div className="flex items-center justify-between p-2 rounded bg-devDark-900 border border-devDark-750 font-mono text-[11px] text-cyan-300">
                <span>POST http://localhost:4000/mcp</span>
                <button onClick={copyHttpEndpoint} className="text-slate-400 hover:text-white transition">
                  {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                Server-Sent Events (SSE) Transport
              </span>
              <div className="p-2 rounded bg-devDark-900 border border-devDark-750 font-mono text-[11px] text-cyan-300">
                GET http://localhost:4000/mcp/sse
              </div>
            </div>
          </div>

          {/* Tools Grid & Interactive Invoker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tool List */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Discovered Tools ({tools.length})
              </span>
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {tools.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => handleToolSelect(t.name)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-mono transition flex items-center justify-between ${
                      selectedTool === t.name
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-devDark-950 text-slate-300 hover:bg-devDark-850 border border-devDark-800'
                    }`}
                  >
                    <span>{t.name}</span>
                    <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tool Schema & Playground */}
            <div className="md:col-span-2 space-y-3">
              {currentToolDef && (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-devDark-950 border border-devDark-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-semibold text-cyan-400">
                        {currentToolDef.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{currentToolDef.description}</p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      JSON Arguments
                    </label>
                    <textarea
                      value={toolArgs}
                      onChange={(e) => setToolArgs(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 rounded-lg bg-devDark-950 border border-devDark-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleInvoke}
                      disabled={isInvoking}
                      className="px-3.5 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 ${isInvoking ? 'animate-spin' : ''}`} />
                      <span>{isInvoking ? 'Executing...' : 'Invoke Tool'}</span>
                    </button>
                  </div>

                  {invokeResult && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                        Execution Result
                      </span>
                      <pre className="p-2.5 rounded-lg bg-devDark-950 border border-devDark-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-auto">
                        {JSON.stringify(invokeResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-devDark-850 border-t border-devDark-750 flex items-center justify-between text-xs text-slate-400">
          <span>Fully compliant with Anthropic & Model Context Protocol specs</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-devDark-750 hover:bg-devDark-700 text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
