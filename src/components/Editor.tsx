import React, { useState } from "react";
import { Play, Code2, Layers, Sliders, Check, Terminal, FileCode, CheckCircle2 } from "lucide-react";
import { templates } from "../data/templates";
import { GoTemplate, CpuType, AmigaOsVersion } from "../types";

interface EditorProps {
  onLoadTemplate: (tmpl: GoTemplate) => void;
  activeTemplate: GoTemplate;
  code: string;
  setCode: (code: string) => void;
  cpu: CpuType;
  setCpu: (cpu: CpuType) => void;
  targetOs: AmigaOsVersion;
  setTargetOs: (targetOs: AmigaOsVersion) => void;
  optLevel: string;
  setOptLevel: (level: string) => void;
  isCompiling: boolean;
  onRunCompilation: () => void;
  hasCompiled: boolean;
}

export default function Editor({
  onLoadTemplate,
  activeTemplate,
  code,
  setCode,
  cpu,
  setCpu,
  targetOs,
  setTargetOs,
  optLevel,
  setOptLevel,
  isCompiling,
  onRunCompilation,
  hasCompiled,
}: EditorProps) {
  const [activeCategory, setActiveCategory] = useState<"All" | "Standard" | "Graphics" | "Concurrency" | "GUI">("All");

  const filteredTemplates = templates.filter(
    (t) => activeCategory === "All" || t.category === activeCategory
  );

  return (
    <div className="flex flex-col gap-5">
      
      {/* Top Template Selector Header */}
      <div className="flex flex-col gap-3 pb-4 border-b border-[#2d2d32]">
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#ff5f00]" />
            <h3 className="text-xs font-mono font-bold text-[#e2e2e4] uppercase tracking-[0.25em]">
              01 / Go Script templates
            </h3>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#ff5f00] bg-[#ff5f00]/10 px-2 py-0.5 rounded-sm">
            Ready to link
          </span>
        </div>

        {/* Categories Tab */}
        <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none select-none">
          {(["All", "Standard", "Graphics", "Concurrency", "GUI"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 transition-colors uppercase font-bold border rounded-sm ${
                activeCategory === cat
                  ? "bg-[#ff5f00] text-black border-[#ff5f00]"
                  : "bg-transparent text-[#88888c] border-[#2d2d32] hover:text-white hover:border-slate-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates cards selection */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
          {filteredTemplates.map((tmpl) => {
            const isSelected = tmpl.id === activeTemplate.id;
            return (
              <button
                key={tmpl.id}
                id={`template_card_${tmpl.id}`}
                onClick={() => onLoadTemplate(tmpl)}
                className={`p-3 rounded-sm border text-left flex flex-col gap-1.5 transition-all ${
                  isSelected
                    ? "bg-[#ff5f00]/5 border-2 border-[#ff5f00] shadow-[0_0_12px_rgba(255,95,0,0.15)]"
                    : "bg-[#0c0c0e] border-[#2d2d32] hover:border-[#ff5f00]/50"
                }`}
              >
                <div className="flex justify-between items-start w-full gap-2">
                  <span className={`text-[11px] font-mono leading-snug font-bold uppercase tracking-tight ${isSelected ? "text-[#ff5f00]" : "text-[#e2e2e4]"}`}>
                    {tmpl.name}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase shrink-0 ${
                    isSelected ? "bg-[#ff5f00] text-black" : "bg-[#1d1d23] text-slate-400"
                  }`}>
                    {tmpl.category}
                  </span>
                </div>
                <p className="text-[9.5px] text-[#88888c] leading-relaxed line-clamp-2 font-sans">
                  {tmpl.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Compiler Options panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0c0c0e] p-4 border border-[#2d2d32] rounded-sm text-xs font-mono">
        {/* Cpu architecture */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-[#88888c] uppercase font-bold tracking-widest select-none">M68K Processor Core</label>
          <select
            value={cpu}
            onChange={(e) => setCpu(e.target.value as CpuType)}
            className="bg-black border border-[#2d2d32] hover:border-slate-500 rounded-sm px-3 py-2 text-[#e2e2e4] focus:outline-none focus:border-[#ff5f00] uppercase font-bold transition-all"
          >
            <option value="68000">Motorola 68000 (OCS)</option>
            <option value="68020">Motorola 68020 (AGA)</option>
            <option value="68040">Motorola 68040 (FPU)</option>
          </select>
        </div>

        {/* Amiga OS selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-[#88888c] uppercase font-bold tracking-widest select-none">AmigaOS Target SDK</label>
          <select
            value={targetOs}
            onChange={(e) => setTargetOs(e.target.value as AmigaOsVersion)}
            className="bg-black border border-[#2d2d32] hover:border-slate-500 rounded-sm px-3 py-2 text-[#e2e2e4] focus:outline-none focus:border-[#ff5f00] uppercase font-bold transition-all"
          >
            <option value="AmigaOS 3.0">AmigaOS 3.0 (Kick 39)</option>
            <option value="AmigaOS 3.1">AmigaOS 3.1 (Kick 40)</option>
            <option value="AmigaOS 3.2">AmigaOS 3.2 (Kick 47)</option>
            <option value="AmigaOS 3.9">AmigaOS 3.9 (Kick 45)</option>
          </select>
        </div>

        {/* Optimisation selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-[#88888c] uppercase font-bold tracking-widest select-none">Optimization Engine</label>
          <select
            value={optLevel}
            onChange={(e) => setOptLevel(e.target.value)}
            className="bg-black border border-[#2d2d32] hover:border-slate-500 rounded-sm px-3 py-2 text-[#e2e2e4] focus:outline-none focus:border-[#ff5f00] uppercase font-bold transition-all"
          >
            <option value="O0">-O0 (No Optimization)</option>
            <option value="O1">-O1 (Stable Frame Stack)</option>
            <option value="O2">-O2 (Speed Assembly)</option>
            <option value="O3">-O3 (Direct hardware hack)</option>
          </select>
        </div>
      </div>

      {/* Code Textarea Editor Area */}
      <div className="relative border border-[#2d2d32] bg-[#0c0c0e] rounded-sm overflow-hidden flex flex-col grow min-h-[340px]">
        {/* Editor panel bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111113] border-b border-[#2d2d32] select-none">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#ff5f00]" />
            <span className="text-[10px] font-mono font-bold text-[#e2e2e4] uppercase tracking-wider">
              main.go (Direct Buffer)
            </span>
          </div>

          <button
            id="btn_compile_run"
            disabled={isCompiling}
            onClick={onRunCompilation}
            className={`flex items-center gap-2 font-mono text-xs text-black font-black uppercase px-4 py-2 bg-[#ff5f00] hover:bg-[#e04f00] transition shadow-md border border-[#ff5f00] rounded-sm ${
              isCompiling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-black" /> Compile go payload
          </button>
        </div>

        {/* Text area */}
        <div className="flex-1 relative flex">
          {/* Virtual Line Numbers */}
          <div className="w-10 bg-[#09090b] text-right pr-3 py-4 font-mono text-[10px] text-zinc-600 select-none border-r border-[#2d2d32] flex flex-col gap-0.5 leading-relaxed">
            {[...Array(Math.max(code.split("\n").length, 14))].map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>

          {/* Actual textarea editor */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-black text-[#e2e2e4] font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed overflow-x-auto w-full custom-scrollbar selection:bg-[#ff5f00]/30"
            spellCheck="false"
          />
        </div>

        {/* Compiler checklist confirmation */}
        {hasCompiled && (
          <div className="absolute right-4 bottom-4 px-3.5 py-2 bg-[#00ff00] border border-[#00ff00] text-black font-mono font-black uppercase text-[10px] tracking-wide shadow-2xl flex items-center gap-1.5 select-none animate-bounce">
            <CheckCircle2 className="w-4 h-4" /> Go executable loaded!
          </div>
        )}
      </div>
    </div>
  );
}
