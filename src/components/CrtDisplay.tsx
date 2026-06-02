import React, { useState, useEffect, useRef } from "react";
import { Monitor, Terminal, Activity, Sparkles, X } from "lucide-react";
import { GoTemplate, CpuType } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CrtDisplayProps {
  template: GoTemplate;
  cpu: CpuType;
  isCompiling: boolean;
  hasCompiled: boolean;
  consoleLogs: string[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function CrtDisplay({
  template,
  cpu,
  isCompiling,
  hasCompiled,
  consoleLogs,
  setConsoleLogs,
}: CrtDisplayProps) {
  const [activeTab, setActiveTab] = useState<"shell" | "screen" | "debugger">("shell");
  const [windowClosed, setWindowClosed] = useState(false);
  const [copperPhase, setCopperPhase] = useState(0);
  const [activeWorker, setActiveWorker] = useState<number | null>(null);
  const [schedulerTicks, setSchedulerTicks] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Copper effect animation
  useEffect(() => {
    let animId: number;
    if (template.id === "copper_hack" && hasCompiled && activeTab === "screen") {
      const update = () => {
        setCopperPhase((prev) => (prev + 0.05) % (Math.PI * 2));
        animId = requestAnimationFrame(update);
      };
      animId = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animId);
  }, [template.id, hasCompiled, activeTab]);

  // Scheduler visualization simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (template.id === "exec_tasks" && hasCompiled && activeTab === "screen") {
      const runScheduler = () => {
        setSchedulerTicks((t) => t + 1);
        setActiveWorker((prev) => (prev === null ? 1 : prev === 1 ? 2 : null));
        
        // Add dynamic simulation logs
        if (Math.random() > 0.4) {
          const w = Math.random() > 0.5 ? 1 : 2;
          const messages = [
            `[Exec Scheduler] Context switched on Task 'Worker_${w}' (680${cpu})`,
            `[Exec Signal] Worker_${w} signaled master task on signal bit 15`,
            `[Go Runtime] Channel read completed successfully on task address 0x00B2DF4C`
          ];
          const logMsg = messages[Math.floor(Math.random() * messages.length)];
          setConsoleLogs((prev) => [...prev.slice(-30), logMsg]);
        }

        timer = setTimeout(runScheduler, 1200);
      };
      timer = setTimeout(runScheduler, 1200);
    }
    return () => clearTimeout(timer);
  }, [template.id, hasCompiled, activeTab, cpu]);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  // Reset window close state when template changes
  useEffect(() => {
    setWindowClosed(false);
  }, [template.id]);

  const handleCloseVirtualWindow = () => {
    setWindowClosed(true);
    setConsoleLogs((prev) => [
      ...prev,
      "[IDCMP] CLOSEWINDOW event received in main process loop.",
      "Go handler cleaning up allocations...",
      "[amiga/exec] CloseLibrary(intuition.library) successfully executed.",
      "Program exited gracefully with code: 0"
    ]);
  };

  const handleResetVirtualWindow = () => {
    setWindowClosed(false);
    setConsoleLogs((prev) => [
      ...prev,
      "[GUI] Re-opening Workbench window tag lists...",
      "[GUI] OpenWindow structures instantiated successfully on address 0x00A3DF10."
    ]);
  };

  return (
    <div className="w-full flex flex-col bg-[#111113] border border-[#2d2d32] rounded-sm overflow-hidden h-[540px]">
      {/* CRT Top Bar / Controls */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-[#0c0c0e] border-b border-[#2d2d32] select-none">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-[#ff5f00]" />
          <span className="text-xs font-mono tracking-[0.2em] text-[#e2e2e4] uppercase font-bold">
            02 / m68k Virtual Monitor
          </span>
        </div>
        
        {/* Sub tabs */}
        <div className="flex gap-1.5 p-0.5 bg-black rounded-sm border border-[#2d2d32]">
          <button
            id="tab_shell"
            onClick={() => setActiveTab("shell")}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all ${
              activeTab === "shell"
                ? "bg-[#ff5f00] text-black font-black shadow-md"
                : "text-slate-500 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" /> Shell
            </span>
          </button>
          
          <button
            id="tab_screen"
            disabled={!hasCompiled || isCompiling}
            onClick={() => setActiveTab("screen")}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all ${
              !hasCompiled || isCompiling
                ? "opacity-35 cursor-not-allowed text-stone-600"
                : activeTab === "screen"
                ? "bg-[#ff5f00] text-black font-black shadow-md"
                : "text-slate-500 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Screen
            </span>
          </button>
        </div>
      </div>

      {/* Retro Inner Screen wrapper (CRT scanlines, curvature, flickering glow) */}
      <div className="relative flex-1 bg-black overflow-hidden p-6 font-mono selection:bg-[#ff5f00]/30 selection:text-white border-t border-[#2d2d32]">
        
        {/* Simulated phosphor beam flicker & screen glass layer */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-white/1 via-transparent to-black/15 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />
        
        {/* Scanning raster lines overlay */}
        <div className="absolute inset-0 pointer-events-none z-15 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px]" />

        {/* Tab contents */}
        <div className="h-full overflow-y-auto custom-scrollbar relative z-5">
          <AnimatePresence mode="wait">
            
            {/* SHELL / CONSOLE COMPILING PORT OUTPUT */}
            {activeTab === "shell" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="shell"
                className="text-xs leading-relaxed text-[#00ff00] space-y-1.5"
              >
                {consoleLogs.map((log, i) => {
                  let colorClass = "text-[#00ff00]"; // Stark green standard
                  if (log.startsWith("[WARN]")) colorClass = "text-[#ffff00]"; // Yellow
                  if (log.startsWith("WARNING:")) colorClass = "text-red-500 font-bold"; 
                  if (log.startsWith("1>")) colorClass = "text-[#ff5f00] font-bold";
                  if (log.startsWith("[INFO]")) colorClass = "text-slate-500";
                  if (log.startsWith("[GUI]")) colorClass = "text-cyan-400";
                  if (log.startsWith("[SCHED]")) colorClass = "text-pink-400";
                  
                  return (
                    <div key={i} className={`${colorClass} font-mono break-all`}>
                      {log}
                    </div>
                  );
                })}
                {isCompiling && (
                  <div className="flex items-center gap-2 mt-3 text-white bg-zinc-900 border border-[#2d2d32] p-3 rounded-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5f00] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff5f00]"></span>
                    </span>
                    <span className="text-[#ff5f00] font-mono text-[11px] uppercase font-bold animate-pulse">
                      Invoking m68k-elf cross compiler, generating chunk segments...
                    </span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </motion.div>
            )}

            {/* DIRECT EMULATOR VISUALIZATION */}
            {activeTab === "screen" && hasCompiled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                key="screen"
                className="w-full h-full flex items-center justify-center relative"
              >
                {/* 1. CLASSIC WORKBENCH WINDOW TEMPLATE */}
                {template.graphicType === "window" && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-[#334e68] border-2 border-[#2d2d32] rounded-sm shadow-inner relative overflow-hidden">
                    {/* Workbench Screen Header Bar */}
                    <div className="absolute top-0 left-0 right-0 h-6 bg-white text-black text-[10px] flex items-center justify-between px-3 font-black border-b border-black">
                      <span className="tracking-widest uppercase">GOPHERAMIGA WORKBENCH v3.9</span>
                      <span className="font-mono">RAM: 2MB CHIP / 8MB FAST</span>
                    </div>

                    {/* The virtual Go code window */}
                    {!windowClosed ? (
                      <motion.div
                        layoutId="amiga-wind"
                        className="w-[325px] bg-[#d9d9de] border-2 border-black rounded-sm shadow-2xl overflow-hidden flex flex-col z-10"
                      >
                        {/* Title bar of Amiga Window */}
                        <div className="h-6 bg-white text-black text-[10px] font-bold border-b-2 border-black flex items-center justify-between px-1.5">
                          {/* Close box gadget */}
                          <button
                            id="amiga_close_window"
                            onClick={handleCloseVirtualWindow}
                            className="w-4 h-4 border border-black bg-stone-300 flex items-center justify-center hover:bg-black hover:text-white transition cursor-pointer"
                          >
                            <X className="w-3 h-3 text-black hover:text-white" />
                          </button>
                          
                          {/* Draggable Title */}
                          <span className="text-[10px] truncate select-none px-2 grow text-center uppercase tracking-widest text-[#000] font-black">
                            Intuition App Hunk
                          </span>
                          
                          {/* Sizing gadgets decoration */}
                          <div className="flex gap-0.5">
                            <div className="w-4 h-4 border border-black bg-stone-300 flex items-center justify-center text-[8px] font-black pointer-events-none select-none">
                              □
                            </div>
                            <div className="w-4 h-4 border border-black bg-stone-300 flex items-center justify-center text-[8px] font-black pointer-events-none select-none">
                              ◿
                            </div>
                          </div>
                        </div>
                        
                        {/* Windows Client Body */}
                        <div className="p-4 bg-[#c0c0c5] text-black flex flex-col items-center justify-center min-h-[90px] gap-2 text-center text-xs">
                          <p className="font-bold text-black uppercase tracking-wide font-mono">
                            Go execution active inside Amiga system heap
                          </p>
                          <div className="bg-black text-[#00ff00] px-3 py-1.5 rounded-sm font-mono text-[9px] w-full text-left flex flex-col gap-0.5 border border-purple-950">
                            <span>SysBase Vector: 0x00000004</span>
                            <span className="text-[#ff5f00]">Stack Frame Limit: 12.8 KB</span>
                            <span className="text-cyan-400">Processor core flag: M680{cpu}</span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center p-6 bg-black border border-[#2d2d32] rounded-sm flex flex-col items-center gap-3">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Intuition Window was Terminated</p>
                        <button
                          id="reset_window"
                          onClick={handleResetVirtualWindow}
                          className="px-4 py-1.5 bg-[#ff5f00] text-black font-black uppercase text-[10px] rounded-sm transition cursor-pointer"
                        >
                          Reopen intuition
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. COPPER RAINBOW STRIPES VISUALIZATION */}
                {template.graphicType === "copper_bobs" && (
                  <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-black rounded-sm border border-[#2d2d32] shadow-inner">
                    <div className="absolute top-2 left-2 text-[9px] text-[#ff5f00] z-20 flex items-center gap-1.5 bg-black border border-[#ff5f00] px-2 py-0.5 rounded-sm font-bold uppercase">
                      <Sparkles className="w-3 h-3 text-yellow-500 animate-spin" /> Copper DMA Beam
                    </div>
                    
                    {/* OS Terminal message underlay */}
                    <div className="absolute inset-x-4 top-10 font-mono text-[10px] text-zinc-500 z-10 leading-snug select-none uppercase tracking-wide">
                      <p className="text-[#ff5f00] font-bold">[COPPER] Direct register scan locked on 680{cpu}</p>
                      <p>Hardware register color base mapped at $DFF180</p>
                      <p>Raster beam coordinate monitor active</p>
                    </div>

                    {/* Oscilating Color Stripes on Screen background */}
                    <div className="w-full grow flex flex-col items-stretch justify-center relative">
                      {[...Array(24)].map((_, i) => {
                        const factor = Math.sin(copperPhase + i * 0.18);
                        const h = Math.round((copperPhase * 18 + i * 15) % 360);
                        const s = 100;
                        const l = Math.round(25 + Math.abs(factor) * 50);
                        
                        return (
                          <div
                            key={i}
                            className="h-2.5 transition-colors border-y border-black/10"
                            style={{
                              backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
                              boxShadow: `0 0 10px rgba(${h % 255}, 100, 100, 0.4)`,
                              opacity: 0.2 + Math.abs(factor) * 0.8,
                            }}
                          />
                        );
                      })}
                      
                      {/* Interactive Bouncing Bob representation */}
                      <motion.div
                        className="absolute h-10 w-10 bg-[#e2e2e4] rounded-sm flex items-center justify-center border-2 border-white select-none shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                        style={{
                          background: "linear-gradient(135deg, #ff5f00 0%, #333 100%)",
                        }}
                        animate={{
                          x: ["-120px", "120px", "-120px"],
                          y: ["-40px", "40px", "-40px"],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <span className="text-[10px] text-white font-black drop-shadow tracking-widest">GO!</span>
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* 3. CONCURRENCY WORKER SCHEDULER VISUAL */}
                {template.graphicType === "groutine_visual" && (
                  <div className="w-full h-full bg-[#0a0a0f] border border-[#2d2d32] rounded-sm p-4 flex flex-col relative overflow-hidden justify-between">
                    <div className="text-[10px] font-bold text-[#ff5f00] border-b border-[#2d2d32] pb-1.5 flex justify-between items-center bg-black/40 p-2 rounded-sm select-none">
                      <span className="uppercase tracking-wider">Go Goroutines ➜ Exec Tasks Scheduler</span>
                      <span className="text-slate-400">Ticks: {schedulerTicks}</span>
                    </div>

                    <div className="grow w-full grid grid-cols-3 gap-3 items-center justify-center my-4 relative">
                      
                      {/* Left: Go Task 1 Scheduler Block */}
                      <motion.div
                        className={`p-2.5 rounded-sm border flex flex-col items-center gap-1 transition-all ${
                          activeWorker === 1
                            ? "bg-stone-900 border-[#ff5f00] text-white shadow-[0_0_15px_rgba(255,95,0,0.2)]"
                            : "bg-black border-[#2d2d32] text-zinc-600 opacity-60"
                        }`}
                        animate={activeWorker === 1 ? { scale: 1.05 } : { scale: 1 }}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">Worker 1</span>
                        <div className="text-[8px] bg-black/40 px-1.5 py-0.5 rounded font-mono font-medium">ADDR: 0x00B2DF4C</div>
                        <div className={`h-2.5 w-2.5 rounded-full mt-1 ${activeWorker === 1 ? "bg-[#ff5f00] animate-ping" : "bg-neutral-800"}`} />
                        <span className="text-[9px] font-bold text-center mt-1 uppercase tracking-wide">{activeWorker === 1 ? "RUNNING" : "WAIT"}</span>
                      </motion.div>

                      {/* Middle: Mother Thread / Channel Pipeline */}
                      <div className="flex flex-col items-center justify-center gap-2 select-none">
                        <div className="h-10 w-10 bg-black border-2 border-[#ff5f00] flex items-center justify-center text-[10px] font-bold text-white shadow-[inset_0_0_8px_rgba(255,95,0,0.3)] shrink-0">
                          chan
                        </div>
                        <span className="text-[9px] text-[#ff5f00] font-bold uppercase text-center tracking-wider">Sync Pipeline</span>
                        
                        {/* Interactive floating messages depending on worker ticks */}
                        {activeWorker && (
                          <motion.div
                            key={activeWorker}
                            initial={{ y: activeWorker === 1 ? -40 : 40, x: activeWorker === 1 ? -60 : 60, opacity: 0 }}
                            animate={{ y: 0, x: 0, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            className="bg-[#ff5f00] text-black border border-white text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-widest absolute top-[45%] font-medium"
                          >
                            Bit {activeWorker === 1 ? 15 : 16}
                          </motion.div>
                        )}
                      </div>

                      {/* Right: Go Task 2 Scheduler Block */}
                      <motion.div
                        className={`p-2.5 rounded-sm border flex flex-col items-center gap-1 transition-all ${
                          activeWorker === 2
                            ? "bg-stone-900 border-[#ff5f00] text-white shadow-[0_0_15px_rgba(255,95,0,0.2)]"
                            : "bg-black border-[#2d2d32] text-zinc-600 opacity-60"
                        }`}
                        animate={activeWorker === 2 ? { scale: 1.05 } : { scale: 1 }}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">Worker 2</span>
                        <div className="text-[8px] bg-black/40 px-1.5 py-0.5 rounded font-mono font-medium">ADDR: 0x00B2DF8E</div>
                        <div className={`h-2.5 w-2.5 rounded-full mt-1 ${activeWorker === 2 ? "bg-[#ff5f00] animate-ping" : "bg-neutral-800"}`} />
                        <span className="text-[9px] font-bold text-center mt-1 uppercase tracking-wide">{activeWorker === 2 ? "RUNNING" : "WAIT"}</span>
                      </motion.div>

                    </div>

                    {/* Sched base log lines */}
                    <div className="text-[9px] bg-black border border-[#2d2d32] p-2 rounded-sm text-zinc-400 font-mono flex flex-col gap-0.5 leading-snug max-h-[85px] overflow-hidden select-none">
                      <p className="text-[#00ff00] font-semibold">[HOST] Sched on physical target: M680{cpu}</p>
                      <p>M:N scheduler cooperative stack frame division ok.</p>
                    </div>
                  </div>
                )}

                {/* 4. CLASSIC CLI LOG FILE OUTPUT (Standard Hello result) */}
                {template.graphicType === "cli" && (
                  <div className="w-full h-full flex flex-col bg-[#050508] border border-[#2d2d32] p-5 rounded-sm text-xs select-text overflow-y-auto font-mono">
                    <p className="text-slate-500 mb-2">// Executing raw output code on Amiga m68000 CLI shell:</p>
                    <div className="space-y-1.5 text-zinc-300">
                      <p className="text-[#ff5f00] font-black">1&gt; goc68k -cpu=68000 -target=amigaos main.go</p>
                      <p className="text-zinc-500">Linking symbols with target execution library offsets...</p>
                      <p className="text-[#00ff00]">File compilation successful. Executable loaded into HUNK memory.</p>
                      <br />
                      <p className="text-[#ff5f00] font-black">1&gt; main.run</p>
                      <p className="text-[#00ff00] text-base py-3 px-4 border-2 border-[#ff5f00] bg-black font-mono tracking-widest font-bold">
                        "Hello, Amiga OS 3.x!"
                      </p>
                      <p className="text-zinc-500">Process return registry: D0 = 0 (Success)</p>
                    </div>
                  </div>
                )}

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
