/**
 * Assembler Error Reporting
 * Formats errors with line numbers, column numbers, and visual source indicators.
 */

export interface SourceLocation {
  line: number;
  column: number;
}

export class AssemblerError extends Error {
  public readonly line: number;
  public readonly column: number;
  public readonly sourceLineText?: string;

  constructor(message: string, line: number, column: number, sourceLineText?: string) {
    let formattedMessage = `Assembler Error [Line ${line}, Col ${column}]: ${message}`;
    if (sourceLineText) {
      const pointer = ' '.repeat(Math.max(0, column - 1)) + '^';
      formattedMessage += `\n  ${line} | ${sourceLineText}\n    | ${pointer}`;
    }
    super(formattedMessage);
    this.name = 'AssemblerError';
    this.line = line;
    this.column = column;
    this.sourceLineText = sourceLineText;
  }
}
