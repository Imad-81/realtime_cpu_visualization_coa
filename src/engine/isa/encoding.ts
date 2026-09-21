/**
 * Instruction Encoding and Decoding for MiniISA.
 * Translates between structured instruction fields and 32-bit machine words.
 */

import {
  DecodedInstruction,
  FUNCT_CODES,
  Mnemonic,
  OPCODES,
  RegisterIndex,
} from './types';
import { extractBits, signExtend16to32, toUint32 } from '../utils/bitwise';

export interface InstructionParams {
  mnemonic: Mnemonic;
  rd?: RegisterIndex;
  rs?: RegisterIndex;
  rt?: RegisterIndex;
  imm?: number;
  target?: number;
  mulLatency?: number;
}

/**
 * Encodes structured instruction parameters into a 32-bit machine word.
 */
export function encodeInstruction(params: InstructionParams): number {
  const {
    mnemonic,
    rd = 0,
    rs = 0,
    rt = 0,
    imm = 0,
    target = 0,
    mulLatency = 3,
  } = params;

  switch (mnemonic) {
    // R-type instructions
    case 'NOP': {
      return 0x00000000;
    }
    case 'ADD':
    case 'SUB':
    case 'AND':
    case 'OR':
    case 'XOR':
    case 'SLT':
    case 'MUL': {
      const opcode = OPCODES.R_TYPE;
      const funct = FUNCT_CODES[mnemonic];
      const shamt = mnemonic === 'MUL' ? (mulLatency & 0x1F) : 0;
      const word =
        ((opcode & 0x3F) << 26) |
        ((rs & 0x1F) << 21) |
        ((rt & 0x1F) << 16) |
        ((rd & 0x1F) << 11) |
        ((shamt & 0x1F) << 6) |
        (funct & 0x3F);
      return toUint32(word);
    }

    // I-type instructions
    case 'ADDI':
    case 'LW':
    case 'SW':
    case 'BEQ':
    case 'BNE': {
      const opcode = OPCODES[mnemonic];
      const imm16 = imm & 0xFFFF;
      const word =
        ((opcode & 0x3F) << 26) |
        ((rs & 0x1F) << 21) |
        ((rt & 0x1F) << 16) |
        imm16;
      return toUint32(word);
    }

    // J-type instructions
    case 'JMP':
    case 'HALT': {
      const opcode = OPCODES[mnemonic];
      const target26 = (target >>> 2) & 0x03FFFFFF; // Target word offset
      const word = ((opcode & 0x3F) << 26) | target26;
      return toUint32(word);
    }

    default:
      throw new Error(`Unknown mnemonic: ${mnemonic}`);
  }
}

/**
 * Decodes a 32-bit machine word into a structured DecodedInstruction.
 */
export function decodeInstruction(word: number, address = 0): DecodedInstruction {
  const uWord = toUint32(word);
  const opcode = extractBits(uWord, 26, 6);

  // Check R-type
  if (opcode === OPCODES.R_TYPE) {
    const rs = extractBits(uWord, 21, 5) as RegisterIndex;
    const rt = extractBits(uWord, 16, 5) as RegisterIndex;
    const rd = extractBits(uWord, 11, 5) as RegisterIndex;
    const shamt = extractBits(uWord, 6, 5);
    const funct = extractBits(uWord, 0, 6);

    let mnemonic: Mnemonic;
    let latency = 1;

    switch (funct) {
      case FUNCT_CODES.NOP:
        mnemonic = 'NOP';
        break;
      case FUNCT_CODES.ADD:
        mnemonic = 'ADD';
        break;
      case FUNCT_CODES.SUB:
        mnemonic = 'SUB';
        break;
      case FUNCT_CODES.AND:
        mnemonic = 'AND';
        break;
      case FUNCT_CODES.OR:
        mnemonic = 'OR';
        break;
      case FUNCT_CODES.XOR:
        mnemonic = 'XOR';
        break;
      case FUNCT_CODES.SLT:
        mnemonic = 'SLT';
        break;
      case FUNCT_CODES.MUL:
        mnemonic = 'MUL';
        latency = shamt > 0 ? shamt : 3; // Default 3 cycles if not set
        break;
      default:
        throw new Error(`Invalid R-type funct code: 0x${funct.toString(16)} at address 0x${address.toString(16)}`);
    }

    return {
      raw: uWord,
      mnemonic,
      format: 'R',
      rd,
      rs,
      rt,
      imm: 0,
      target: 0,
      latency,
      address,
    };
  }

  // Check J-type
  if (opcode === OPCODES.JMP || opcode === OPCODES.HALT) {
    const mnemonic: Mnemonic = opcode === OPCODES.JMP ? 'JMP' : 'HALT';
    const target26 = extractBits(uWord, 0, 26);
    const targetAddr = (target26 << 2) >>> 0;

    return {
      raw: uWord,
      mnemonic,
      format: 'J',
      rd: 0,
      rs: 0,
      rt: 0,
      imm: 0,
      target: targetAddr,
      latency: 1,
      address,
    };
  }

  // Check I-type
  const rs = extractBits(uWord, 21, 5) as RegisterIndex;
  const rt = extractBits(uWord, 16, 5) as RegisterIndex;
  const rawImm = extractBits(uWord, 0, 16);
  const imm = signExtend16to32(rawImm);

  let mnemonic: Mnemonic;
  switch (opcode) {
    case OPCODES.ADDI:
      mnemonic = 'ADDI';
      break;
    case OPCODES.LW:
      mnemonic = 'LW';
      break;
    case OPCODES.SW:
      mnemonic = 'SW';
      break;
    case OPCODES.BEQ:
      mnemonic = 'BEQ';
      break;
    case OPCODES.BNE:
      mnemonic = 'BNE';
      break;
    default:
      throw new Error(`Invalid opcode: 0x${opcode.toString(16)} at address 0x${address.toString(16)}`);
  }

  return {
    raw: uWord,
    mnemonic,
    format: 'I',
    rd: 0,
    rs,
    rt,
    imm,
    target: 0,
    latency: 1,
    address,
  };
}
