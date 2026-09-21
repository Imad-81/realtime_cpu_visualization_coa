import { describe, it, expect } from 'vitest';
import { Assembler } from '../engine/assembler/assembler';
import { AssemblerError } from '../engine/assembler/errors';

describe('MiniISA Assembler', () => {
  it('assembles a simple sequential program', () => {
    const src = `
      # Simple addition
      ADDI R1, R0, 10
      ADDI R2, R0, 20
      ADD  R3, R1, R2
      HALT
    `;

    const result = Assembler.assemble(src);
    expect(result.instructions.length).toBe(4);
    expect(result.instructions[0].mnemonic).toBe('ADDI');
    expect(result.instructions[0].rt).toBe(1);
    expect(result.instructions[0].imm).toBe(10);
    expect(result.instructions[2].mnemonic).toBe('ADD');
    expect(result.instructions[2].rd).toBe(3);
    expect(result.instructions[3].mnemonic).toBe('HALT');
  });

  it('correctly handles labels and forward/backward branches', () => {
    const src = `
      ADDI R1, R0, 0
      ADDI R2, R0, 5
    loop:
      BEQ R1, R2, done
      ADDI R1, R1, 1
      JMP loop
    done:
      HALT
    `;

    const result = Assembler.assemble(src);
    expect(result.symbolTable['loop']).toBe(0x0008);
    expect(result.symbolTable['done']).toBe(0x0014);

    // BEQ at 0x0008 targeting done at 0x0014:
    // offset = (0x0014 - (0x0008 + 4)) / 4 = (0x0014 - 0x000C) / 4 = 8 / 4 = 2 words
    const beqInst = result.instructions[2];
    expect(beqInst.mnemonic).toBe('BEQ');
    expect(beqInst.imm).toBe(2);

    // JMP at 0x0010 targeting loop at 0x0008:
    const jmpInst = result.instructions[4];
    expect(jmpInst.mnemonic).toBe('JMP');
    expect(jmpInst.target).toBe(0x0008);
  });

  it('allocates data segments with .word and .space', () => {
    const src = `
      .data
      arr:   .word 10, 20, 30
      res:   .space 8

      .text
      LW R1, arr(R0)
      HALT
    `;

    const result = Assembler.assemble(src);
    expect(result.symbolTable['arr']).toBe(0x2000);
    expect(result.symbolTable['res']).toBe(0x200C);
    expect(result.dataEntries.length).toBe(5); // 3 words for arr + 2 words for res
    expect(result.dataEntries[0].word).toBe(10);
    expect(result.dataEntries[1].word).toBe(20);
    expect(result.dataEntries[2].word).toBe(30);
  });

  it('throws helpful AssemblerError on unknown register', () => {
    const src = `
      ADDI R8, R0, 5
    `;

    expect(() => Assembler.assemble(src)).toThrow(AssemblerError);
  });

  it('throws helpful AssemblerError on duplicate label', () => {
    const src = `
    start:
      ADDI R1, R0, 1
    start:
      ADDI R2, R0, 2
    `;

    expect(() => Assembler.assemble(src)).toThrow(/Duplicate label/);
  });

  it('throws helpful AssemblerError on undefined branch target', () => {
    const src = `
      BEQ R1, R2, nonexistent
    `;

    expect(() => Assembler.assemble(src)).toThrow(/Undefined branch target/);
  });
});
