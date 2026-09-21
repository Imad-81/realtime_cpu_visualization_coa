/**
 * Bitwise and 32-bit integer arithmetic utilities for MiniISA.
 * All arithmetic in MiniISA is 32-bit two's complement integer arithmetic.
 */

/** Force any number into signed 32-bit integer (-2^31 to 2^31 - 1) */
export function toInt32(val: number): number {
  return val | 0;
}

/** Force any number into unsigned 32-bit integer (0 to 2^32 - 1) */
export function toUint32(val: number): number {
  return (val >>> 0);
}

/**
 * Sign-extend a signed immediate of `bits` width to a full 32-bit signed integer.
 * For example, a 16-bit negative number 0xFFFF (-1) becomes -1 in 32-bit.
 */
export function signExtend(val: number, bits: number): number {
  const shift = 32 - bits;
  return (val << shift) >> shift;
}

/** Specialized 16-bit to 32-bit sign extension */
export function signExtend16to32(val: number): number {
  return (val << 16) >> 16;
}

/**
 * Extract a range of bits: [start : start - length + 1] or [end : start]
 * Here: extract `length` bits starting from bit position `start` (0-indexed from LSB).
 * Example: extractBits(0b1101_0000, 4, 4) extracts 4 bits starting at bit 4 -> 0b1101 = 13.
 */
export function extractBits(val: number, start: number, length: number): number {
  const mask = (1 << length) - 1;
  return (val >>> start) & mask;
}

/** Format a number as 32-bit hex with 0x prefix, e.g. "0x0000000A" */
export function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/** Format a number as 16-bit hex with 0x prefix */
export function toHex16(val: number): string {
  return '0x' + (val & 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
}

/** Format a number as 8-bit hex with 0x prefix */
export function toHex8(val: number): string {
  return '0x' + (val & 0xFF).toString(16).padStart(2, '0').toUpperCase();
}

/** 32-bit integer multiplication preserving lower 32-bit signed word */
export function mul32(a: number, b: number): number {
  return Math.imul(a, b) | 0;
}
