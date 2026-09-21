'use client';

import React, { useState } from 'react';
import { Database, Binary, Bookmark } from 'lucide-react';
import { toHex32 } from '../engine/utils/bitwise';
import { AssembledProgram, MachineCodeEntry } from '../engine/assembler/assembler';

interface MemoryInspectorProps {
  assembledProgram: AssembledProgram | null;
  modifiedMemory: Record<string, number>;
  currentPC: number;
  breakpoints: Set<number>;
  onToggleBreakpoint: (address: number) => void;
  lastWrittenAddr?: number;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  assembledProgram,
  modifiedMemory,
  currentPC,
  breakpoints,
  onToggleBreakpoint,
  lastWrittenAddr,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'data'>('code');

  // Build reverse symbol lookup (address -> label)
  const symbolLookup: Record<number, string> = {};
  if (assembledProgram?.symbolTable) {
    for (const [name, addr] of Object.entries(assembledProgram.symbolTable)) {
      symbolLookup[addr] = name;
    }
  }

  // Combine initial assembled data entries with runtime modified memory
  const dataEntriesMap = new Map<number, number>();
  if (assembledProgram?.dataEntries) {
    for (const entry of assembledProgram.dataEntries) {
      dataEntriesMap.set(entry.address, entry.word);
    }
  }
  for (const [addrStr, word] of Object.entries(modifiedMemory)) {
    const addr = parseInt(addrStr, 10);
    if (addr >= (assembledProgram?.dataBaseAddress ?? 0x2000)) {
      dataEntriesMap.set(addr, word);
    }
  }

  const sortedDataAddresses = Array.from(dataEntriesMap.keys()).sort((a, b) => a - b);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col h-full">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'code'
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            Program Memory (Text)
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'data'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Data Memory ({sortedDataAddresses.length} Words)
          </button>
        </div>

        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
          {activeTab === 'code' ? 'Click address to toggle BP' : 'Byte-addressed (4B words)'}
        </span>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto max-h-[360px] font-mono text-xs rounded-lg border border-slate-950 bg-slate-950/80 divide-y divide-slate-900/60">
        {activeTab === 'code' ? (
          /* CODE MEMORY VIEW */
          <div>
            {!assembledProgram || assembledProgram.codeEntries.length === 0 ? (
              <div className="p-6 text-center text-slate-500 italic">No program assembled yet.</div>
            ) : (
              assembledProgram.codeEntries.map((entry: MachineCodeEntry) => {
                const isCurrentPC = entry.address === currentPC;
                const hasBreakpoint = breakpoints.has(entry.address);
                const label = symbolLookup[entry.address];

                return (
                  <div
                    key={entry.address}
                    onClick={() => onToggleBreakpoint(entry.address)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer select-none transition-colors ${
                      isCurrentPC
                        ? 'bg-indigo-950/90 text-white font-bold border-l-4 border-indigo-400 ring-1 ring-indigo-500/30'
                        : hasBreakpoint
                        ? 'bg-rose-950/40 text-rose-300 border-l-4 border-rose-500'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    {/* Breakpoint Indicator */}
                    <button
                      className="w-4 flex items-center justify-center text-slate-600 hover:text-rose-400"
                      title="Toggle Breakpoint"
                    >
                      {hasBreakpoint ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
                      ) : isCurrentPC ? (
                        <span className="text-indigo-400 font-bold">▶</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full border border-slate-700 opacity-0 group-hover:opacity-100"></span>
                      )}
                    </button>

                    {/* Address */}
                    <span className="text-slate-500 text-[11px] w-20">
                      {toHex32(entry.address)}
                    </span>

                    {/* Hex Machine Word */}
                    <span className="text-slate-400 text-[11px] w-24">
                      {entry.hex}
                    </span>

                    {/* Assembly Instruction Text */}
                    <span className={`flex-1 truncate ${isCurrentPC ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {entry.instruction.mnemonic} {entry.sourceText.trim().replace(/^[^#;]*/, '').length === 0 ? '' : ''}
                      <span className="text-slate-400 font-normal ml-1">
                        {entry.sourceText.trim()}
                      </span>
                    </span>

                    {/* Label Badge */}
                    {label && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-sans">
                        {label}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* DATA MEMORY VIEW */
          <div>
            {sortedDataAddresses.length === 0 ? (
              <div className="p-6 text-center text-slate-500 italic">No data allocated in .data segment.</div>
            ) : (
              <div className="divide-y divide-slate-900">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900 text-[11px] font-semibold text-slate-400">
                  <span className="w-24">Address</span>
                  <span className="w-24">Hex Value</span>
                  <span className="w-28 text-right">Signed Decimal</span>
                  <span className="flex-1">Symbol / Field</span>
                </div>
                {sortedDataAddresses.map((addr) => {
                  const val = dataEntriesMap.get(addr) ?? 0;
                  const isRecent = lastWrittenAddr === addr;
                  const label = symbolLookup[addr];

                  return (
                    <div
                      key={addr}
                      className={`flex items-center gap-3 px-3 py-1.5 transition-colors ${
                        isRecent
                          ? 'bg-emerald-950/60 text-emerald-200 ring-1 ring-emerald-500/50'
                          : 'hover:bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <span className="text-slate-500 w-24">{toHex32(addr)}</span>
                      <span className="text-cyan-300 font-semibold w-24">{toHex32(val)}</span>
                      <span className="text-slate-300 w-28 text-right">{val.toLocaleString()}</span>
                      <span className="flex-1 text-slate-400 text-[11px] truncate">
                        {label ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 text-[10px]">
                            {label}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
