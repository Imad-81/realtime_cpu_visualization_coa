/**
 * MiniISA Architecture Specification and Types
 * An educational 32-bit RISC-style ISA with 8 general-purpose registers (R0-R7).
 * R0 is hardwired to 0.
 */

export type RegisterIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const REGISTER_NAMES: readonly string[] = [
  'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'
] as const;

export type RegisterName = typeof REGISTER_NAMES[number];

export const NUM_REGISTERS = 8;

export type InstructionFormat = 'R' | 'I' | 'J';

export type Mnemonic =
  | 'ADD'
  | 'SUB'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'SLT'
  | 'MUL'
  | 'ADDI'
  | 'LW'
  | 'SW'
  | 'BEQ'
  | 'BNE'
  | 'JMP'
  | 'NOP'
  | 'HALT';

/** Opcode constants (6-bit fields [31:26]) */
export const OPCODES = {
  R_TYPE: 0x00,
  ADDI:   0x08,
  LW:     0x23,
  SW:     0x2B,
  BEQ:    0x04,
  BNE:    0x05,
  JMP:    0x02,
  HALT:   0x3F,
} as const;

/** Function codes for R-type instructions (6-bit fields [5:0]) */
export const FUNCT_CODES = {
  NOP: 0x00,
  ADD: 0x20,
  SUB: 0x22,
  AND: 0x24,
  OR:  0x25,
  XOR: 0x26,
  SLT: 0x2A,
  MUL: 0x18,
} as const;

export interface DecodedInstruction {
  /** Raw 32-bit machine word */
  raw: number;
  /** Mnemonic (e.g. 'ADD', 'LW', 'BEQ') */
  mnemonic: Mnemonic;
  /** Instruction format ('R', 'I', 'J') */
  format: InstructionFormat;
  /** Destination register (R0-R7) for R-type */
  rd: RegisterIndex;
  /** First source register (R0-R7) for R-type, I-type (base for LW/SW, compare for BEQ/BNE) */
  rs: RegisterIndex;
  /** Second source register for R-type / BEQ / BNE, or destination for ADDI / LW */
  rt: RegisterIndex;
  /** Sign-extended 32-bit immediate for I-type */
  imm: number;
  /** Jump target word-aligned address for J-type */
  target: number;
  /** Configurable cycle latency for multi-cycle execution (e.g. MUL) */
  latency: number;
  /** Original source assembly text line number */
  sourceLine?: number;
  /** Original source text string */
  sourceText?: string;
  /** Memory address where this instruction resides */
  address?: number;
}

/** Check if a register name string is valid (case-insensitive) */
export function parseRegisterName(name: string): RegisterIndex | null {
  const normalized = name.trim().toUpperCase();
  const match = normalized.match(/^R([0-7])$/);
  if (match) {
    return parseInt(match[1], 10) as RegisterIndex;
  }
  return null;
}
