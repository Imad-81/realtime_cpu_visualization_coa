/**
 * Lexer / Tokenizer for MiniISA Assembly.
 */

import { AssemblerError } from './errors';
import { Mnemonic, parseRegisterName, RegisterIndex } from '../isa/types';

export type TokenType =
  | 'EOF'
  | 'NEWLINE'
  | 'COLON'
  | 'COMMA'
  | 'LPAREN'
  | 'RPAREN'
  | 'IDENTIFIER'
  | 'REGISTER'
  | 'MNEMONIC'
  | 'DIRECTIVE'
  | 'NUMBER';

export interface Token {
  type: TokenType;
  value: string;
  numValue?: number;
  regValue?: RegisterIndex;
  mnemonicValue?: Mnemonic;
  line: number;
  column: number;
}

const MNEMONICS = new Set<string>([
  'ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLT', 'MUL',
  'ADDI', 'LW', 'SW', 'BEQ', 'BNE', 'JMP', 'NOP', 'HALT',
]);

const DIRECTIVES = new Set<string>([
  '.DATA', '.TEXT', '.WORD', '.SPACE',
]);

export class Lexer {
  private source: string;
  private lines: string[];
  private index = 0;
  private line = 1;
  private column = 1;

  constructor(source: string) {
    this.source = source;
    this.lines = source.split(/\r?\n/);
  }

  private peek(): string {
    return this.index < this.source.length ? this.source[this.index] : '';
  }

  private advance(): string {
    const ch = this.peek();
    this.index++;
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.index < this.source.length) {
      const ch = this.peek();

      // Skip whitespace (except newlines)
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
        continue;
      }

      // Newlines are significant separators in assembly
      if (ch === '\n') {
        const line = this.line;
        const col = this.column;
        this.advance();
        tokens.push({ type: 'NEWLINE', value: '\n', line, column: col });
        continue;
      }

      // Skip comments: # or ;
      if (ch === '#' || ch === ';') {
        while (this.peek() !== '' && this.peek() !== '\n') {
          this.advance();
        }
        continue;
      }

      // Punctuation
      if (ch === ':') {
        const line = this.line;
        const col = this.column;
        this.advance();
        tokens.push({ type: 'COLON', value: ':', line, column: col });
        continue;
      }

      if (ch === ',') {
        const line = this.line;
        const col = this.column;
        this.advance();
        tokens.push({ type: 'COMMA', value: ',', line, column: col });
        continue;
      }

      if (ch === '(') {
        const line = this.line;
        const col = this.column;
        this.advance();
        tokens.push({ type: 'LPAREN', value: '(', line, column: col });
        continue;
      }

      if (ch === ')') {
        const line = this.line;
        const col = this.column;
        this.advance();
        tokens.push({ type: 'RPAREN', value: ')', line, column: col });
        continue;
      }

      // Directives starting with '.'
      if (ch === '.') {
        const startLine = this.line;
        const startCol = this.column;
        let word = this.advance();
        while (/[a-zA-Z0-9_]/.test(this.peek())) {
          word += this.advance();
        }
        const upper = word.toUpperCase();
        if (DIRECTIVES.has(upper)) {
          tokens.push({ type: 'DIRECTIVE', value: upper, line: startLine, column: startCol });
          continue;
        } else {
          throw new AssemblerError(
            `Unknown directive: '${word}'`,
            startLine,
            startCol,
            this.lines[startLine - 1]
          );
        }
      }

      // Numbers: decimal, hex (0x...), binary (0b...), or negative numbers (-123, -0x10)
      if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(this.source[this.index + 1] || ''))) {
        const startLine = this.line;
        const startCol = this.column;
        let numStr = this.advance(); // consume first digit or '-'
        while (/[a-fA-FxX0-9bB_]/.test(this.peek())) {
          numStr += this.advance();
        }

        const cleaned = numStr.replace(/_/g, '');
        let parsedVal: number;
        if (/^-?0x[0-9a-fA-F]+$/i.test(cleaned)) {
          const isNeg = cleaned.startsWith('-');
          const hexPart = isNeg ? cleaned.slice(3) : cleaned.slice(2);
          parsedVal = parseInt(hexPart, 16);
          if (isNeg) parsedVal = -parsedVal;
        } else if (/^-?0b[01]+$/i.test(cleaned)) {
          const isNeg = cleaned.startsWith('-');
          const binPart = isNeg ? cleaned.slice(3) : cleaned.slice(2);
          parsedVal = parseInt(binPart, 2);
          if (isNeg) parsedVal = -parsedVal;
        } else if (/^-?\d+$/.test(cleaned)) {
          parsedVal = parseInt(cleaned, 10);
        } else {
          throw new AssemblerError(
            `Invalid number literal: '${numStr}'`,
            startLine,
            startCol,
            this.lines[startLine - 1]
          );
        }

        tokens.push({
          type: 'NUMBER',
          value: numStr,
          numValue: parsedVal,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // Identifiers, registers, mnemonics
      if (/[a-zA-Z_]/.test(ch)) {
        const startLine = this.line;
        const startCol = this.column;
        let ident = '';
        while (/[a-zA-Z0-9_]/.test(this.peek())) {
          ident += this.advance();
        }

        const upper = ident.toUpperCase();

        // Check if register: R0..R7
        const regIdx = parseRegisterName(upper);
        if (regIdx !== null) {
          tokens.push({
            type: 'REGISTER',
            value: upper,
            regValue: regIdx,
            line: startLine,
            column: startCol,
          });
          continue;
        }

        // Check if mnemonic
        if (MNEMONICS.has(upper)) {
          tokens.push({
            type: 'MNEMONIC',
            value: upper,
            mnemonicValue: upper as Mnemonic,
            line: startLine,
            column: startCol,
          });
          continue;
        }

        // Otherwise, it's an identifier (label reference or definition)
        tokens.push({
          type: 'IDENTIFIER',
          value: ident,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // Unrecognized character
      throw new AssemblerError(
        `Unexpected character '${ch}'`,
        this.line,
        this.column,
        this.lines[this.line - 1]
      );
    }

    tokens.push({
      type: 'EOF',
      value: '',
      line: this.line,
      column: this.column,
    });

    return tokens;
  }
}
