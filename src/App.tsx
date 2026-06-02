import React, { useState, useEffect } from "react";
import { 
  Monitor, 
  Cpu, 
  BrainCircuit, 
  Server, 
  Sparkles, 
  FileCode, 
  Terminal, 
  BookOpen, 
  CheckCircle,
  Clock
} from "lucide-react";
import Editor from "./components/Editor";
import CrtDisplay from "./components/CrtDisplay";
import RegisterViewer from "./components/RegisterViewer";
import AiAssistant from "./components/AiAssistant";
import ToolchainBuilder from "./components/ToolchainBuilder";
import { templates } from "./data/templates";
import { GoTemplate, CpuType, AmigaOsVersion } from "./types";

export default function App() {
  const [activeTemplate, setActiveTemplate] = useState<GoTemplate>(templates[0]);
  const [code, setCode] = useState<string>(templates[0].code);
  const [cpu, setCpu] = useState<CpuType>("68000");
  const [targetOs, setTargetOs] = useState<AmigaOsVersion>("AmigaOS 3.1");
  const [optLevel, setOptLevel] = useState<string>("O1");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [hasCompiled, setHasCompiled] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(templates[0].consoleLines);
  const [activeRightTab, setActiveRightTab] = useState<"monitor" | "registers" | "ai" | "toolchain">("monitor");
  const [analysisText, setAnalysisText] = useState<string>("");
  const [curTimeUTC, setCurTimeUTC] = useState<string>("2026-06-01 17:52:00");

  // Keep simulated time accurate
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurTimeUTC(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update editor value when template changes
  const handleLoadTemplate = (tmpl: GoTemplate) => {
    setActiveTemplate(tmpl);
    setCode(tmpl.code);
    setHasCompiled(false);
    setIsCompiling(false);
    setConsoleLogs(tmpl.consoleLines);
    setActiveRightTab("monitor");
    setAnalysisText("");
  };

  // Compile Trigger Simulation
  const handleRunCompilation = () => {
    setIsCompiling(true);
    setHasCompiled(false);
    setActiveRightTab("monitor");

    // Dynamic initial logs
    const initialLogs = [
      `1> goc68k -cpu=680${cpu} -os=${targetOs.toLowerCase().replace(" ", "")} -opt=${optLevel} main.go`,
      `[Go-Amiga v1.4] Initializing Static Single Assignment (SSA) parsing blocks...`,
      `[SSA-Parser] Mapped ${code.split("\n").length} source rows into Go intermediate AST nodes.`
    ];
    setConsoleLogs(initialLogs);

    setTimeout(() => {
      // Dynamic linker logs
      const updatedLogs = [
        ...initialLogs,
        `[CodeGen] Allocating Motorola 680${cpu} physical register matrix.`,
        `[CodeGen] Translating closures & interfaces using custom dynamic library link structures.`,
        `[Linker] Bypassing virtual kernel paths: mapping triggers directly to ROM system library base vectors.`,
        `[Assembler] Invoking vasm assembler (M680${cpu} target, Motorolla conventions)...`,
        `[Linker] Invoking vlink linker mapping executable segments into Amiga Standard HUNK file chunks...`,
        `SUCCESS: Executable 'go_binary_${cpu}.run' generated successfully. Solid payload size: ${
          cpu === "68040" ? "12.8 KB" : cpu === "68020" ? "9.4 KB" : "8.2 KB"
        } (Highly Compact!)`,
        `1> run go_binary_${cpu}.run`,
        `[Go-Exec] Instantiating ${targetOs} startup parameters.`,
        `[Go-Exec] System stack allocated at physical memory 0x00C023F0 - Heap limit safe.`,
        ...activeTemplate.consoleLines.filter(line => !line.startsWith("1>") && !line.includes("goc68k"))
      ];
      setConsoleLogs(updatedLogs);
      setIsCompiling(false);
      setHasCompiled(true);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#e2e2e4] flex flex-col font-sans">
      
      {/* Visual Tech Header Grid */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 border-b border-[#2d2d32] bg-[#0c0c0e]">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#ff5f00] mb-2">
            Target OS: {targetOs} | Motorola 680x0 Preserves
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase">
            Amiga<span className="text-[#ff5f00]">Go</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-mono tracking-wider mt-3 uppercase">
            Interactive Cross-Compiler &amp; assembler simulator for legacy m68k hardware
          </p>
        </div>

        {/* System telemetry info */}
        <div className="text-right mt-4 md:mt-0 space-y-1">
          <div className="font-mono text-xs font-bold text-[#ff5f00]">VER 1.4.0-BETA</div>
          <div className="font-mono text-xs opacity-50">TARGET: M68K-AMIGAOS</div>
          <div className="font-mono text-[10px] opacity-40">TIME: {curTimeUTC}</div>
          <div className="font-mono text-[10px] opacity-40">USER: agauser@gmail.com</div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-[#0c0c0e]">
        
        {/* Left Column (5/12): Editor & Script Selection */}
        <div className="lg:col-span-5 flex flex-col bg-[#111113] border border-[#2d2d32] p-6">
          <Editor
            onLoadTemplate={handleLoadTemplate}
            activeTemplate={activeTemplate}
            code={code}
            setCode={setCode}
            cpu={cpu}
            setCpu={setCpu}
            targetOs={targetOs}
            setTargetOs={setTargetOs}
            optLevel={optLevel}
            setOptLevel={setOptLevel}
            isCompiling={isCompiling}
            onRunCompilation={handleRunCompilation}
            hasCompiled={hasCompiled}
          />
        </div>

        {/* Right Column (7/12): CRT displays, registers step, AI Assistant & Toolchains */}
        <div className="lg:col-span-7 flex flex-col gap-6 bg-[#111113] border border-[#2d2d32] p-6">
          
          {/* Custom Tabs Bar Selector */}
          <div className="flex flex-wrap items-center gap-1 bg-[#0c0c0e] p-1 border border-[#2d2d32] select-none text-[11px] font-mono font-bold">
            
            <button
              id="right_tab_monitor"
              onClick={() => setActiveRightTab("monitor")}
              className={`flex items-center gap-2 px-4 py-2 transition-all grow justify-center md:justify-start ${
                activeRightTab === "monitor"
                  ? "bg-[#ff5f00] text-black font-black uppercase tracking-wider"
                  : "text-[#88888c] hover:text-white uppercase tracking-wider"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>1084S CRT Monitor</span>
            </button>

            <button
              id="right_tab_registers"
              onClick={() => setActiveRightTab("registers")}
              className={`flex items-center gap-2 px-4 py-2 transition-all grow justify-center md:justify-start ${
                activeRightTab === "registers"
                  ? "bg-[#ff5f00] text-black font-black uppercase tracking-wider"
                  : "text-[#88888c] hover:text-white uppercase tracking-wider"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>M68k Registers</span>
            </button>

            <button
              id="right_tab_ai"
              onClick={() => setActiveRightTab("ai")}
              className={`flex items-center gap-2 px-4 py-2 transition-all grow justify-center md:justify-start ${
                activeRightTab === "ai"
                  ? "bg-[#ff5f00] text-black font-black uppercase tracking-wider"
                  : "text-[#88888c] hover:text-white uppercase tracking-wider"
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Gemini Advisor</span>
            </button>

            <button
              id="right_tab_toolchain"
              onClick={() => setActiveRightTab("toolchain")}
              className={`flex items-center gap-2 px-4 py-2 transition-all grow justify-center md:justify-start ${
                activeRightTab === "toolchain"
                  ? "bg-[#ff5f00] text-black font-black uppercase tracking-wider"
                  : "text-[#88888c] hover:text-white uppercase tracking-wider"
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Toolchain Setup</span>
            </button>

          </div>

          {/* Active Tab Panel Body */}
          <div className="flex-1 flex flex-col justify-stretch">
            
            {activeRightTab === "monitor" && (
              <CrtDisplay
                template={activeTemplate}
                cpu={cpu}
                isCompiling={isCompiling}
                hasCompiled={hasCompiled}
                consoleLogs={consoleLogs}
                setConsoleLogs={setConsoleLogs}
              />
            )}

            {activeRightTab === "registers" && (
              <RegisterViewer
                cpu={cpu}
                assemblyCode={hasCompiled ? activeTemplate.defaultAssembly : ""}
                isCompiling={isCompiling}
                hasCompiled={hasCompiled}
              />
            )}

            {activeRightTab === "ai" && (
              <AiAssistant
                code={code}
                cpu={cpu}
                targetOs={targetOs}
                optLevel={optLevel}
                onReceiveAnalysis={(text) => setAnalysisText(text)}
                analysisText={analysisText}
              />
            )}

            {activeRightTab === "toolchain" && (
              <ToolchainBuilder />
            )}

          </div>

        </div>

      </main>

      {/* Retro bottom tech ribbon */}
      <footer className="h-12 bg-[#ff5f00] text-black flex items-center px-8 font-black text-[10px] uppercase tracking-[0.2em] justify-between select-none">
        <span className="hidden md:inline">Motorola 680x0 Evolution System</span>
        <span>Registered under A6 convention linkage</span>
        <span>© 2026 GopherAmiga Project</span>
      </footer>

    </div>
  );
}
