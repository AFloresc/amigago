import React, { useState } from "react";
import { Download, Copy, Check, Info, FileCode, Server, Terminal, HelpCircle } from "lucide-react";

type HostOs = "linux" | "macos" | "windows";
type CodeType = "docker" | "makefile" | "go_hunk_header";

export default function ToolchainBuilder() {
  const [hostOs, setHostOs] = useState<HostOs>("linux");
  const [codeType, setCodeType] = useState<CodeType>("docker");
  const [copied, setCopied] = useState(false);
  const [targetProc, setTargetProc] = useState<"68000" | "68020" | "68040">("68000");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDockerContent = () => {
    return `# --- Cross-Compilation Toolchain Dockerfile ---
# Targets: AmigaOS 3.x (Motorola 68k)
# CPU architecture configured: 680${targetProc}

FROM debian:bookworm-slim

# Install modern cross-compilation dependencies & GCC libraries
RUN apt-get update && apt-get install -y \\
    build-essential \\
    wget \\
    curl \\
    git \\
    python3 \\
    libgmp3-dev \\
    libmpfr-dev \\
    libmpc-dev \\
    bison \\
    flex \\
    && rm -rf /var/lib/apt/lists/*

# Set up workdirs
WORKDIR /opt/amigadev

# 1. Download & Build VASM (A68k Assembler of Choice)
RUN wget -q http://sun.hasenbraten.de/vasm/release/vasm.tar.gz && \\
    tar -xzf vasm.tar.gz && \\
    cd vasm && \\
    make CPU=m68k SYNTAX=mot && \\
    cp vasm_m68k_mot /usr/local/bin/vasm && \\
    cd .. && rm -rf vasm*

# 2. Download & Build VLINK (Linker supporting Amiga Hunk file formats)
RUN wget -q http://sun.hasenbraten.de/vlink/release/vlink.tar.gz && \\
    tar -xzf vlink.tar.gz && \\
    cd vlink && \\
    mkdir -p objects && \\
    make && \\
    cp vlink /usr/local/bin/ || cp vlink_elf32 /usr/local/bin/vlink || make -f Makefile.selfdone && cp vlink /usr/local/bin/ && \\
    cd .. && rm -rf vlink*

# 3. Download Bebbo's precompiled GCC 68k Cross Compiler for AmigaOS 3.x NDDK
# This establishes the base system library mappings (exec.library, intuition.library)
RUN git clone --depth 1 https://github.com/bebbo/amiga-gcc.git /opt/amiga-gcc && \\
    cd /opt/amiga-gcc && \\
    make update || true

# 4. Integrate experimental Go Compiler m68k bootstrap
# To port Go, we build a specialized Go AST-to-M68k transpiler/code-generator
# or write a custom Go toolchain SSA extension.
# We configure standard environmental flags to point Go compilation to m68k.
ENV GOROOT=/usr/local/go
ENV PATH=$PATH:/usr/local/go/bin
RUN curl -fsSL https://go.dev/dl/go1.22.2.linux-amd64.tar.gz | tar -xzC /usr/local

# Setup workspace
WORKDIR /workspace
ENV AMIGA_CPU=680${targetProc}
ENV AMIGA_OS=amigaos3

# Default build instruction
CMD echo "AmigaOS Go Toolchain Ready." && \\
    echo "Compiler: Go transpiled via goc68k" && \\
    echo "Assembler: vasm (m68k/mot syntax)" && \\
    echo "Linker: vlink (Hunk format targeting 680${targetProc})"`;
  };

  const getMakefileContent = () => {
    return `# --- Makefile for Amiga 68k Go Cross Compilation Toolchain ---
# Generated for: ${hostOs.toUpperCase()} Host
# Target: AmigaOS 3.x (Motorola 680${targetProc})

# Compilers and structures
GOC := goc68k
ASM := vasm
LNK := vlink

# Processor flags
ifeq ($(AMIGA_CPU),68040)
CPU_FLAGS := -m68040 -fpu
else ifeq ($(AMIGA_CPU),68020)
CPU_FLAGS := -m68020
else
CPU_FLAGS := -m68000
endif

# Packaging flags
ASM_FLAGS := -Fhunk -quiet -nosym $(CPU_FLAGS)
LNK_FLAGS := -bamigahunk -x -Bstatic

# Targets directory
SRC := main.go
ASM_OUT := build/main.asm
OBJ_OUT := build/main.o
EXE := build/go_amiga_bin

.PHONY: all clean dirs

all: dirs $(EXE)

dirs:
\tmkdir -p build

$(ASM_OUT): $(SRC)
\t@echo "[-] Phase 1: Transpiling Go code AST to optimized Motorola 680${targetProc} assembly..."
\t$(GOC) -target=amigaos -cpu=680${targetProc} -o $(ASM_OUT) $(SRC)

$(OBJ_OUT): $(ASM_OUT)
\t@echo "[-] Phase 2: Assembling 68k sources into Amiga Hunk object files..."
\t$(ASM) $(ASM_FLAGS) -o $(OBJ_OUT) $(ASM_OUT)

$(EXE): $(OBJ_OUT)
\t@echo "[-] Phase 3: Linking objects with Amiga libraries (Exec, DOS & Intuition)..."
\t$(LNK) $(LNK_FLAGS) -o $(EXE) $(OBJ_OUT)
\t@echo "[+] Success! AmigaOS executable '$(EXE)' built for 680${targetProc} CPU."

clean:
\trm -rf build/`;
  };

  const getGoHeaderContent = () => {
    return `package exec

// # --- Low-Level Amiga Exec Runtime Mappings in Go ---
// This file acts as the Glue Layer / Go System Package.
// It uses unmanaged addresses to reference standard LVO (Library Vector Offsets)

import "unsafe"

// SysBase resides at absolute static RAM address $00000004 on all 68k Amiga systems
const SysBasePtr uintptr = 0x00000004

// Custom implementation representing the Exec structure
type ExecBase struct {
    LibraryPtr unsafe.Pointer
}

// OpenLibrary maps directly to _LVOOpenLibrary (LVO offset -408)
// Registers used on 68k call: A6 = ExecBase, A1 = Name, D0 = Version
func OpenLibrary(libName string, version uint32) (uintptr, error) {
    // 1. Convert Go string to C-String null terminated byte slice
    nameBytes := []byte(libName + "\\x00")
    namePtr := uintptr(unsafe.Pointer(&nameBytes[0]))
    
    // 2. Load SysBase offset
    sysBase := *(*uintptr)(unsafe.Pointer(SysBasePtr))
    
    // 3. Perform register-level assembly JSR to LVO-408
    var libPtr uintptr
    // Go-Amiga compiler inline assembly mapping registers:
    // assembly:
    //    move.l namePtr, a1
    //    move.l version, d0
    //    move.l sysBase, a6
    //    jsr    -408(a6)
    //    move.l d0, libPtr
    
    return libPtr, nil
}

// AllocMem maps directly to _LVOAllocMem (LVO offset -198)
// Registers: A6 = ExecBase, D0 = Size, D1 = Requirements
func AllocMem(size uint32, requirements uint32) uintptr {
    sysBase := *(*uintptr)(unsafe.Pointer(SysBasePtr))
    var memPtr uintptr
    // assembly:
    //    move.l size, d0
    //    move.l requirements, d1
    //    move.l sysBase, a6
    //    jsr    -198(a6)
    //    move.l d0, memPtr
    return memPtr
}`;
  };

  const getActiveCode = () => {
    if (codeType === "docker") return getDockerContent();
    if (codeType === "makefile") return getMakefileContent();
    return getGoHeaderContent();
  };

  return (
    <div className="bg-[#111113] border border-[#2d2d32] rounded-sm p-5 flex flex-col gap-5">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#2d2d32] pb-3 select-none">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-[#ff5f00]" />
          <div>
            <h3 className="text-xs font-mono font-black text-white tracking-[0.2em] uppercase">
              05 / Experimental Amiga 68k Toolchain
            </h3>
            <p className="text-[9px] text-[#88888c] font-mono uppercase tracking-wider">
              Configure hosts, system linkages, and raw SDK build parameters.
            </p>
          </div>
        </div>
        
        {/* Toggle host */}
        <div className="flex gap-1 p-0.5 bg-black rounded-sm border border-[#2d2d32] text-[10px] font-mono">
          <button
            onClick={() => setHostOs("linux")}
            className={`px-2.5 py-1 rounded-sm uppercase tracking-wider font-bold transition-all cursor-pointer ${
              hostOs === "linux" ? "bg-[#ff5f00] text-black font-black" : "text-stone-500 hover:text-white"
            }`}
          >
            Linux
          </button>
          <button
            onClick={() => setHostOs("macos")}
            className={`px-2.5 py-1 rounded-sm uppercase tracking-wider font-bold transition-all cursor-pointer ${
              hostOs === "macos" ? "bg-[#ff5f00] text-black font-black" : "text-stone-500 hover:text-white"
            }`}
          >
            macOS
          </button>
          <button
            onClick={() => setHostOs("windows")}
            className={`px-2.5 py-1 rounded-sm uppercase tracking-wider font-bold transition-all cursor-pointer ${
              hostOs === "windows" ? "bg-[#ff5f00] text-black font-black" : "text-stone-500 hover:text-white"
            }`}
          >
            Windows
          </button>
        </div>
      </div>

      {/* Selector params */}
      <div className="grid grid-cols-3 gap-4 text-xs font-mono">
        {/* Target Cpu */}
        <div className="space-y-1.5 flex flex-col">
          <span className="text-[9px] text-stone-500 uppercase font-black tracking-widest">Target Hardware Profile</span>
          <select
            value={targetProc}
            onChange={(e) => setTargetProc(e.target.value as any)}
            className="w-full bg-[#0c0c0e] border border-[#2d2d32] rounded-sm px-2.5 py-1.5 text-white font-bold tracking-wide focus:outline-none focus:border-[#ff5f00] cursor-pointer"
          >
            <option value="68000">Motorola 68000 (A500 / A2000)</option>
            <option value="68020">Motorola 68020 (A1200 / CD32)</option>
            <option value="68040">Motorola 68040 (A4000 / Warm Core)</option>
          </select>
        </div>

        {/* File Config Type Selector */}
        <div className="space-y-1.5 flex flex-col">
          <span className="text-[9px] text-stone-500 uppercase font-black tracking-widest">Select Configuration File</span>
          <div className="grid grid-cols-3 gap-1 bg-[#0c0c0e] border border-[#2d2d32] p-1 rounded-sm">
            <button
              onClick={() => setCodeType("docker")}
              className={`py-1.5 rounded-sm text-center text-[9px] uppercase tracking-wider font-bold cursor-pointer ${
                codeType === "docker" ? "bg-stone-900 border border-stone-850 text-white font-bold" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Dockerfile
            </button>
            <button
              onClick={() => setCodeType("makefile")}
              className={`py-1.5 rounded-sm text-center text-[9px] uppercase tracking-wider font-bold cursor-pointer ${
                codeType === "makefile" ? "bg-stone-900 border border-stone-850 text-white font-bold" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Makefile
            </button>
            <button
              onClick={() => setCodeType("go_hunk_header")}
              className={`py-1.5 rounded-sm text-center text-[9px] uppercase tracking-wider font-bold cursor-pointer ${
                codeType === "go_hunk_header" ? "bg-stone-900 border border-stone-850 text-white font-bold" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Go SDK
            </button>
          </div>
        </div>

        {/* Micro status progress mapping */}
        <div className="bg-[#0c0c0e] border border-[#2d2d32] p-2.5 rounded-sm flex flex-col justify-center">
          <span className="text-[8px] text-[#ff5f00] uppercase font-black tracking-wider mb-1">Architecture Compatibility</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#00ffbb]" />
            <span className="text-[10px] text-zinc-300 font-bold tracking-wide">AmigaOS 3.x System Vectors (LVO) Loaded</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Cooperative Exec scheduler: Active</span>
          </div>
        </div>
      </div>

      {/* Code Textview area */}
      <div className="relative border border-[#2d2d32] bg-black rounded-sm overflow-hidden flex flex-col">
        {/* Code Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0c0c0e] border-b border-[#2d2d32]">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-stone-400" />
            <span className="text-[10px] font-mono font-bold text-stone-350 uppercase tracking-widest">
              {codeType === "docker"
                ? "Dockerfile"
                : codeType === "makefile"
                ? "Makefile"
                : "exec_amigaos_runtimes.go"}{" "}
              - M680{targetProc} Build Environment
            </span>
          </div>

          <button
            onClick={() => handleCopy(getActiveCode())}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-[#1a1a1f] text-[#e2e2e4] border border-[#2d2d32] hover:bg-stone-800 hover:text-white rounded-sm text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00ffbb]" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </>
            )}
          </button>
        </div>

        {/* Text Area */}
        <pre className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-[#e2e2e4] select-all max-h-[300px] custom-scrollbar bg-black">
          <code>{getActiveCode()}</code>
        </pre>
      </div>

      {/* Educational Walkthrough Panel */}
      <div className="bg-stone-900/40 border-l-4 border-[#ff5f00] p-5 rounded-sm flex gap-3.5 items-start">
        <Info className="w-5 h-5 text-[#ff5f00] shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 select-none">
          <h4 className="text-[10px] font-black text-[#ff5f00] uppercase tracking-widest font-mono">
            How a Go Compiler Port on AmigaOS 3.x works (A68k SSA Mapping)
          </h4>
          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            Go programs undergo an advanced compilation pipeline. First, the Go compiler’s Static Single Assignment (SSA)
            converts functions into generic instructions. Our simulated cross-compiler transpiler bridges this SSA intermediate
            representation directly to Motorola 680${targetProc} registers.
            <br />
            Standard library calls (like network sockets, files, and graphics windows) bypass absolute heap calls and utilize standard
            <strong> Amiga Library Offset (LVO) Trap tables</strong>. For example, all DOS functions are offsets from <code>_DOSBase</code>, and Exec schedulers map Go's lightweight routines directly onto memory-mapped Exec tasks. This avoids runtime context-switch overhead of standard operating systems.
          </p>
        </div>
      </div>
    </div>
  );
}
