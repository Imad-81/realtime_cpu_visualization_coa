'use client';

import React from 'react';
import { X, Cpu, Layers, BookOpen } from 'lucide-react';

interface DocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocModal: React.FC<DocModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/50 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">ArchLens MiniISA Specification</h2>
              <p className="text-xs text-slate-400">College COA Project-Based Learning Architectural Reference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              1. Architectural Registers
            </h3>
            <p className="leading-relaxed">
              MiniISA provides 8 general-purpose 32-bit registers, denoted <code className="font-mono text-cyan-300">R0</code> through <code className="font-mono text-cyan-300">R7</code>.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono">
              <span className="text-amber-400 font-bold">R0</span> is hardwired to 0 (reads return 0; writes are silently discarded).
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              2. Instruction Set Architecture (MiniISA)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="p-2">Type</th>
                    <th className="p-2">Syntax</th>
                    <th className="p-2">Operation</th>
                    <th className="p-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  <tr>
                    <td className="p-2 text-cyan-400">R-Type</td>
                    <td className="p-2 text-slate-200">ADD rd, rs, rt</td>
                    <td className="p-2">rd = rs + rt</td>
                    <td className="p-2 text-slate-400">32-bit signed addition</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-cyan-400">R-Type</td>
                    <td className="p-2 text-slate-200">SUB rd, rs, rt</td>
                    <td className="p-2">rd = rs - rt</td>
                    <td className="p-2 text-slate-400">32-bit signed subtraction</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-cyan-400">R-Type</td>
                    <td className="p-2 text-slate-200">MUL rd, rs, rt</td>
                    <td className="p-2">rd = (rs * rt) & 0xFFFFFFFF</td>
                    <td className="p-2 text-amber-300">Multi-cycle EX (default 3 cycles)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-cyan-400">R-Type</td>
                    <td className="p-2 text-slate-200">AND, OR, XOR rd, rs, rt</td>
                    <td className="p-2">Bitwise operations</td>
                    <td className="p-2 text-slate-400">Logical bitwise operators</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-cyan-400">R-Type</td>
                    <td className="p-2 text-slate-200">SLT rd, rs, rt</td>
                    <td className="p-2">rd = (rs &lt; rt) ? 1 : 0</td>
                    <td className="p-2 text-slate-400">Set on less than (signed)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-indigo-400">I-Type</td>
                    <td className="p-2 text-slate-200">ADDI rt, rs, imm</td>
                    <td className="p-2">rt = rs + imm</td>
                    <td className="p-2 text-slate-400">16-bit sign-extended immediate</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-indigo-400">I-Type</td>
                    <td className="p-2 text-slate-200">LW rt, offset(rs)</td>
                    <td className="p-2">rt = Mem[rs + offset]</td>
                    <td className="p-2 text-slate-400">4-byte word load (aligned)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-indigo-400">I-Type</td>
                    <td className="p-2 text-slate-200">SW rt, offset(rs)</td>
                    <td className="p-2">Mem[rs + offset] = rt</td>
                    <td className="p-2 text-slate-400">4-byte word store (aligned)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-indigo-400">I-Type</td>
                    <td className="p-2 text-slate-200">BEQ rs, rt, label</td>
                    <td className="p-2">if (rs == rt) PC = target</td>
                    <td className="p-2 text-slate-400">PC-relative branch</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-indigo-400">I-Type</td>
                    <td className="p-2 text-slate-200">BNE rs, rt, label</td>
                    <td className="p-2">if (rs != rt) PC = target</td>
                    <td className="p-2 text-slate-400">PC-relative branch</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-emerald-400">J-Type</td>
                    <td className="p-2 text-slate-200">JMP label</td>
                    <td className="p-2">PC = target</td>
                    <td className="p-2 text-slate-400">Unconditional jump</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-emerald-400">Special</td>
                    <td className="p-2 text-slate-200">NOP / HALT</td>
                    <td className="p-2">No-op / Terminate CPU</td>
                    <td className="p-2 text-slate-400">Control instructions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              3. Memory Architecture & Sections
            </h3>
            <p className="leading-relaxed">
              Memory is byte-addressed. Word accesses (<code className="font-mono text-cyan-300">LW</code>, <code className="font-mono text-cyan-300">SW</code>) must be 4-byte aligned (<code className="font-mono text-slate-300">addr % 4 == 0</code>).
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><code className="font-mono text-slate-200">.text</code> section begins at <code className="font-mono text-cyan-300">0x00000000</code>.</li>
              <li><code className="font-mono text-slate-200">.data</code> section begins at <code className="font-mono text-cyan-300">0x00002000</code>.</li>
              <li>Supported directives: <code className="font-mono text-slate-200">.word v1, v2</code>, <code className="font-mono text-slate-200">.space num_bytes</code>.</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
