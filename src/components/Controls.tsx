'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Zap,
  Gauge,
  FastForward,
} from 'lucide-react';

interface ControlsProps {
  isRunning: boolean;
  canStepBack: boolean;
  canStepForward: boolean;
  isHalted: boolean;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onRunToHalt: () => void;
  speedHz: number;
  onSpeedChange: (speed: number) => void;
  clockFreqMhz: number;
  onClockFreqChange: (freq: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isRunning,
  canStepBack,
  canStepForward,
  isHalted,
  onPlayPause,
  onStepForward,
  onStepBack,
  onReset,
  onRunToHalt,
  speedHz,
  onSpeedChange,
  clockFreqMhz,
  onClockFreqChange,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-4">
      {/* Playback Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/90 text-slate-300 text-xs font-semibold transition active:scale-95 shadow-sm"
          title="Reset Simulator [R]"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Step Back */}
        <button
          onClick={onStepBack}
          disabled={!canStepBack || isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/90 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-xs font-semibold transition active:scale-95 shadow-sm"
          title="Step Back (Time-Travel) [Shift+Left or ,]"
        >
          <SkipBack className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Step Back</span>
        </button>

        {/* Play / Pause Primary Button */}
        <button
          onClick={onPlayPause}
          disabled={isHalted && !isRunning}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-xs transition active:scale-95 shadow-md ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 ring-2 ring-amber-400/40'
              : isHalted
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/40'
          }`}
          title="Play / Pause [Space]"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{isHalted ? 'Halted' : 'Run Live'}</span>
            </>
          )}
        </button>

        {/* Step Forward */}
        <button
          onClick={onStepForward}
          disabled={!canStepForward || isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/90 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-semibold transition active:scale-95 shadow-sm"
          title="Single Step Forward [.]"
        >
          <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Step</span>
        </button>

        {/* Run to Completion */}
        <button
          onClick={onRunToHalt}
          disabled={isHalted || isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-800/80 bg-indigo-950/40 hover:bg-indigo-900/60 disabled:opacity-40 text-indigo-300 text-xs font-semibold transition active:scale-95 shadow-sm"
          title="Execute instantly until HALT"
        >
          <FastForward className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Run to Halt</span>
        </button>
      </div>

      {/* Speed & Clock Configuration */}
      <div className="flex items-center gap-4 text-xs">
        {/* Speed Slider */}
        <div className="flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium whitespace-nowrap">
            Speed: <span className="font-mono text-cyan-400">{speedHz === 0 ? 'MAX' : `${speedHz} Hz`}</span>
          </span>
          <input
            type="range"
            min="1"
            max="60"
            step="1"
            value={speedHz}
            onChange={(e) => onSpeedChange(parseInt(e.target.value, 10))}
            className="w-20 sm:w-28 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Clock Frequency */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400 font-medium">Clock:</span>
          <select
            value={clockFreqMhz}
            onChange={(e) => onClockFreqChange(parseFloat(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300 font-mono focus:outline-none"
          >
            <option value="1">1 MHz</option>
            <option value="10">10 MHz</option>
            <option value="100">100 MHz</option>
            <option value="1000">1.0 GHz</option>
            <option value="3200">3.2 GHz</option>
          </select>
        </div>
      </div>
    </div>
  );
};
