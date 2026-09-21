'use client';

import React from 'react';
import { toHex32 } from '../engine/utils/bitwise';

interface RegisterFileProps {
  registers: number[];
  changedRegisters?: Set<number>;
}

export const RegisterFile: React.FC<RegisterFileProps> = ({
  registers,
  changedRegisters = new Set(),
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col h-full">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          Architectural Register File (32-bit)
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">8 Regs (R0-R7)</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
        {registers.map((val, idx) => {
          const isR0 = idx === 0;
          const isChanged = changedRegisters.has(idx);

          return (
            <div
              key={idx}
              className={`relative rounded-lg p-2.5 transition-all duration-300 border flex flex-col justify-between ${
                isChanged
                  ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-400/50 shadow-sm shadow-cyan-900/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1">
                  R{idx}
                  {isR0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-normal">
                      ZERO
                    </span>
                  )}
                </span>
                {isChanged && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                )}
              </div>

              <div className="mt-1.5 space-y-0.5">
                <div className="font-mono text-xs font-semibold text-cyan-300 tracking-tight">
                  {toHex32(val)}
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {val.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
