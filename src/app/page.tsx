'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Controls } from '../components/Controls';
import { Editor } from '../components/Editor';
import { RegisterFile } from '../components/RegisterFile';
import { MemoryInspector } from '../components/MemoryInspector';
import { MetricsOverview } from '../components/MetricsOverview';
import { DatapathVisualizer } from '../components/DatapathVisualizer';
import { DocModal } from '../components/DocModal';
import { PRESET_PROGRAMS, PresetProgram } from '../components/presets';
import { Assembler, AssembledProgram } from '../engine/assembler/assembler';
import { AssemblerError } from '../engine/assembler/errors';
import { GoldenInterpreter } from '../engine/golden/interpreter';
import { GoldenStateSnapshot } from '../engine/golden/state';
import { DecodedInstruction } from '../engine/isa/types';
import { decodeInstruction } from '../engine/isa/encoding';

export default function ArchLensApp() {
  const [selectedPreset, setSelectedPreset] = useState<PresetProgram>(PRESET_PROGRAMS[0]);
  const [sourceCode, setSourceCode] = useState<string>(PRESET_PROGRAMS[0].code);
  const [assembledProgram, setAssembledProgram] = useState<AssembledProgram | null>(null);
  const [assemblerError, setAssemblerError] = useState<AssemblerError | null>(null);

  // Simulator Instance Reference
  const simRef = useRef<GoldenInterpreter | null>(null);

  // UI Reactive State
  const [pc, setPc] = useState<number>(0);
  const [registers, setRegisters] = useState<number[]>(new Array(8).fill(0));
  const [changedRegisters, setChangedRegisters] = useState<Set<number>>(new Set());
  const [modifiedMemory, setModifiedMemory] = useState<Record<string, number>>({});
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [instructionCount, setInstructionCount] = useState<number>(0);
  const [isHalted, setIsHalted] = useState<boolean>(false);
  const [currentInstruction, setCurrentInstruction] = useState<DecodedInstruction | null>(null);

  // Playback & Timing
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedHz, setSpeedHz] = useState<number>(5); // 5 cycles/sec default for visible animation
  const [clockFreqMhz, setClockFreqMhz] = useState<number>(10);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);

  // Step-Back History Stack
  const historyStackRef = useRef<GoldenStateSnapshot[]>([]);
  const [canStepBack, setCanStepBack] = useState<boolean>(false);

  // Helper to sync UI state from simulator snapshot
  const syncStateFromSim = useCallback((sim: GoldenInterpreter, prevRegs?: number[]) => {
    const snap = sim.getSnapshot();
    setPc(snap.pc);
    setCycleCount(snap.cycleCount);
    setInstructionCount(snap.instructionCount);
    setIsHalted(snap.halted);
    setModifiedMemory(snap.modifiedMemory);

    // Compute changed registers
    if (prevRegs) {
      const changed = new Set<number>();
      for (let i = 0; i < 8; i++) {
        if (snap.registers[i] !== prevRegs[i]) {
          changed.add(i);
        }
      }
      setChangedRegisters(changed);
    } else {
      setChangedRegisters(new Set());
    }
    setRegisters([...snap.registers]);

    // Compute current instruction at PC if not halted
    if (!snap.halted && sim.memory) {
      try {
        const word = sim.memory.readWord(snap.pc);
        const decoded = decodeInstruction(word, snap.pc);
        setCurrentInstruction(decoded);
      } catch {
        setCurrentInstruction(null);
      }
    } else {
      setCurrentInstruction(null);
    }

    setCanStepBack(historyStackRef.current.length > 0);
  }, []);

  // Assemble and Load Program into Simulator
  const loadProgramIntoSim = useCallback((code: string) => {
    try {
      const program = Assembler.assemble(code);
      setAssembledProgram(program);
      setAssemblerError(null);

      const sim = new GoldenInterpreter();
      sim.loadProgram(program);
      simRef.current = sim;
      historyStackRef.current = [];

      syncStateFromSim(sim);
      setIsRunning(false);
    } catch (err: unknown) {
      if (err instanceof AssemblerError) {
        setAssemblerError(err);
      } else if (err instanceof Error) {
        setAssemblerError(new AssemblerError(err.message, 1, 1));
      }
      setIsRunning(false);
    }
  }, [syncStateFromSim]);

  // Initial mount: load first preset
  useEffect(() => {
    loadProgramIntoSim(sourceCode);
  }, []);

  // Single Step Forward
  const handleStepForward = useCallback(() => {
    const sim = simRef.current;
    if (!sim || sim.halted) return;

    // Save snapshot to history stack for step-back
    historyStackRef.current.push(sim.getSnapshot());
    if (historyStackRef.current.length > 500) {
      historyStackRef.current.shift(); // Bound memory
    }

    const prevRegs = [...sim.registers];
    sim.step();
    syncStateFromSim(sim, prevRegs);
  }, [syncStateFromSim]);

  // Single Step Back (Time Travel)
  const handleStepBack = useCallback(() => {
    if (historyStackRef.current.length === 0 || !simRef.current) return;

    const previousSnapshot = historyStackRef.current.pop();
    if (!previousSnapshot) return;

    const sim = simRef.current;
    sim.pc = previousSnapshot.pc;
    sim.halted = previousSnapshot.halted;
    sim.cycleCount = previousSnapshot.cycleCount;
    sim.instructionCount = previousSnapshot.instructionCount;
    for (let r = 0; r < 8; r++) {
      sim.setRegister(r, previousSnapshot.registers[r]);
    }

    // Reconstruct modified memory
    sim.memory.reset();
    if (assembledProgram) {
      for (const entry of assembledProgram.codeEntries) {
        sim.memory.writeWord(entry.address, entry.word);
      }
      for (const entry of assembledProgram.dataEntries) {
        sim.memory.writeWord(entry.address, entry.word);
      }
    }
    for (const [addrStr, word] of Object.entries(previousSnapshot.modifiedMemory)) {
      sim.memory.writeWord(parseInt(addrStr, 10), word);
    }

    syncStateFromSim(sim);
  }, [assembledProgram, syncStateFromSim]);

  // Reset Simulator
  const handleReset = useCallback(() => {
    setIsRunning(false);
    if (assembledProgram) {
      const sim = new GoldenInterpreter();
      sim.loadProgram(assembledProgram);
      simRef.current = sim;
      historyStackRef.current = [];
      syncStateFromSim(sim);
    }
  }, [assembledProgram, syncStateFromSim]);

  // Run to Completion (Halt)
  const handleRunToHalt = useCallback(() => {
    const sim = simRef.current;
    if (!sim || sim.halted) return;

    setIsRunning(false);
    let steps = 0;
    while (!sim.halted && steps < 100_000) {
      historyStackRef.current.push(sim.getSnapshot());
      sim.step();
      steps++;
      if (breakpoints.has(sim.pc)) {
        break; // Breakpoint hit
      }
    }
    syncStateFromSim(sim);
  }, [breakpoints, syncStateFromSim]);

  // Play / Pause Toggle
  const togglePlayPause = useCallback(() => {
    if (isHalted) return;
    setIsRunning((prev) => !prev);
  }, [isHalted]);

  // Timer loop when isRunning is true
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = Math.max(16, Math.floor(1000 / speedHz));
    const timer = setInterval(() => {
      const sim = simRef.current;
      if (!sim || sim.halted) {
        setIsRunning(false);
        return;
      }

      // Check breakpoint
      if (breakpoints.has(sim.pc) && sim.instructionCount > 0) {
        setIsRunning(false);
        return;
      }

      historyStackRef.current.push(sim.getSnapshot());
      if (historyStackRef.current.length > 500) {
        historyStackRef.current.shift();
      }

      const prevRegs = [...sim.registers];
      sim.step();
      syncStateFromSim(sim, prevRegs);

      if (sim.halted || breakpoints.has(sim.pc)) {
        setIsRunning(false);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speedHz, breakpoints, syncStateFromSim]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a textarea or input
      if (['TEXTAREA', 'INPUT', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === '.') {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === ',' || (e.shiftKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        handleStepBack();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, handleStepForward, handleStepBack, handleReset]);

  // Breakpoint toggle
  const toggleBreakpoint = (address: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  };

  // Switch Preset Program
  const handleSelectPreset = (preset: PresetProgram) => {
    setSelectedPreset(preset);
    setSourceCode(preset.code);
    loadProgramIntoSim(preset.code);
  };

  // Determine Overall Status
  const status = assemblerError
    ? 'error'
    : isHalted
    ? 'halted'
    : isRunning
    ? 'running'
    : instructionCount > 0
    ? 'paused'
    : 'idle';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation Bar */}
      <Navbar
        selectedPresetId={selectedPreset.id}
        onSelectPreset={handleSelectPreset}
        status={status}
        onOpenDocModal={() => setIsDocModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 space-y-4">
        {/* Top Control Deck & Execution Metrics */}
        <div className="space-y-3">
          <Controls
            isRunning={isRunning}
            canStepBack={canStepBack}
            canStepForward={!isHalted}
            isHalted={isHalted}
            onPlayPause={togglePlayPause}
            onStepForward={handleStepForward}
            onStepBack={handleStepBack}
            onReset={handleReset}
            onRunToHalt={handleRunToHalt}
            speedHz={speedHz}
            onSpeedChange={setSpeedHz}
            clockFreqMhz={clockFreqMhz}
            onClockFreqChange={setClockFreqMhz}
          />

          <MetricsOverview
            cycleCount={cycleCount}
            instructionCount={instructionCount}
            pc={pc}
            isHalted={isHalted}
            clockFreqMhz={clockFreqMhz}
          />
        </div>

        {/* 5-Stage Datapath Live Overview */}
        <DatapathVisualizer
          currentInstruction={currentInstruction}
          pc={pc}
          isHalted={isHalted}
        />

        {/* Workspace Panels Grid: Editor & Memory & Registers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Assembly Editor (5 cols) */}
          <div className="lg:col-span-5 h-[480px]">
            <Editor
              code={sourceCode}
              onChangeCode={setSourceCode}
              onAssemble={() => loadProgramIntoSim(sourceCode)}
              error={assemblerError}
              instructionCount={assembledProgram?.instructions.length ?? 0}
              dataBytesCount={assembledProgram?.totalBytesData ?? 0}
            />
          </div>

          {/* Right Column: Registers & Memory Inspector (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Architectural Register File */}
            <div>
              <RegisterFile
                registers={registers}
                changedRegisters={changedRegisters}
              />
            </div>

            {/* Memory Inspector (Text & Data) */}
            <div className="h-[360px]">
              <MemoryInspector
                assembledProgram={assembledProgram}
                modifiedMemory={modifiedMemory}
                currentPC={pc}
                breakpoints={breakpoints}
                onToggleBreakpoint={toggleBreakpoint}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>ArchLens PBL — Computer Organization & Architecture</span>
          <div className="flex items-center gap-3">
            <span>Shortcuts: <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Space</kbd> Run/Pause</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">.</kbd> Step</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">,</kbd> Step Back</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">R</kbd> Reset</span>
          </div>
        </div>
      </footer>

      {/* Documentation Modal */}
      <DocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />
    </div>
  );
}
