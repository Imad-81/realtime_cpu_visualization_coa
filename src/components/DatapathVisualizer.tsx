'use client';

import React from 'react';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DecodedInstruction } from '../engine/isa/types';
import { toHex32 } from '../engine/utils/bitwise';

interface DatapathVisualizerProps {
  currentInstruction: DecodedInstruction | null;
  pc: number;
  isHalted: boolean;
}

export const DatapathVisualizer: React.FC<DatapathVisualizerProps> = ({
  currentInstruction,
  pc,
  isHalted,
}) => {
  const inst = currentInstruction;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            5-Stage Architectural Datapath
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>Active Instruction:</span>
          <span className="text-cyan-300 font-bold">
            {isHalted ? 'HALTED' : inst ? `${inst.mnemonic} ${inst.sourceText || ''}` : 'NOP'}
          </span>
        </div>
      </div>

      {/* 5 Pipeline Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 relative">
        {/* Stage 1: IF */}
        <div className="bg-slate-950/70 border border-cyan-900/50 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              STAGE 1: IF
            </span>
            <span className="text-[10px] text-slate-500">Fetch</span>
          </div>
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div className="text-slate-400 text-[10px]">PC Address:</div>
            <div className="text-cyan-300 font-semibold">{toHex32(pc)}</div>
            <div className="text-slate-500 text-[10px]">Next PC: {toHex32(pc + 4)}</div>
          </div>
        </div>

        {/* Stage 2: ID */}
        <div className="bg-slate-950/70 border border-indigo-900/50 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
              STAGE 2: ID
            </span>
            <span className="text-[10px] text-slate-500">Decode</span>
          </div>
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div className="text-slate-400 text-[10px]">Opcode & Regs:</div>
            <div className="text-indigo-300 font-semibold">
              {inst ? `${inst.mnemonic} (R${inst.rs}, R${inst.rt})` : '-'}
            </div>
            <div className="text-slate-500 text-[10px]">
              Imm: {inst && inst.format === 'I' ? inst.imm : '-'}
            </div>
          </div>
        </div>

        {/* Stage 3: EX */}
        <div className="bg-slate-950/70 border border-violet-900/50 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-800 font-mono">
              STAGE 3: EX
            </span>
            <span className="text-[10px] text-slate-500">Execute</span>
          </div>
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div className="text-slate-400 text-[10px]">ALU Operation:</div>
            <div className="text-violet-300 font-semibold">
              {inst?.mnemonic === 'ADD' || inst?.mnemonic === 'ADDI'
                ? 'ALU: ADD'
                : inst?.mnemonic === 'SUB'
                ? 'ALU: SUB'
                : inst?.mnemonic === 'MUL'
                ? 'ALU: MULTIPLY'
                : inst?.mnemonic === 'LW' || inst?.mnemonic === 'SW'
                ? 'ADDR CALC (rs + imm)'
                : inst?.mnemonic?.startsWith('B')
                ? 'CMP (rs == rt)'
                : inst?.mnemonic || 'IDLE'}
            </div>
            <div className="text-slate-500 text-[10px]">
              Latency: {inst?.latency ?? 1} cycle(s)
            </div>
          </div>
        </div>

        {/* Stage 4: MEM */}
        <div className="bg-slate-950/70 border border-amber-900/50 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono">
              STAGE 4: MEM
            </span>
            <span className="text-[10px] text-slate-500">Memory</span>
          </div>
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div className="text-slate-400 text-[10px]">Access Type:</div>
            <div className="text-amber-300 font-semibold">
              {inst?.mnemonic === 'LW'
                ? 'READ WORD'
                : inst?.mnemonic === 'SW'
                ? 'WRITE WORD'
                : 'NO MEM ACCESS'}
            </div>
            <div className="text-slate-500 text-[10px]">
              L1 Cache: Pass-Through
            </div>
          </div>
        </div>

        {/* Stage 5: WB */}
        <div className="bg-slate-950/70 border border-emerald-900/50 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              STAGE 5: WB
            </span>
            <span className="text-[10px] text-slate-500">Writeback</span>
          </div>
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div className="text-slate-400 text-[10px]">Target Register:</div>
            <div className="text-emerald-300 font-semibold">
              {inst?.format === 'R' && inst.rd !== 0
                ? `Write R${inst.rd}`
                : (inst?.mnemonic === 'ADDI' || inst?.mnemonic === 'LW') && inst.rt !== 0
                ? `Write R${inst.rt}`
                : 'None'}
            </div>
            <div className="text-slate-500 text-[10px]">
              Reg Write: {inst?.format === 'R' || inst?.mnemonic === 'ADDI' || inst?.mnemonic === 'LW' ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
