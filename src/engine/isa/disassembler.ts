/**
 * Disassembler for MiniISA.
 * Converts decoded instructions or raw 32-bit words into human-readable assembly.
 */

import { DecodedInstruction } from './types';
import { decodeInstruction } from './encoding';
import { toHex32 } from '../utils/bitwise';

export function disassemble(inst: DecodedInstruction | number, pc = 0): string {
  const decoded = typeof inst === 'number' ? decodeInstruction(inst, pc) : inst;
  const { mnemonic, rd, rs, rt, imm, target } = decoded;

  switch (mnemonic) {
    case 'NOP':
      return 'NOP';
    case 'HALT':
      return 'HALT';
    case 'ADD':
    case 'SUB':
    case 'AND':
    case 'OR':
    case 'XOR':
    case 'SLT':
    case 'MUL':
      return `${mnemonic} R${rd}, R${rs}, R${rt}`;
    case 'ADDI':
      return `ADDI R${rt}, R${rs}, ${imm}`;
    case 'LW':
      return `LW R${rt}, ${imm}(R${rs})`;
    case 'SW':
      return `SW R${rt}, ${imm}(R${rs})`;
    case 'BEQ':
    case 'BNE': {
      // In branch instructions, immediate is branch offset (words or bytes)
      const branchTarget = pc + 4 + (imm << 2);
      return `${mnemonic} R${rs}, R${rt}, ${toHex32(branchTarget)} (${imm >= 0 ? '+' : ''}${imm})`;
    }
    case 'JMP':
      return `JMP ${toHex32(target)}`;
    default:
      return `UNKNOWN`;
  }
}
