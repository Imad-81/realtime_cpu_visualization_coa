'use client';

import React from 'react';
import { Activity, Clock, Cpu, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import { toHex32 } from '../engine/utils/bitwise';

interface MetricsOverviewProps {
  cycleCount: number;
  instructionCount: number;
  pc: number;
  isHalted: boolean;
  clockFreqMhz: number;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  cycleCount,
  instructionCount,
  pc,
  isHalted,
  clockFreqMhz,
}) => {
  const cpi = instructionCount > 0 ? (cycleCount / instructionCount).toFixed(2) : '1.00';
  const ipc = cycleCount > 0 ? (instructionCount / cycleCount).toFixed(2) : '1.00';

  // Real execution time in microseconds/milliseconds
  // Time = Cycles / (Frequency in Hz)
  const timeSeconds = cycleCount / (clockFreqMhz * 1_000_000);
  const formattedTime =
    timeSeconds < 1e-6
      ? `${(timeSeconds * 1e9).toFixed(1)} ns`
      : timeSeconds < 1e-3
      ? `${(timeSeconds * 1e6).toFixed(2)} µs`
      : `${(timeSeconds * 1e3).toFixed(3)} ms`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Cycles */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Simulated Cycles</span>
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-1 font-mono text-xl font-bold text-white tracking-tight">
          {cycleCount.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Clock ticks elapsed</div>
      </div>

      {/* Instructions Retired */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Retired Instructions</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-1 font-mono text-xl font-bold text-white tracking-tight">
          {instructionCount.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Completed instructions</div>
      </div>

      {/* CPI */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Measured CPI</span>
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="mt-1 font-mono text-xl font-bold text-indigo-300 tracking-tight">
          {cpi}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Cycles / Instruction</div>
      </div>

      {/* IPC */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Throughput (IPC)</span>
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-1 font-mono text-xl font-bold text-amber-300 tracking-tight">
          {ipc}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Instructions / Cycle</div>
      </div>

      {/* Execution Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Wall-Clock Time</span>
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
        </div>
        <div className="mt-1 font-mono text-xl font-bold text-yellow-300 tracking-tight truncate">
          {formattedTime}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">@ {clockFreqMhz} MHz</div>
      </div>

      {/* Program Counter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Program Counter (PC)</span>
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="mt-1 font-mono text-lg font-bold text-violet-300 tracking-tight truncate">
          {toHex32(pc)}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">{isHalted ? 'HALTED' : 'Active'}</div>
      </div>
    </div>
  );
};
