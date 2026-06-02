import React, { useState } from "react";
import { Sparkles, BrainCircuit, Play, Loader2, Cpu, HelpCircle, CheckCircle2 } from "lucide-react";
import { CpuType, AmigaOsVersion } from "../types";

interface AiAssistantProps {
  code: string;
  cpu: CpuType;
  targetOs: AmigaOsVersion;
  optLevel: string;
  onReceiveAnalysis: (analysisText: string) => void;
  analysisText: string;
}

export default function AiAssistant({
  code,
  cpu,
  targetOs,
  optLevel,
  onReceiveAnalysis,
  analysisText,
}: AiAssistantProps) {
  const [loading, setLoading] = useState(false);

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          cpu,
          targetOs,
          optLevel,
        }),
      });
      const data = await response.json();
      onReceiveAnalysis(data.analysis || "No analysis returned.");
    } catch (error) {
      console.error(error);
      onReceiveAnalysis("### Error\nCould not reach the compiler analysis server.");
    } finally {
      setLoading(false);
    }
  };

  // Safe markdown parser
  const renderMarkdown = (md: string) => {
    if (!md) return <p className="text-stone-500 font-mono text-xs">CLICK THE RUN BUTTON ABOVE TO REQUEST A REAL-TIME ARCHITECTURAL ANALYSIS REPORT USING GEMINI.</p>;

    const lines = md.split("\n");
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeLanguage = "";

    return lines.map((line, idx) => {
      // Code block parsing
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const blockContent = codeBlockLines.join("\n");
          codeBlockLines = [];
          return (
            <pre key={idx} className="bg-stone-950 text-stone-300 font-mono text-[11px] p-3.5 rounded-sm border border-[#2d2d32] my-3.5 overflow-x-auto select-all relative group">
              <div className="absolute right-2.5 top-2.5 text-[9px] text-[#ff5f00] font-mono uppercase bg-black border border-stone-800 px-1.5 py-0.5 rounded-sm select-none">
                {codeLanguage || "m68k ASM"}
              </div>
              <code>{blockContent}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().substring(3);
          return null;
        }
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        return null;
      }

      // Headers 
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-[#ff5f00] font-black font-mono text-xs tracking-wider uppercase mt-5 mb-2.5 border-b border-stone-800 pb-1 select-none">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-white font-black font-mono text-xs tracking-[0.2em] uppercase mt-6 mb-3 select-none flex items-center gap-1.5 border-b border-[#2d2d32] pb-2">
            <BrainCircuit className="w-4 h-4 text-[#ff5f00]" /> {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-[#ff5f00] font-black font-mono text-base tracking-[0.22em] uppercase mt-7 mb-4 select-none border-b border-[#2d2d32] pb-2">
            {line.replace("# ", "")}
          </h2>
        );
      }

      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2);
        return (
          <li key={idx} className="text-slate-300 text-xs font-sans list-none flex items-start gap-2 my-1 pl-1">
            <span className="text-[#ff5f00] font-bold select-none mt-0.5">·</span>
            <span>{content.replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </li>
        );
      }

      // Numbered items
      if (/^\s*\d+\.\s+/.test(line)) {
        const matches = line.match(/^\s*(\d+)\.\s+(.*)/);
        if (matches) {
          return (
            <div key={idx} className="text-slate-300 text-xs font-sans flex gap-2 pl-1.5 my-1.5">
              <span className="text-[#ff5f00] font-black font-mono select-none text-[11px]">{matches[1]}.</span>
              <span>{matches[2].replace(/\*\*(.*?)\*\*/g, "$1")}</span>
            </div>
          );
        }
      }

      // Divider
      if (line.trim() === "---") {
        return <hr key={idx} className="border-stone-800 my-5" />;
      }

      // Default lines
      if (line.trim() === "") return <div key={idx} className="h-2" />;

      // Inline strong style
      const htmlText = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return (
        <p
          key={idx}
          className="text-stone-300 text-xs font-sans leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: htmlText }}
        />
      );
    });
  };

  return (
    <div className="bg-[#111113] border border-[#2d2d32] rounded-sm p-5 flex flex-col gap-4">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#2d2d32] pb-3 select-none">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[#ff5f00]" />
          <div>
            <h3 className="text-xs font-mono font-black text-white tracking-[0.2em] uppercase">
              04 / Gemini m68k Compiler Advisor
            </h3>
            <p className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">
              Real-time hardware instruction optimization analysis.
            </p>
          </div>
        </div>

        <button
          id="btn_run_ai"
          disabled={loading}
          onClick={handleRunAnalysis}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer select-none ${
            loading
              ? "bg-[#1a1a1f] text-stone-600 border border-stone-800 cursor-not-allowed"
              : "bg-[#ff5f00] text-black border border-[#ff5f00] hover:bg-white hover:text-black hover:border-white font-black"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#ff5f00]" /> Computing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-black animate-pulse" /> Run Compiler Advisor
            </>
          )}
        </button>
      </div>

      {/* Compiler Parameters Inspector */}
      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono select-none bg-black p-3.5 rounded-sm border border-[#2d2d32]">
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-650 text-[8px] font-bold uppercase tracking-wider">Core CPU Type</span>
          <span className="text-[#ff5f00] uppercase font-bold">Motorola 680{cpu}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-650 text-[8px] font-bold uppercase tracking-wider">Target System</span>
          <span className="text-white uppercase font-bold">{targetOs}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-650 text-[8px] font-bold uppercase tracking-wider">Optimization Level</span>
          <span className="text-white font-bold">{optLevel}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-650 text-[8px] font-bold uppercase tracking-wider">ABI Standard</span>
          <span className="text-[#00ffbb] font-bold font-mono">Amiga GCC 68k</span>
        </div>
      </div>

      {/* AI Output Container */}
      <div className="bg-black border border-[#2d2d32] p-5 rounded-sm min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="h-[250px] flex flex-col justify-center items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff5f00]" />
            <div className="text-center font-mono space-y-1 select-none">
              <p className="text-xs text-[#ff5f00] font-black animate-pulse uppercase tracking-[0.2em]">Invoking compiler analysis models...</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">Parsing Go microarchitecture structure & stack offsets</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {renderMarkdown(analysisText)}
          </div>
        )}
      </div>

      {/* Educational Note */}
      <div className="bg-[#1a1a1f] border border-[#2d2d32] rounded-sm p-4 text-[10px] font-mono text-stone-400 flex items-start gap-2 select-none">
        <HelpCircle className="w-4.5 h-4.5 text-stone-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          The Gemini Advisor models the target microarchitecture’s exact quirks (e.g. 16-bit splits on standard 68000 vs full 32-bit arithmetic on 68020/68040, stack frame unlink mechanics, instruction cache constraints). Feel free to toggle templates and compare assembly translations.
        </p>
      </div>
    </div>
  );
}
