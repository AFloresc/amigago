import React, { useState, useEffect } from "react";
import { Cpu, RotateCcw, ArrowRight, Table } from "lucide-react";
import { RegisterState, CpuType } from "../types";

interface RegisterViewerProps {
  cpu: CpuType;
  assemblyCode: string;
  isCompiling: boolean;
  hasCompiled: boolean;
}

const initialRegisterState = (cpu: CpuType): RegisterState => ({
  d0: "0x00000000",
  d1: "0x00000000",
  d2: "0x00000000",
  d3: "0x00000000",
  d4: "0x00000000",
  d5: "0x00000000",
  d6: "0x00000000",
  d7: "0x00000000",
  a0: "0x00000000",
  a1: "0x00000000",
  a2: "0x00000000",
  a3: "0x00000000",
  a4: "0x00000000",
  a5: "0x00000000",
  a6: "0x00DFF000", // Standard library base / hardware base offset
  a7: "0x00C023F0", // Stack pointer index
  pc: "0x00104100", // Entry program counter marker
  sr: "0x2700",     // Supervisor mode, interrupt disable masks
  cycles: 0,
  fastRam: cpu === "68040" ? "8192 KB" : cpu === "68020" ? "4096 KB" : "512 KB",
  chipRam: cpu === "68040" ? "2048 KB" : cpu === "68020" ? "2048 KB" : "1024 KB",
});

