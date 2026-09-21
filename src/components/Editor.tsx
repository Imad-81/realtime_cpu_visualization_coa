'use client';

import React from 'react';
import { Play, AlertCircle, CheckCircle2, Code2, RefreshCw } from 'lucide-react';
import { AssemblerError } from '../engine/assembler/errors';

interface EditorProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  onAssemble: () => void;
  error: AssemblerError | null;
  instructionCount: number;
  dataBytesCount: number;
}

export const Editor: React.FC<EditorProps> = ({
  code,
  onChangeCode,
  onAssemble,
  error,
  instructionCount,
  dataBytesCount,
}) => {
  const lines = code.split('\n');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            MiniISA Assembly Editor
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-2">
            <span>{instructionCount} Instructions</span>
            <span>•</span>
            <span>{dataBytesCount}B Data</span>
          </div>

          <button
            onClick={onAssemble}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-sm transition active:scale-95"
            title="Assemble and load program into CPU memory"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Assemble & Load</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex-1 min-h-[320px] rounded-lg border border-slate-950 bg-slate-950 overflow-hidden font-mono text-xs flex">
        {/* Line Numbers */}
        <div className="w-10 bg-slate-900/60 border-r border-slate-800/80 text-slate-500 select-none py-2 text-right pr-2 leading-5">
          {lines.map((_, idx) => (
            <div
              key={idx}
              className={error && error.line === idx + 1 ? 'text-rose-400 font-bold bg-rose-950/40' : ''}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          spellCheck={false}
          className="flex-1 bg-transparent text-slate-200 p-2 leading-5 focus:outline-none resize-none font-mono selection:bg-cyan-900 selection:text-cyan-100 whitespace-pre"
          placeholder="# Enter MiniISA assembly instructions here..."
        />
      </div>

      {/* Compiler Diagnostics / Error Banner */}
      {error ? (
        <div className="mt-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="overflow-x-auto">
            <span className="font-bold">Assembly Error (Line {error.line}):</span> {error.message}
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Assembled cleanly into memory</span>
          </div>
          <span className="hidden sm:inline font-mono">Press Assemble & Load to update memory</span>
        </div>
      )}
    </div>
  );
};
