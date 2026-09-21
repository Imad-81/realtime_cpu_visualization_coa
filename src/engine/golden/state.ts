/**
 * Golden Model Architectural State Definitions.
 * Fully serializable for deterministic differential testing and UI debugging.
 */

export interface GoldenStateSnapshot {
  pc: number;
  registers: number[]; // R0 through R7
  modifiedMemory: Record<string, number>; // address -> 32-bit word
  halted: boolean;
  cycleCount: number;
  instructionCount: number;
  lastExecutedInstruction?: string;
}
