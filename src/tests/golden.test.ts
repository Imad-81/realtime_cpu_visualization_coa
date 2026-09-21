import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Assembler } from '../engine/assembler/assembler';
import { GoldenInterpreter } from '../engine/golden/interpreter';

describe('Golden-Model Reference Interpreter', () => {
  it('enforces R0 hardwired to zero', () => {
    const src = `
      ADDI R0, R0, 100
      ADD  R0, R0, R0
      HALT
    `;
    const program = Assembler.assemble(src);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run();

    expect(interp.getRegister(0)).toBe(0);
  });

  it('correctly executes arithmetic instructions (ADD, SUB, MUL, ADDI)', () => {
    const src = `
      ADDI R1, R0, 25
      ADDI R2, R0, -10
      ADD  R3, R1, R2     # 25 + (-10) = 15
      SUB  R4, R1, R2     # 25 - (-10) = 35
      MUL  R5, R1, R2     # 25 * (-10) = -250
      HALT
    `;
    const program = Assembler.assemble(src);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run();

    expect(interp.getRegister(1)).toBe(25);
    expect(interp.getRegister(2)).toBe(-10);
    expect(interp.getRegister(3)).toBe(15);
    expect(interp.getRegister(4)).toBe(35);
    expect(interp.getRegister(5)).toBe(-250);
  });

  it('correctly executes bitwise and comparison instructions (AND, OR, XOR, SLT)', () => {
    const src = `
      ADDI R1, R0, 0b1100
      ADDI R2, R0, 0b1010
      AND  R3, R1, R2     # 0b1000 = 8
      OR   R4, R1, R2     # 0b1110 = 14
      XOR  R5, R1, R2     # 0b0110 = 6

      ADDI R6, R0, -5
      SLT  R7, R6, R1     # -5 < 12 -> 1
      HALT
    `;
    const program = Assembler.assemble(src);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run();

    expect(interp.getRegister(3)).toBe(8);
    expect(interp.getRegister(4)).toBe(14);
    expect(interp.getRegister(5)).toBe(6);
    expect(interp.getRegister(7)).toBe(1);
  });

  it('correctly executes memory instructions (LW, SW)', () => {
    const src = `
      .data
      val: .word 0x12345678
      dst: .space 4

      .text
      LW R1, val(R0)
      SW R1, dst(R0)
      LW R2, dst(R0)
      HALT
    `;
    const program = Assembler.assemble(src);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run();

    expect(interp.getRegister(1)).toBe(0x12345678);
    expect(interp.getRegister(2)).toBe(0x12345678);
  });

  it('correctly executes branch and jump control flow (BEQ, BNE, JMP)', () => {
    const src = `
      ADDI R1, R0, 10
      ADDI R2, R0, 20
      ADDI R3, R0, 0

      # BEQ not taken
      BEQ R1, R2, skip_bad
      ADDI R3, R3, 1

    skip_bad:
      # BNE taken
      BNE R1, R2, skip_good
      ADDI R3, R3, 100

    skip_good:
      ADDI R3, R3, 2
      JMP end
      ADDI R3, R3, 500   # Should not execute

    end:
      HALT
    `;
    const program = Assembler.assemble(src);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run();

    expect(interp.getRegister(3)).toBe(3); // 1 + 2
  });

  it('executes array_sum benchmark to completion with expected result', () => {
    const benchmarkPath = path.resolve(__dirname, '../benchmarks/array_sum.s');
    const src = fs.readFileSync(benchmarkPath, 'utf-8');
    const program = Assembler.assemble(src);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run();

    expect(interp.halted).toBe(true);
    // 5 + 12 - 3 + 40 + 18 + 7 - 9 + 25 = 95
    expect(interp.getRegister(3)).toBe(95);

    const resultAddr = program.symbolTable['result'];
    expect(interp.memory.readWord(resultAddr)).toBe(95);
  });

  it('executes fibonacci benchmark to completion with expected result', () => {
    const benchmarkPath = path.resolve(__dirname, '../benchmarks/fibonacci.s');
    const src = fs.readFileSync(benchmarkPath, 'utf-8');
    const program = Assembler.assemble(src);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run();

    expect(interp.halted).toBe(true);
    // F(10) = 55
    expect(interp.getRegister(3)).toBe(55);

    const ansAddr = program.symbolTable['ans'];
    expect(interp.memory.readWord(ansAddr)).toBe(55);
  });

  it('executes test_hazards benchmark with expected arithmetic/logical results', () => {
    const benchmarkPath = path.resolve(__dirname, '../benchmarks/test_hazards.s');
    const src = fs.readFileSync(benchmarkPath, 'utf-8');
    const program = Assembler.assemble(src);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run();

    expect(interp.halted).toBe(true);
    expect(interp.getRegister(1)).toBe(7);
    expect(interp.getRegister(2)).toBe(6);
    expect(interp.getRegister(3)).toBe(42);
    expect(interp.getRegister(4)).toBe(40);
    expect(interp.getRegister(5)).toBe(8);
    expect(interp.getRegister(7)).toBe(1);
  });
});
