/**
 * Golden-Model Sequential Reference Interpreter for MiniISA.
 * Serves as the ground-truth oracle for differential verification of pipelined implementations.
 */

import { Memory } from '../memory/memory';
import { decodeInstruction } from '../isa/encoding';
import { DecodedInstruction, NUM_REGISTERS, RegisterIndex } from '../isa/types';
import { mul32, toInt32, toUint32 } from '../utils/bitwise';
import { AssembledProgram } from '../assembler/assembler';
import { GoldenStateSnapshot } from './state';
import { disassemble } from '../isa/disassembler';

export class GoldenInterpreter {
  public pc: number = 0;
  public registers: Int32Array = new Int32Array(NUM_REGISTERS);
  public memory: Memory;
  public halted: boolean = false;
  public cycleCount: number = 0;
  public instructionCount: number = 0;
  public lastInstructionText: string = '';

  constructor(memorySize?: number) {
    this.memory = new Memory(memorySize);
    this.reset();
  }

  /** Reset all architectural state */
  public reset(): void {
    this.pc = 0;
    this.registers.fill(0);
    this.memory.reset();
    this.halted = false;
    this.cycleCount = 0;
    this.instructionCount = 0;
    this.lastInstructionText = '';
  }

  /** Load an assembled program into memory and set starting PC */
  public loadProgram(program: AssembledProgram): void {
    this.reset();
    this.pc = program.textBaseAddress;

    // Load instructions into text memory
    for (const entry of program.codeEntries) {
      this.memory.writeWord(entry.address, entry.word);
    }

    // Load data entries into data memory
    for (const data of program.dataEntries) {
      this.memory.writeWord(data.address, data.word);
    }
  }

  /** Read register value (R0 always returns 0) */
  public getRegister(reg: number): number {
    if (reg === 0) return 0;
    return this.registers[reg & 7];
  }

  /** Write register value (writes to R0 are ignored) */
  public setRegister(reg: number, val: number): void {
    if (reg === 0) return; // Hardwired to 0
    this.registers[reg & 7] = toInt32(val);
  }

  /**
   * Execute exactly one instruction sequentially.
   * Returns false if halted or an error occurred, true if stepped.
   */
  public step(): boolean {
    if (this.halted) {
      return false;
    }

    // 1. Fetch instruction word at PC
    const word = this.memory.readWord(this.pc);
    const inst = decodeInstruction(word, this.pc);
    this.lastInstructionText = disassemble(inst, this.pc);

    let nextPC = this.pc + 4;

    // 2. Execute according to opcode
    switch (inst.mnemonic) {
      case 'NOP':
        break;

      case 'HALT':
        this.halted = true;
        this.cycleCount++;
        this.instructionCount++;
        return false;

      case 'ADD': {
        const res = this.getRegister(inst.rs) + this.getRegister(inst.rt);
        this.setRegister(inst.rd, res);
        break;
      }

      case 'SUB': {
        const res = this.getRegister(inst.rs) - this.getRegister(inst.rt);
        this.setRegister(inst.rd, res);
        break;
      }

      case 'AND': {
        const res = this.getRegister(inst.rs) & this.getRegister(inst.rt);
        this.setRegister(inst.rd, res);
        break;
      }

      case 'OR': {
        const res = this.getRegister(inst.rs) | this.getRegister(inst.rt);
        this.setRegister(inst.rd, res);
        break;
      }

      case 'XOR': {
        const res = this.getRegister(inst.rs) ^ this.getRegister(inst.rt);
        this.setRegister(inst.rd, res);
        break;
      }

      case 'SLT': {
        const rsVal = this.getRegister(inst.rs);
        const rtVal = this.getRegister(inst.rt);
        this.setRegister(inst.rd, rsVal < rtVal ? 1 : 0);
        break;
      }

      case 'MUL': {
        const res = mul32(this.getRegister(inst.rs), this.getRegister(inst.rt));
        this.setRegister(inst.rd, res);
        break;
      }

      case 'ADDI': {
        const res = this.getRegister(inst.rs) + inst.imm;
        this.setRegister(inst.rt, res);
        break;
      }

      case 'LW': {
        const addr = toInt32(this.getRegister(inst.rs) + inst.imm);
        const val = this.memory.readWord(addr);
        this.setRegister(inst.rt, val);
        break;
      }

      case 'SW': {
        const addr = toInt32(this.getRegister(inst.rs) + inst.imm);
        const val = this.getRegister(inst.rt);
        this.memory.writeWord(addr, val);
        break;
      }

      case 'BEQ': {
        if (this.getRegister(inst.rs) === this.getRegister(inst.rt)) {
          nextPC = this.pc + 4 + (inst.imm << 2);
        }
        break;
      }

      case 'BNE': {
        if (this.getRegister(inst.rs) !== this.getRegister(inst.rt)) {
          nextPC = this.pc + 4 + (inst.imm << 2);
        }
        break;
      }

      case 'JMP': {
        nextPC = inst.target;
        break;
      }

      default:
        throw new Error(`Unhandled instruction in golden interpreter: ${inst.mnemonic}`);
    }

    this.pc = nextPC;
    this.cycleCount++;
    this.instructionCount++;
    return true;
  }

  /** Run until HALT or maximum instruction limit */
  public run(maxInstructions = 1_000_000): void {
    let count = 0;
    while (!this.halted && count < maxInstructions) {
      this.step();
      count++;
    }

    if (count >= maxInstructions && !this.halted) {
      throw new Error(`Execution limit exceeded (${maxInstructions} instructions). Possible infinite loop.`);
    }
  }

  /** Produce a serializable snapshot of the current architectural state */
  public getSnapshot(): GoldenStateSnapshot {
    return {
      pc: this.pc,
      registers: Array.from(this.registers),
      modifiedMemory: this.memory.serializeSparse(),
      halted: this.halted,
      cycleCount: this.cycleCount,
      instructionCount: this.instructionCount,
      lastExecutedInstruction: this.lastInstructionText,
    };
  }
}
