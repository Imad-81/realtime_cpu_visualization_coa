'use client';

import React from 'react';
import { Cpu, BookOpen, Sparkles, Terminal } from 'lucide-react';
import { PRESET_PROGRAMS, PresetProgram } from './presets';

interface NavbarProps {
  selectedPresetId: string;
  onSelectPreset: (preset: PresetProgram) => void;
  status: 'idle' | 'running' | 'paused' | 'halted' | 'error';
  onOpenDocModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedPresetId,
  onSelectPreset,
  status,
  onOpenDocModal,
}) => {
  const statusBadge = {
    idle: { label: 'Ready', bg: 'bg-slate-800 text-slate-300 border-slate-700' },
    running: { label: 'Executing', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 animate-pulse' },
    paused: { label: 'Paused', bg: 'bg-amber-950/80 text-amber-300 border-amber-700/60' },
    halted: { label: 'Halted (Terminated)', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60' },
    error: { label: 'Runtime Exception', bg: 'bg-rose-950/80 text-rose-300 border-rose-700/60' },
  }[status];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-950/50 ring-1 ring-white/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ArchLens
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80 tracking-wider">
                  v1.0 PBL
                </span>
              </h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-medium ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Real-time Cycle-Accurate CPU Microarchitecture Visualizer & Design-Space Explorer
            </p>
          </div>
        </div>

        {/* Preset Selector & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <label htmlFor="preset-select" className="text-slate-400 font-medium hidden md:inline">
              Benchmark:
            </label>
            <select
              id="preset-select"
              value={selectedPresetId}
              onChange={(e) => {
                const found = PRESET_PROGRAMS.find((p) => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-2"
            >
              {PRESET_PROGRAMS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenDocModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium transition-colors shadow-sm"
            title="MiniISA Specification & Help"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">MiniISA Spec</span>
          </button>
        </div>
      </div>
    </header>
  );
};
