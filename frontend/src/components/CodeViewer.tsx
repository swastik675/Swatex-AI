import React from 'react';
import { FileCode, Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  filePath: string | null;
  content: string;
  culpritLine?: number;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  filePath,
  content,
  culpritLine,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!filePath) {
    return (
      <div className="flex-1 flex items-center justify-center bg-devDark-950 text-slate-500 text-xs select-none">
        Select a file from the explorer or investigate a bug to view code context.
      </div>
    );
  }

  const lines = content.split('\n');

  const copyCode = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-devDark-950 overflow-hidden font-mono text-xs">
      {/* File Header */}
      <div className="h-9 px-4 bg-devDark-900 border-b border-devDark-750 flex items-center justify-between text-slate-300 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-slate-200">{filePath}</span>
          <span className="text-[10px] text-slate-500">({lines.length} lines)</span>
        </div>

        <button
          onClick={copyCode}
          className="p-1 rounded hover:bg-devDark-800 text-slate-400 hover:text-slate-200 transition"
          title="Copy file contents"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Code with Line Numbers */}
      <div className="flex-1 overflow-auto p-2 bg-devDark-950">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isHighlight = culpritLine === lineNum;

              return (
                <tr
                  key={idx}
                  className={`leading-relaxed ${
                    isHighlight
                      ? 'bg-rose-500/15 border-l-2 border-rose-500'
                      : 'hover:bg-devDark-900/50'
                  }`}
                >
                  <td className="w-10 pr-3 text-right text-slate-600 select-none align-top font-mono text-[11px]">
                    {lineNum}
                  </td>
                  <td className={`pl-2 pr-4 whitespace-pre font-mono text-[12px] ${
                    isHighlight ? 'text-rose-200 font-semibold' : 'text-slate-300'
                  }`}>
                    {lineText || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
