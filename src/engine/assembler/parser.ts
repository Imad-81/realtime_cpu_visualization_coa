/**
 * Parser for MiniISA Assembly.
 * Parses a token stream into an Abstract Syntax Tree (AST) of directives, labels, and instructions.
 */

import { AssemblerError } from './errors';
import { Token, TokenType } from './lexer';
import { Mnemonic, RegisterIndex } from '../isa/types';

export type Statement =
  | LabelStatement
  | DirectiveStatement
  | InstructionStatement;

export interface LabelStatement {
  kind: 'LABEL';
  name: string;
  line: number;
}

export interface DirectiveStatement {
  kind: 'DIRECTIVE';
  directive: '.DATA' | '.TEXT' | '.WORD' | '.SPACE';
  values?: (number | string)[]; // Numbers or label references
  spaceBytes?: number;
  line: number;
}

export interface InstructionStatement {
  kind: 'INSTRUCTION';
  mnemonic: Mnemonic;
  rd?: RegisterIndex;
  rs?: RegisterIndex;
  rt?: RegisterIndex;
  imm?: number;
  target?: number;
  labelTarget?: string; // Target label for branches / jumps / memory offset
  line: number;
  sourceText: string;
}

export class Parser {
  private tokens: Token[];
  private current = 0;
  private sourceLines: string[];

  constructor(tokens: Token[], sourceLines: string[]) {
    this.tokens = tokens;
    this.sourceLines = sourceLines;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new AssemblerError(
      message,
      token.line,
      token.column,
      this.sourceLines[token.line - 1]
    );
  }

  private skipNewlines(): void {
    while (this.match('NEWLINE')) {
      // Skip empty lines
    }
  }

