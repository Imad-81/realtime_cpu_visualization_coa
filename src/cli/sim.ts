#!/usr/bin/env tsx
/**
 * Headless CLI for MiniISA Simulator.
 * Usage: npm run sim -- <path-to-program.s> [--config config.json] [--json]
 */

import * as fs from 'fs';
import * as path from 'path';
import { Assembler } from '../engine/assembler/assembler';
import { GoldenInterpreter } from '../engine/golden/interpreter';
import { toHex32 } from '../engine/utils/bitwise';

function printHelp() {
  console.log(`
ArchLens MiniISA Simulator CLI
==============================
Usage:
  npm run sim -- <file.s> [options]

Options:
  --config <path>      Path to JSON configuration file
  --json               Output state in JSON format
  --max-steps <num>    Maximum instructions to execute (default: 100000)
  --help               Display this help message
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  let filePath: string | null = null;
  let isJson = false;
  let maxSteps = 100000;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      isJson = true;
    } else if (arg === '--max-steps') {
      maxSteps = parseInt(args[++i], 10);
    } else if (arg.startsWith('--')) {
      // Ignore or handle other flags
    } else if (!filePath) {
      filePath = arg;
    }
  }

  if (!filePath) {
    console.error('Error: No assembly file specified.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const sourceCode = fs.readFileSync(resolvedPath, 'utf-8');

  try {
    const program = Assembler.assemble(sourceCode);
    const interp = new GoldenInterpreter();
    interp.loadProgram(program);
    interp.run(maxSteps);

    const snapshot = interp.getSnapshot();

    if (isJson) {
      console.log(JSON.stringify(snapshot, null, 2));
      return;
    }

    console.log('\n============================================================');
    console.log(` ArchLens MiniISA Simulation: ${path.basename(filePath)}`);
    console.log('============================================================\n');

    console.log('Execution Summary:');
    console.log(`  Instructions Retired: ${snapshot.instructionCount}`);
    console.log(`  Simulated Cycles:     ${snapshot.cycleCount}`);
    console.log(`  Program Counter (PC): ${toHex32(snapshot.pc)}`);
    console.log(`  Halted:               ${snapshot.halted ? 'YES' : 'NO'}`);

    console.log('\nRegister File:');
    console.log('  +------+--------------------+--------------------+');
    console.log('  | Reg  | Hex Value          | Signed Decimal     |');
    console.log('  +------+--------------------+--------------------+');
    for (let r = 0; r < 8; r++) {
      const val = snapshot.registers[r];
      const hex = toHex32(val);
      const dec = val.toString().padStart(18, ' ');
      console.log(`  | R${r}   | ${hex}         | ${dec} |`);
    }
    console.log('  +------+--------------------+--------------------+');

    const modMem = Object.entries(snapshot.modifiedMemory);
    if (modMem.length > 0) {
      console.log('\nData Memory (Modified Words):');
      console.log('  +--------------------+--------------------+--------------------+');
      console.log('  | Address            | Hex Value          | Signed Decimal     |');
      console.log('  +--------------------+--------------------+--------------------+');
      for (const [addrStr, word] of modMem) {
        const addr = parseInt(addrStr, 10);
        console.log(`  | ${toHex32(addr)}         | ${toHex32(word)}         | ${word.toString().padStart(18, ' ')} |`);
      }
      console.log('  +--------------------+--------------------+--------------------+');
    }

    console.log('\nSimulation completed successfully.\n');
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('\n' + err.message + '\n');
    } else {
      console.error('Unknown error:', err);
    }
    process.exit(1);
  }
}

main();
