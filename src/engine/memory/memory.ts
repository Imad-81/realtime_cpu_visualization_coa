/**
 * Byte-addressed 32-bit Memory System for MiniISA.
 * Supports word (32-bit aligned) and byte accesses with bounds checking,
 * little-endian byte ordering, modified address tracking, and full state serialization.
 */

import { toInt32, toUint32 } from '../utils/bitwise';

export const DEFAULT_MEMORY_SIZE = 65536; // 64 KB default address space

export interface MemorySnapshot {
  size: number;
  data: number[]; // Array of byte values or sparse non-zero entries
}

export class Memory {
  private buffer: Uint8Array;
  private readonly size: number;
  private modifiedWords: Set<number>; // Word-aligned addresses that have been written to

  constructor(size = DEFAULT_MEMORY_SIZE) {
    this.size = size;
    this.buffer = new Uint8Array(size);
    this.modifiedWords = new Set<number>();
  }

  /** Reset all memory bytes to 0 and clear modification tracking */
  public reset(): void {
    this.buffer.fill(0);
    this.modifiedWords.clear();
  }

  /** Get total memory size in bytes */
  public getSize(): number {
    return this.size;
  }

  /** Read a single unsigned byte (0-255) */
  public readByte(addr: number): number {
    const uAddr = toUint32(addr);
    if (uAddr >= this.size) {
      throw new Error(`Memory Access Violation: Read out of bounds at address 0x${uAddr.toString(16)} (size: 0x${this.size.toString(16)})`);
    }
    return this.buffer[uAddr];
  }

  /** Write a single byte */
  public writeByte(addr: number, val: number): void {
    const uAddr = toUint32(addr);
    if (uAddr >= this.size) {
      throw new Error(`Memory Access Violation: Write out of bounds at address 0x${uAddr.toString(16)} (size: 0x${this.size.toString(16)})`);
    }
    this.buffer[uAddr] = val & 0xFF;
    this.modifiedWords.add(uAddr & ~3);
  }

  /**
   * Read a 32-bit signed word from memory at `addr`.
   * Must be 4-byte aligned (addr % 4 === 0).
   * Little-endian: LSB at addr, MSB at addr + 3.
   */
  public readWord(addr: number): number {
    const uAddr = toUint32(addr);
    if ((uAddr & 3) !== 0) {
      throw new Error(`Unaligned Memory Access: Read word at unaligned address 0x${uAddr.toString(16)}`);
    }
    if (uAddr + 3 >= this.size) {
      throw new Error(`Memory Access Violation: Read word out of bounds at address 0x${uAddr.toString(16)}`);
    }

    const b0 = this.buffer[uAddr];
    const b1 = this.buffer[uAddr + 1];
    const b2 = this.buffer[uAddr + 2];
    const b3 = this.buffer[uAddr + 3];

    const unsignedWord = (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
    return toInt32(unsignedWord);
  }

  /**
   * Write a 32-bit word to memory at `addr`.
   * Must be 4-byte aligned.
   */
  public writeWord(addr: number, val: number): void {
    const uAddr = toUint32(addr);
    if ((uAddr & 3) !== 0) {
      throw new Error(`Unaligned Memory Access: Write word at unaligned address 0x${uAddr.toString(16)}`);
    }
    if (uAddr + 3 >= this.size) {
      throw new Error(`Memory Access Violation: Write word out of bounds at address 0x${uAddr.toString(16)}`);
    }

    const uVal = toUint32(val);
    this.buffer[uAddr]     =  uVal        & 0xFF;
    this.buffer[uAddr + 1] = (uVal >>> 8)  & 0xFF;
    this.buffer[uAddr + 2] = (uVal >>> 16) & 0xFF;
    this.buffer[uAddr + 3] = (uVal >>> 24) & 0xFF;

    this.modifiedWords.add(uAddr);
  }

  /** Load a slice of bytes into memory starting at `baseAddr` */
  public loadBytes(baseAddr: number, bytes: Uint8Array | number[]): void {
    const uBase = toUint32(baseAddr);
    for (let i = 0; i < bytes.length; i++) {
      this.writeByte(uBase + i, bytes[i]);
    }
  }

  /** Load a slice of 32-bit words into memory starting at `baseAddr` */
  public loadWords(baseAddr: number, words: number[]): void {
    const uBase = toUint32(baseAddr);
    for (let i = 0; i < words.length; i++) {
      this.writeWord(uBase + i * 4, words[i]);
    }
  }

  /** Get all modified word addresses */
  public getModifiedWords(): number[] {
    return Array.from(this.modifiedWords).sort((a, b) => a - b);
  }

  /** Clone the entire memory state */
  public clone(): Memory {
    const copy = new Memory(this.size);
    copy.buffer.set(this.buffer);
    copy.modifiedWords = new Set<number>(this.modifiedWords);
    return copy;
  }

  /** Serialize memory to a sparse representation { address: hexWord } */
  public serializeSparse(): Record<string, number> {
    const sparse: Record<string, number> = {};
    for (const addr of this.modifiedWords) {
      sparse[addr.toString()] = this.readWord(addr);
    }
    return sparse;
  }

  /** Export direct buffer slice */
  public getBufferSlice(start: number, length: number): Uint8Array {
    return this.buffer.slice(start, start + length);
  }
}