  public parse(): Statement[] {
    const statements: Statement[] = [];
    this.skipNewlines();

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        if (Array.isArray(stmt)) {
          statements.push(...stmt);
        } else {
          statements.push(stmt);
        }
      }
      this.skipNewlines();
    }

    return statements;
  }

  private parseStatement(): Statement | Statement[] | null {
    const token = this.peek();

    // 1. Directives: .data, .text, .word, .space
    if (token.type === 'DIRECTIVE') {
      return this.parseDirective();
    }

    // 2. Label definition: identifier followed by ':'
    if (token.type === 'IDENTIFIER' && this.tokens[this.current + 1]?.type === 'COLON') {
      const name = token.value;
      const line = token.line;
      this.advance(); // consume identifier
      this.advance(); // consume colon

      const results: Statement[] = [{ kind: 'LABEL', name, line }];
      // There might be an instruction immediately on the same line after the label
      if (!this.check('NEWLINE') && !this.check('EOF')) {
        const next = this.parseStatement();
        if (next) {
          if (Array.isArray(next)) results.push(...next);
          else results.push(next);
        }
      }
      return results;
    }

    // 3. Instruction
    if (token.type === 'MNEMONIC') {
      return this.parseInstruction();
    }

    throw new AssemblerError(
      `Unexpected token '${token.value}'`,
      token.line,
      token.column,
      this.sourceLines[token.line - 1]
    );
  }

  private parseDirective(): DirectiveStatement {
    const token = this.advance();
    const dir = token.value as '.DATA' | '.TEXT' | '.WORD' | '.SPACE';

    if (dir === '.DATA' || dir === '.TEXT') {
      return { kind: 'DIRECTIVE', directive: dir, line: token.line };
    }

    if (dir === '.SPACE') {
      const numTok = this.consume('NUMBER', `Expected number of bytes after .space`);
      if ((numTok.numValue ?? 0) < 0) {
        throw new AssemblerError(`.space size cannot be negative`, numTok.line, numTok.column, this.sourceLines[numTok.line - 1]);
      }
      return {
        kind: 'DIRECTIVE',
        directive: dir,
        spaceBytes: numTok.numValue ?? 0,
        line: token.line,
      };
    }

    if (dir === '.WORD') {
      const values: (number | string)[] = [];
      do {
        if (this.check('NUMBER')) {
          values.push(this.advance().numValue!);
        } else if (this.check('IDENTIFIER')) {
          values.push(this.advance().value);
        } else {
          const badTok = this.peek();
          throw new AssemblerError(`Expected number or label in .word list`, badTok.line, badTok.column, this.sourceLines[badTok.line - 1]);
        }
      } while (this.match('COMMA'));

      return {
        kind: 'DIRECTIVE',
        directive: dir,
        values,
        line: token.line,
      };
    }

    throw new AssemblerError(`Unhandled directive: ${dir}`, token.line, token.column, this.sourceLines[token.line - 1]);
  }

  private parseInstruction(): InstructionStatement {
    const mTok = this.advance();
    const mnemonic = mTok.mnemonicValue!;
    const line = mTok.line;
    const sourceText = this.sourceLines[line - 1] || mnemonic;

    switch (mnemonic) {
      case 'NOP':
      case 'HALT':
        return { kind: 'INSTRUCTION', mnemonic, line, sourceText };

      // R-type 3-register arithmetic: ADD, SUB, AND, OR, XOR, SLT, MUL rd, rs, rt
      case 'ADD':
      case 'SUB':
      case 'AND':
      case 'OR':
      case 'XOR':
      case 'SLT':
      case 'MUL': {
        const rdTok = this.consume('REGISTER', `Expected destination register (R0-R7) for ${mnemonic}`);
        this.consume('COMMA', `Expected ',' after destination register`);
        const rsTok = this.consume('REGISTER', `Expected first source register (R0-R7) for ${mnemonic}`);
        this.consume('COMMA', `Expected ',' after first source register`);
        const rtTok = this.consume('REGISTER', `Expected second source register (R0-R7) for ${mnemonic}`);

        return {
          kind: 'INSTRUCTION',
          mnemonic,
          rd: rdTok.regValue!,
          rs: rsTok.regValue!,
          rt: rtTok.regValue!,
          line,
          sourceText,
        };
      }

      // ADDI rt, rs, imm
      case 'ADDI': {
        const rtTok = this.consume('REGISTER', `Expected destination register (R0-R7) for ADDI`);
        this.consume('COMMA', `Expected ',' after destination register`);
        const rsTok = this.consume('REGISTER', `Expected source register (R0-R7) for ADDI`);
        this.consume('COMMA', `Expected ',' after source register`);

        let imm = 0;
        let labelTarget: string | undefined;

        if (this.check('NUMBER')) {
          imm = this.advance().numValue!;
        } else if (this.check('IDENTIFIER')) {
          labelTarget = this.advance().value;
        } else {
          const bad = this.peek();
          throw new AssemblerError(`Expected immediate value or label for ADDI`, bad.line, bad.column, this.sourceLines[bad.line - 1]);
        }

        return {
          kind: 'INSTRUCTION',
          mnemonic,
          rt: rtTok.regValue!,
          rs: rsTok.regValue!,
          imm,
          labelTarget,
          line,
          sourceText,
        };
      }

      // Memory: LW rt, offset(rs) or SW rt, offset(rs)
      case 'LW':
      case 'SW': {
        const rtTok = this.consume('REGISTER', `Expected target register (R0-R7) for ${mnemonic}`);
        this.consume('COMMA', `Expected ',' after register in ${mnemonic}`);

        let imm = 0;
        let labelTarget: string | undefined;

        // Forms:
        // 1. offset(rs) e.g. 4(R2), -8(R1)
        // 2. (rs) e.g. (R2) where offset = 0
        // 3. label(rs) e.g. array(R2)
        // 4. label or number (absolute / direct addressing pseudo)
        if (this.check('LPAREN')) {
          // Form: (rs)
          this.advance();
          const rsTok = this.consume('REGISTER', `Expected base register in parentheses`);
          this.consume('RPAREN', `Expected ')' after base register`);
          return {
            kind: 'INSTRUCTION',
            mnemonic,
            rt: rtTok.regValue!,
            rs: rsTok.regValue!,
            imm: 0,
            line,
            sourceText,
          };
        }

        if (this.check('NUMBER')) {
          imm = this.advance().numValue!;
        } else if (this.check('IDENTIFIER')) {
          labelTarget = this.advance().value;
        }

        let rs: RegisterIndex = 0; // Default base R0 if absolute label
        if (this.match('LPAREN')) {
          const rsTok = this.consume('REGISTER', `Expected base register in parentheses`);
          this.consume('RPAREN', `Expected ')' after base register`);
          rs = rsTok.regValue!;
        }

        return {
          kind: 'INSTRUCTION',
          mnemonic,
          rt: rtTok.regValue!,
          rs,
          imm,
          labelTarget,
          line,
          sourceText,
        };
      }

      // Branch: BEQ rs, rt, label/offset or BNE rs, rt, label/offset
      case 'BEQ':
      case 'BNE': {
        const rsTok = this.consume('REGISTER', `Expected first comparison register (R0-R7) for ${mnemonic}`);
        this.consume('COMMA', `Expected ',' after first register`);
        const rtTok = this.consume('REGISTER', `Expected second comparison register (R0-R7) for ${mnemonic}`);
        this.consume('COMMA', `Expected ',' after second register`);

        let imm = 0;
        let labelTarget: string | undefined;

        if (this.check('IDENTIFIER')) {
          labelTarget = this.advance().value;
        } else if (this.check('NUMBER')) {
          imm = this.advance().numValue!;
        } else {
          const bad = this.peek();
          throw new AssemblerError(`Expected branch target label or numeric offset`, bad.line, bad.column, this.sourceLines[bad.line - 1]);
        }

        return {
          kind: 'INSTRUCTION',
          mnemonic,
          rs: rsTok.regValue!,
          rt: rtTok.regValue!,
          imm,
          labelTarget,
          line,
          sourceText,
        };
      }

      // Jump: JMP label/target
      case 'JMP': {
        let target = 0;
        let labelTarget: string | undefined;

        if (this.check('IDENTIFIER')) {
          labelTarget = this.advance().value;
        } else if (this.check('NUMBER')) {
          target = this.advance().numValue!;
        } else {
          const bad = this.peek();
          throw new AssemblerError(`Expected target label or address for JMP`, bad.line, bad.column, this.sourceLines[bad.line - 1]);
        }

        return {
          kind: 'INSTRUCTION',
          mnemonic,
          target,
          labelTarget,
          line,
          sourceText,
        };
      }

      default:
        throw new AssemblerError(`Unsupported instruction: ${mnemonic}`, line, 1, sourceText);
    }
  }
}