export default function RegisterViewer({
  cpu,
  assemblyCode,
  isCompiling,
  hasCompiled,
}: RegisterViewerProps) {
  const [registers, setRegisters] = useState<RegisterState>(initialRegisterState(cpu));
  const [assemblyLines, setAssemblyLines] = useState<string[]>([]);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(-1);

  // Sync instruction lines on assembly changes
  useEffect(() => {
    if (assemblyCode) {
      const lines = assemblyCode
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith(";"));
      setAssemblyLines(lines);
      setActiveLineIdx(-1);
      setRegisters(initialRegisterState(cpu));
    }
  }, [assemblyCode, cpu]);

  const handleStepInstruction = () => {
    if (!hasCompiled || assemblyLines.length === 0) return;
    
    const nextIdx = (activeLineIdx + 1) % assemblyLines.length;
    setActiveLineIdx(nextIdx);
    
    const currentLine = assemblyLines[nextIdx];
    
    // Parse simulated assembly instructions to update register values
    setRegisters((prev) => {
      const updated = { ...prev };
      updated.cycles += cpu === "68000" ? 12 : cpu === "68020" ? 6 : 2; // Simulated instruction execution times
      
      // Basic simulation behavior
      if (currentLine.includes("move.l") || currentLine.includes("move.w") || currentLine.includes("moveq")) {
        // e.g. move.l #$DFF000, a0 or move.l _DOSBase, a6 or moveq #36, d0
        const parts = currentLine.split(/\s+/);
        const source = parts[1] ? parts[1].replace(",", "") : "";
        const dest = parts[2] ? parts[2].toLowerCase() : "";
        
        let val = "0x000A3F10"; // Default register values
        if (source.includes("$")) {
          val = "0x00" + source.substring(source.indexOf("$") + 1);
        } else if (source.includes("#")) {
          const numValue = parseInt(source.replace("#", ""), 10);
          if (!isNaN(numValue)) {
            val = "0x" + numValue.toString(16).padStart(8, "0").toUpperCase();
          }
        }
        
        if (dest === "a0") updated.a0 = val;
        else if (dest === "a1") updated.a1 = val;
        else if (dest === "a2") updated.a2 = val;
        else if (dest === "a6") updated.a6 = val;
        else if (dest === "d0") updated.d0 = val;
        else if (dest === "d1") updated.d1 = val;
        else if (dest === "d2") updated.d2 = val;
        else if (dest === "d3") updated.d3 = val;
      } else if (currentLine.includes("jsr")) {
        // JSR system trap
        updated.sr = "0x2704"; // Toggle Zero, Active traps flags
        updated.pc = "0x00FE2040"; // Jump to ROM block address
      } else if (currentLine.includes("link")) {
        updated.a7 = "0x00C023E0"; // Lower stack index
      } else if (currentLine.includes("unlk")) {
        updated.a7 = "0x00C023F0"; // Restore stack index
      } else {
        // Normal instructions
        updated.sr = "0x2700";
      }
      
      // Advance Program Counter
      const pcVal = parseInt(prev.pc, 16) + 4;
      updated.pc = "0x" + pcVal.toString(16).padStart(8, "0").toUpperCase();
      
      return updated;
    });
  };

  const handleResetRegisters = () => {
    setRegisters(initialRegisterState(cpu));
    setActiveLineIdx(-1);
  };

  return (
    <div className="bg-[#111113] border border-[#2d2d32] rounded-sm p-5 flex flex-col gap-4">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between border-b border-[#2d2d32] pb-3 select-none">
        <div className="flex items-center gap-2">
          <Cpu className="w-4.5 h-4.5 text-[#ff5f00]" />
          <div>
            <h3 className="text-xs font-mono font-black text-white tracking-[0.2em] uppercase">
              03 / Motorola 680{cpu} Register Inspector
            </h3>
            <p className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">
              PAL Clock Speed: ~{cpu === "68040" ? "40MHz" : cpu === "68020" ? "14MHz" : "7.16MHz"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="btn_step"
            disabled={!hasCompiled || isCompiling || assemblyLines.length === 0}
            onClick={handleStepInstruction}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm border transition-colors cursor-pointer ${
              !hasCompiled || isCompiling || assemblyLines.length === 0
                ? "bg-zinc-900 text-stone-600 border-stone-800 cursor-not-allowed"
                : "bg-[#ff5f00] text-black border-[#ff5f00] hover:bg-white hover:border-white hover:text-black font-black"
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" /> Step
          </button>
          
          <button
            id="btn_reset_reg"
            disabled={!hasCompiled || isCompiling}
            onClick={handleResetRegisters}
            className={`flex items-center gap-1 py-1.5 px-3 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm border transition-colors cursor-pointer ${
              !hasCompiled || isCompiling
                ? "bg-zinc-900 text-stone-600 border-stone-800 cursor-not-allowed"
                : "bg-[#1a1a1f] text-[#e2e2e4] border-[#2d2d32] hover:bg-stone-800 hover:text-white"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Main registers grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Data Registers block */}
        <div className="col-span-2 space-y-1.5 bg-[#0c0c0e] p-3.5 rounded-sm border border-[#2d2d32]">
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black pb-2 border-b border-stone-900">
            D0 - D7 Data Registers
          </div>
          {[
            { label: "D0 (Result)", val: registers.d0 },
            { label: "D1 (Param1)", val: registers.d1 },
            { label: "D2 (Param2)", val: registers.d2 },
            { label: "D3 (Param3)", val: registers.d3 },
            { label: "D4 (Temp1)", val: registers.d4 },
            { label: "D5 (Temp2)", val: registers.d5 },
            { label: "D6 (Index1)", val: registers.d6 },
            { label: "D7 (Index2)", val: registers.d7 },
          ].map((reg, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs font-mono py-0.5">
              <span className="text-[10px] text-zinc-400 font-medium">{reg.label}</span>
              <span className="text-white font-bold tracking-wide">{reg.val}</span>
            </div>
          ))}
        </div>

        {/* Address Registers block */}
        <div className="col-span-2 space-y-1.5 bg-[#0c0c0e] p-3.5 rounded-sm border border-[#2d2d32]">
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black pb-2 border-b border-stone-900">
            A0 - A7 Address Registers
          </div>
          {[
            { label: "A0 (ParamPtr/Bob)", val: registers.a0 },
            { label: "A1 (StructPtr)", val: registers.a1 },
            { label: "A2 (ClosurePtr)", val: registers.a2 },
            { label: "A3 (BufferPtr)", val: registers.a3 },
            { label: "A4 (DataPtr)", val: registers.a4 },
            { label: "A5 (StackFrame)", val: registers.a5 },
            { label: "A6 (LibraryBase)", val: registers.a6, highlight: true },
            { label: "A7 (StackPointer)", val: registers.a7, bold: true },
          ].map((reg, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs font-mono py-0.5">
              <span className="text-[10px] text-zinc-400 font-medium">{reg.label}</span>
              <span className={`${reg.highlight ? "text-[#ff5f00]" : reg.bold ? "text-yellow-500" : "text-[#00ffbb]"} font-bold tracking-wide`}>
                {reg.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Program registers & Hardware Info bar */}
      <div className="grid grid-cols-4 gap-2.5 bg-black p-3.5 rounded-sm border border-[#2d2d32] text-[10px] font-mono">
        <div className="flex flex-col">
          <span className="text-[8px] text-zinc-650 font-bold uppercase tracking-wider">Program Counter</span>
          <span className="text-white font-bold">{registers.pc}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-zinc-650 font-bold uppercase tracking-wider">Status Register</span>
          <span className="text-white font-bold">{registers.sr}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-zinc-650 font-bold uppercase tracking-wider">Total CPU Cycles</span>
          <span className="text-[#ff5f00] font-black">{registers.cycles} clk</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-zinc-650 font-bold uppercase tracking-wider">System Memory</span>
          <span className="text-zinc-300 font-semibold">{registers.chipRam} Chip | {registers.fastRam} Fast</span>
        </div>
      </div>

      {/* Active assembly steps display */}
      <div className="bg-black border border-[#2d2d32] p-4 rounded-sm flex flex-col gap-2 h-[140px] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black select-none border-b border-stone-900 pb-1.5">
          <span>Assembly Code Pipeline Tracker</span>
          <span className="flex items-center gap-1"><Table className="w-3 h-3 text-[#ff5f00]" /> vasm hunk view</span>
        </div>
        
        <div className="space-y-1">
          {assemblyLines.length > 0 ? (
            assemblyLines.map((line, idx) => {
              const isActive = idx === activeLineIdx;
              const isLabel = line.trim().endsWith(":");
              
              return (
                <div
                  key={idx}
                  className={`text-[10px] font-mono py-0.5 px-2 rounded-sm flex gap-3 transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-[#ff5f00] font-bold border-l-2 border-[#ff5f00]"
                      : isLabel
                      ? "text-[#a855f7]"
                      : "text-[#88888c]"
                  }`}
                >
                  <span className="w-5 text-[8px] text-stone-600 select-none text-right">{(idx + 1).toString().padStart(2, "0")}</span>
                  <span className="truncate">{line}</span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs font-mono text-zinc-600 select-none uppercase tracking-wider">
              Run translation compilation to sequence CPU instructions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
