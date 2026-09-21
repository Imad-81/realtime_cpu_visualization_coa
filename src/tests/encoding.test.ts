import { describe, it, expect } from 'vitest';
import { encodeInstruction, decodeInstruction } from '../engine/isa/encoding';
import { disassemble } from '../engine/isa/disassembler';
import { signExtend, signExtend16to32, toInt32, toUint32 } from '../engine/utils/bitwise';

describe('Bitwise Helpers', () => {
  it('correctly casts to 32-bit signed and unsigned values', () => {
    expect(toInt32(0xFFFFFFFF)).toBe(-1);
    expect(toUint32(-1)).toBe(0xFFFFFFFF);
    expect(toInt32(0x7FFFFFFF)).toBe(2147483647);
  });

  it('correctly sign-extends 16-bit values to 32 bits', () => {
    expect(signExtend16to32(0x0005)).toBe(5);
    expect(signExtend16to32(0xFFFF)).toBe(-1);
    expect(signExtend16to32(0xFFFE)).toBe(-2);
    expect(signExtend16to32(0x8000)).toBe(-32768);
    expect(signExtend16to32(0x7FFF)).toBe(32767);
  });
});

describe('Instruction Encoding and Decoding', () => {
  it('encodes and decodes NOP', () => {
    const word = encodeInstruction({ mnemonic: 'NOP' });
    expect(word).toBe(0x00000000);

    const decoded = decodeInstruction(word);
    expect(decoded.mnemonic).toBe('NOP');
    expect(disassemble(decoded)).toBe('NOP');
  });

  it('encodes and decodes R-type ADD', () => {
    const word = encodeInstruction({ mnemonic: 'ADD', rd: 1, rs: 2, rt: 3 });
    const decoded = decodeInstruction(word);

    expect(decoded.mnemonic).toBe('ADD');
    expect(decoded.rd).toBe(1);
    expect(decoded.rs).toBe(2);
    expect(decoded.rt).toBe(3);
    expect(disassemble(decoded)).toBe('ADD R1, R2, R3');
  });

  it('encodes and decodes MUL with configurable latency', () => {
    const word = encodeInstruction({ mnemonic: 'MUL', rd: 4, rs: 5, rt: 6, mulLatency: 4 });
    const decoded = decodeInstruction(word);

    expect(decoded.mnemonic).toBe('MUL');
    expect(decoded.rd).toBe(4);
    expect(decoded.rs).toBe(5);
    expect(decoded.rt).toBe(6);
    expect(decoded.latency).toBe(4);
  });

  it('encodes and decodes I-type ADDI with negative immediate', () => {
    const word = encodeInstruction({ mnemonic: 'ADDI', rt: 2, rs: 1, imm: -8 });
    const decoded = decodeInstruction(word);

    expect(decoded.mnemonic).toBe('ADDI');
    expect(decoded.rt).toBe(2);
    expect(decoded.rs).toBe(1);
    expect(decoded.imm).toBe(-8);
    expect(disassemble(decoded)).toBe('ADDI R2, R1, -8');
  });

  it('encodes and decodes I-type LW and SW', () => {
    const lwWord = encodeInstruction({ mnemonic: 'LW', rt: 3, rs: 2, imm: 12 });
    const lwDecoded = decodeInstruction(lwWord);
    expect(lwDecoded.mnemonic).toBe('LW');
    expect(lwDecoded.rt).toBe(3);
    expect(lwDecoded.rs).toBe(2);
    expect(lwDecoded.imm).toBe(12);
    expect(disassemble(lwDecoded)).toBe('LW R3, 12(R2)');

    const swWord = encodeInstruction({ mnemonic: 'SW', rt: 3, rs: 2, imm: 12 });
    const swDecoded = decodeInstruction(swWord);
    expect(swDecoded.mnemonic).toBe('SW');
    expect(swDecoded.rt).toBe(3);
    expect(swDecoded.rs).toBe(2);
    expect(swDecoded.imm).toBe(12);
  });

  it('encodes and decodes J-type JMP and HALT', () => {
    const jmpWord = encodeInstruction({ mnemonic: 'JMP', target: 0x00000040 });
    const jmpDecoded = decodeInstruction(jmpWord);
    expect(jmpDecoded.mnemonic).toBe('JMP');
    expect(jmpDecoded.target).toBe(0x00000040);

    const haltWord = encodeInstruction({ mnemonic: 'HALT' });
    const haltDecoded = decodeInstruction(haltWord);
    expect(haltDecoded.mnemonic).toBe('HALT');
    expect(disassemble(haltDecoded)).toBe('HALT');
  });
});
