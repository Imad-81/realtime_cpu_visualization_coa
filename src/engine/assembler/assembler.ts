/**
 * Two-pass Assembler for MiniISA.
 * Converts assembly source code into machine words, data segments, symbol tables,
 * and debug source maps with comprehensive error checking.
 */

import { Lexer } from './lexer';
import { DirectiveStatement, InstructionStatement, LabelStatement, Parser, Statement } from './parser';
import { AssemblerError } from './errors';
import { DecodedInstruction, RegisterIndex } from '../isa/types';
import { encodeInstruction, decodeInstruction } from '../isa/encoding';
import { toHex32 } from '../utils/bitwise';

export interface AssemblerOptions {
  textBaseAddress?: number; // Default 0x0000_0000
  dataBaseAddress?: number; // Default 0x0000_2000
  defaultMulLatency?: number; // Default 3
}

export interface MachineCodeEntry {
  address: number;
  word: number;
  hex: string;
  sourceLine: number;
  sourceText: string;
  instruction: DecodedInstruction;
}

export interface DataWordEntry {
  address: number;
  word: number;
}

export interface AssembledProgram {
  textBaseAddress: number;
  dataBaseAddress: number;
  codeEntries: MachineCodeEntry[];
  instructions: DecodedInstruction[];
  dataEntries: DataWordEntry[];
  symbolTable: Record<string, number>;
  sourceMap: Record<number, { line: number; text: string }>;
  totalBytesText: number;
  totalBytesData: number;
}

export class Assembler {
  public static assemble(source: string, options: AssemblerOptions = {}): AssembledProgram {
    const textBase = options.textBaseAddress ?? 0x0000_0000;
    const dataBase = options.dataBaseAddress ?? 0x0000_2000;
    const mulLatency = options.defaultMulLatency ?? 3;

    const sourceLines = source.split(/\r?\n/);
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, sourceLines);
    const statements = parser.parse();

    const symbolTable: Record<string, number> = {};

    // ----------------------------------------------------
    // PASS 1: Build Symbol Table & Calculate Addresses
    // ----------------------------------------------------
    let currentSection: 'TEXT' | 'DATA' = 'TEXT';
    let textPC = textBase;
    let dataPC = dataBase;

    for (const stmt of statements) {
      if (stmt.kind === 'DIRECTIVE') {
        if (stmt.directive === '.TEXT') {
          currentSection = 'TEXT';
        } else if (stmt.directive === '.DATA') {
          currentSection = 'DATA';
        } else if (stmt.directive === '.WORD') {
          const numWords = stmt.values?.length ?? 0;
          dataPC += numWords * 4;
        } else if (stmt.directive === '.SPACE') {
          const bytes = stmt.spaceBytes ?? 0;
          // Align data allocation to 4-byte boundary
          dataPC += (bytes + 3) & ~3;
        }
      } else if (stmt.kind === 'LABEL') {
        if (symbolTable[stmt.name] !== undefined) {
          throw new AssemblerError(
            `Duplicate label declaration '${stmt.name}'`,
            stmt.line,
            1,
            sourceLines[stmt.line - 1]
          );
        }
        symbolTable[stmt.name] = currentSection === 'TEXT' ? textPC : dataPC;
      } else if (stmt.kind === 'INSTRUCTION') {
        textPC += 4;
      }
    }

    // ----------------------------------------------------
    // PASS 2: Emit Machine Code and Data Segments
    // ----------------------------------------------------
    currentSection = 'TEXT';
    textPC = textBase;
    dataPC = dataBase;

    const codeEntries: MachineCodeEntry[] = [];
    const instructions: DecodedInstruction[] = [];
    const dataEntries: DataWordEntry[] = [];
    const sourceMap: Record<number, { line: number; text: string }> = {};

