import React from 'react';
import {
  FileText,
  Folder,
  FolderOpen,
  FileCode,
  FileSearch,
  Bug,
  RefreshCw,
} from 'lucide-react';
import { FileEntry } from '../types';

interface FileExplorerProps {
  files: FileEntry[];
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  onRefresh: () => void;
  culpritFile?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onRefresh,
  culpritFile,
}) => {
  return (
    <div className="flex flex-col h-full bg-devDark-950 border-r border-devDark-750 select-none">
      <div className="p-3 border-b border-devDark-750 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace Files
        </span>
        <button
          onClick={onRefresh}
          className="p-1 rounded hover:bg-devDark-800 text-slate-400 hover:text-slate-200 transition"
          title="Refresh workspace files"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 p-2 overflow-y-auto space-y-1">
        {files.length === 0 && (
          <div className="text-center text-slate-500 text-xs py-4">
            Loading files...
          </div>
        )}

        {files.map((file) => {
          if (file.isDirectory) return null; // File walk already lists relative paths

          const isSelected = selectedFile === file.path;
          const isCulprit = culpritFile && file.path.includes('pricing.py');
          const isLog = file.path.endsWith('.log');
          const isTest = file.path.includes('test_');

          return (
            <button
              key={file.path}
              onClick={() => onSelectFile(file.path)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs transition ${
                isSelected
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-300 hover:bg-devDark-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {isCulprit ? (
                  <Bug className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : isLog ? (
                  <FileSearch className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : isTest ? (
                  <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                <span className="truncate font-mono text-[11px]">{file.path}</span>
              </div>

              {isCulprit && (
                <span className="text-[9px] font-mono px-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                  Bug
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