    for (const stmt of statements) {
      if (stmt.kind === 'DIRECTIVE') {
        if (stmt.directive === '.TEXT') {
          currentSection = 'TEXT';
        } else if (stmt.directive === '.DATA') {
          currentSection = 'DATA';
        } else if (stmt.directive === '.WORD') {
          if (stmt.values) {
            for (const val of stmt.values) {
              let numericVal = 0;
              if (typeof val === 'number') {
                numericVal = val;
              } else if (typeof val === 'string') {
                if (symbolTable[val] === undefined) {
                  throw new AssemblerError(
                    `Undefined symbol '${val}' in .word directive`,
                    stmt.line,
                    1,
                    sourceLines[stmt.line - 1]
                  );
                }
                numericVal = symbolTable[val];
              }
              dataEntries.push({ address: dataPC, word: numericVal });
              dataPC += 4;
            }
          }
        } else if (stmt.directive === '.SPACE') {
          const bytes = stmt.spaceBytes ?? 0;
          const wordCount = ((bytes + 3) & ~3) / 4;
          for (let i = 0; i < wordCount; i++) {
            dataEntries.push({ address: dataPC + i * 4, word: 0 });
          }
          dataPC += wordCount * 4;
        }
      } else if (stmt.kind === 'INSTRUCTION') {
        const instAddr = textPC;
        let imm = stmt.imm ?? 0;
        let target = stmt.target ?? 0;
        let rs: RegisterIndex = stmt.rs ?? 0;
        const rt: RegisterIndex = stmt.rt ?? 0;
        const rd: RegisterIndex = stmt.rd ?? 0;

        // Resolve branch target labels
        if (stmt.mnemonic === 'BEQ' || stmt.mnemonic === 'BNE') {
          if (stmt.labelTarget) {
            const targetAddress = symbolTable[stmt.labelTarget];
            if (targetAddress === undefined) {
              throw new AssemblerError(
                `Undefined branch target label '${stmt.labelTarget}'`,
                stmt.line,
                1,
                sourceLines[stmt.line - 1]
              );
            }
            // Branch offset is in words: (target - (instAddr + 4)) / 4
            const offsetWords = (targetAddress - (instAddr + 4)) / 4;
            if (offsetWords < -32768 || offsetWords > 32767) {
              throw new AssemblerError(
                `Branch target out of range: offset is ${offsetWords} words`,
                stmt.line,
                1,
                sourceLines[stmt.line - 1]
              );
            }
            imm = offsetWords;
          }
        }

        // Resolve jump target labels
        if (stmt.mnemonic === 'JMP') {
          if (stmt.labelTarget) {
            const targetAddress = symbolTable[stmt.labelTarget];
            if (targetAddress === undefined) {
              throw new AssemblerError(
                `Undefined jump target label '${stmt.labelTarget}'`,
                stmt.line,
                1,
                sourceLines[stmt.line - 1]
              );
            }
            target = targetAddress;
          }
        }

        // Resolve memory offset labels (e.g., LW R1, array or LW R1, array(R2))
        if (stmt.mnemonic === 'LW' || stmt.mnemonic === 'SW') {
          if (stmt.labelTarget) {
            const labelAddress = symbolTable[stmt.labelTarget];
            if (labelAddress === undefined) {
              throw new AssemblerError(
                `Undefined memory symbol '${stmt.labelTarget}'`,
                stmt.line,
                1,
                sourceLines[stmt.line - 1]
              );
            }
            // Add label address to immediate offset
            imm = labelAddress + imm;
          }
        }

        // Resolve ADDI labels (e.g. ADDI R1, R0, array)
        if (stmt.mnemonic === 'ADDI' && stmt.labelTarget) {
          const labelAddress = symbolTable[stmt.labelTarget];
          if (labelAddress === undefined) {
            throw new AssemblerError(
              `Undefined symbol '${stmt.labelTarget}' in ADDI`,
              stmt.line,
              1,
              sourceLines[stmt.line - 1]
            );
          }
          imm = labelAddress + imm;
        }

        // Encode into 32-bit machine word
        const machineWord = encodeInstruction({
          mnemonic: stmt.mnemonic,
          rd,
          rs,
          rt,
          imm,
          target,
          mulLatency,
        });

        const decoded = decodeInstruction(machineWord, instAddr);
        decoded.sourceLine = stmt.line;
        decoded.sourceText = stmt.sourceText;
        decoded.address = instAddr;

        const entry: MachineCodeEntry = {
          address: instAddr,
          word: machineWord,
          hex: toHex32(machineWord),
          sourceLine: stmt.line,
          sourceText: stmt.sourceText,
          instruction: decoded,
        };

        codeEntries.push(entry);
        instructions.push(decoded);
        sourceMap[instAddr] = { line: stmt.line, text: stmt.sourceText };

        textPC += 4;
      }
    }

    return {
      textBaseAddress: textBase,
      dataBaseAddress: dataBase,
      codeEntries,
      instructions,
      dataEntries,
      symbolTable,
      sourceMap,
      totalBytesText: textPC - textBase,
      totalBytesData: dataPC - dataBase,
    };
  }
}
