import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in the environment. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// API endpoint to analyze Go-to-m68k code
app.post("/api/gemini/analyze", async (req, res) => {
  const { code, cpu, targetOs, optLevel } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided for analysis." });
  }

  try {
    const ai = getAiClient();
    
    const prompt = `You are an expert systems engineer and compiler architect specializing in Porting the Go Programming Language to AmigaOS 3.x for Motorola 68k processors.

We are developing a new compiler backend / cross-compiler toolchain for Go to target Motorola 68k (specifically 68000, 68020, and 68040) running on AmigaOS 3.x.

Analyze the following Go program:
\`\`\`go
${code}
\`\`\`

The user has selected:
- Processor Architecture: Motorola 680${cpu || "00"}
- Target Operating System: AmigaOS ${targetOs || "3.x"}
- Optimization Level: ${optLevel || "O1"}

Tasks for you:
1. **Low-level lowdown**: Explain how this specific Go code (and its libraries, goroutines, types, or runtime demands) would map onto the resource-constrained 68k AmigaOS architecture. Specifically, map Go concepts (e.g. stack allocation, GC, closures, or OS libraries) to Amiga OS executables (Hunk format, Exec library, Intuition, library bases on A6, stack limits).
2. **Motorola 68k Code Gen (Crucial!)**: Provide an optimized fragment of actual Motorola 68k assembly (either 68000, 68020, or 68040 as chosen by user) representing a compiler's translation of a key section of this code. 
   - Label register usages clearly (e.g. custom ABI: A6 for Library Base, A7 for stack pointer, A0-A2 / D0-D2 for temporaries, and register-relative memory access).
   - Use standard vasm syntax and label what specific hardware features are used (e.g. 32-bit arithmetic / addressing on 68020/040, or 16-bit splits on 68000; FPU instructions if 68040; cache alignments).
3. **Execution & Hardware Impact**: Explain the cycle/pipeline efficiency and hardware details for the 680${cpu || "00"} (cache details, system traps, memory footprint concern of Go's thick runtime). Include tips on how to handle Go's runtime footprint (which is usually megabytes) in classic Amiga chips (Chip RAM vs Fast RAM).

Return your response in standard Markdown format. Focus deeply on authentic technical realism, AmigaOS 3.x structures (e.g. Intuition Window, Exec Task, library base offsets), and register-level 68k assembly. Let's show off extreme technical depth!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Fallback response for offline or unconfigured API keys
    const fallbackMessage = getOfflineFallback(code, cpu || "00", optLevel || "O1");
    res.json({
      analysis: `### ⚠️ Offline Mode / Config Warning\n\n${error.message || "An error occurred."}\n\n*Serving a simulated expert cross-compilation analysis instead:*\n\n---\n\n${fallbackMessage}`
    });
  }
});

function getOfflineFallback(code: string, cpu: string, optLevel: string): string {
  const isGui = code.includes("intuition") || code.includes("OpenWindow") || code.includes("Window");
  const isGoroutines = code.includes("go ") || code.includes("chan");
  
  let assembly = "";
  let mechanics = "";
  
  if (isGui) {
    assembly = `; --- Generated M680${cpu} Assembly via Go-Amiga Compiler ---
; Target CPU: 680${cpu} (AmigaOS 3.x System)
; Go mapping: amiga/intuition.OpenWindow()
; Register Allocation:
;   A6 = IntuitionBase offset
;   A0 = Pointer to NewWindow structure
;   D0 = Return Window Pointer callback

_Go_amiga_intuition_OpenWindow:
    move.l  4(sp), a0          ; Get pointer to NewWindow (passed on virtual parameters)
    move.l  _IntuitionBase, a6  ; Load Intuition Library Base pointer (standard exec.library convention)
    jsr     -204(a6)           ; JSR _LVOOpenWindow (offset -204 for OpenWindow)
    move.l  d0, _return_val    ; Store returned structural reference to D0
    rts

_NewWindow_Struct:
    dc.w    20, 20             ; LeftEdge, TopEdge
    dc.w    300, 160           ; Width, Height
    dc.b    0, 1               ; DetailPen, BlockPen
    dc.l    _WindowTitle       ; Title Bar string
    dc.l    $000F              ; Flags (WINDOWCLOSE | WINDOWDRAG | WINDOWDEPTH | WINDOWSIZING)
    dc.l    $00030000          ; IDCMP Flags (CLOSEWINDOW | MOUSEBUTTONS)
    dc.l    1                  ; Type (WFLG_SIZEGADGET)
    dc.l    0, 0, 0            ; FirstGadget, CheckMark, Title
    dc.l    0, 0               ; Screen, BitMap
    dc.w    80, 50, 640, 480   ; Min/Max dimensions`;

    mechanics = `1. **Go Context on AmigaOS Intuition**:
   - The Intuition Window is a native Amiga Window structure. Go's runtime represents this as an opaque struct wrapper.
   - **Exec Library Base Access**: To draw windows, we access \`intuition.library\` using its offset in memory (\`_IntuitionBase\`). The \`OpenWindow\` system call uses standard LVO (Library Vector Offset) -204 in AmigaOS.
   - **Stack Frame**: The compiler maps Go's stack-allocated structures to actual byte layouts in memory matching the native Amiga C-struct configurations.
   
2. **Motorola 680${cpu} Architectural Aspects**:
   - Uses \`jsr -204(a6)\` to jump to the dynamically-linked Amiga ROM vector table using A6 library base.
   - On **68000**, instruction pipelines are 3-stage; avoiding excessive register-memory exchanges is key.
   - On **68020/040**, instruction framing can utilize dynamic stack scaling. Cache-aligning compiled code yields a **15% execution boost** on 68040 L1 instruction caches (8KB).`;
  } else if (isGoroutines) {
    assembly = `; --- Generated M680${cpu} Assembly via Go-Amiga Compiler ---
; Target CPU: 680${cpu} (AmigaOS 3.x System)
; Go mapping: goroutine spawned via exec.CreateTask
; Register Allocation:
;   A6 = ExecBase
;   A1 = Task structure pointer
;   A2 = Goroutine entry function pointer
;   A3 = Channel buffer (data sharing)

_Go_runtime_spawn_goroutine:
    move.l  4(sp), a2          ; Load goroutine code block address
    move.l  _SysBase, a6       ; Load ExecBase pointer (address $4 in Amiga ROM)
    
    ; Allocate memory for Exec Task structure and stack frame
    move.l  #500, d0           ; Ask for 500 bytes (extremely sleek to save Amiga FastRAM!)
    move.l  #$10001, d1        ; MEMF_PUBLIC | MEMF_CLEAR requirements
    jsr     -198(a6)           ; JSR _LVOAllocMem (LVO -198)
    tst.l   d0
    beq     _out_of_mem_panic
    
    move.l  d0, a1             ; A1 = allocated task memory
    ; Populate Exec Task fields
    move.b  #1, 14(a1)         ; LN_TYPE = NT_TASK (1)
    move.b  #0, 9(a1)          ; LN_PRI  = Default (0) Go scheduling weight
    move.l  #_Goroutine_Name, 10(a1) ; LN_NAME
    move.l  a2, 14(a1)         ; Program counter entry point set to Go closure
    
    ; Call Exec AddTask
    move.l  a1, a1             ; Task handle
    sub.l   a2, a2             ; APTR InitialPC
    move.l  #_Go_Goroutine_Wrapper, a2 ; Setup our specialized go runtime handler
    sub.l   a3, a3             ; Safe stack segment marker pointers
    jsr     -282(a6)           ; JSR _LVOAddTask (LVO -282)
    rts

_out_of_mem_panic:
    illegal                    ; Amiga equivalent of panic!`;

    mechanics = `1. **Go Scheduler and Amiga Exec Tasks**:
   - Go's scheduler uses an M:N design. For compatibility, we map goroutines directly to **Exec Tasks** (\`struct Task\`).
   - Standard AllocMem (\`_LVOAllocMem\` at offset -198) provides thread-safe runtime scheduling buffers.
   - Channels are simulated using cooperative Exec Signalling (\`Wait\` / \`Signal\` calls) so tasks wake up instantly when channel registers are flushed.
   
2. **Motorola 680${cpu} Performance on scheduling**:
   - Since goroutines match native Exec Tasks, context switching utilizes AmigaOS's preemptive scheduler directly, minimizing software scheduler code bloat!
   - On **68040** processors, cache lines are 16 bytes. Context-switch structures are padded to 16-byte bounds to avoid cache thrashing.`;
  } else {
    // Normal Hello World
    assembly = `; --- Generated M680${cpu} Assembly via Go-Amiga Compiler ---
; Target CPU: 680${cpu} (AmigaOS 3.x System)
; Go mapping: fmt.Println("Hello, Amiga 68k!")
; Register Allocation:
;   A6 = DOSBase Offset
;   D1 = Output handle (stdout desc)
;   D2 = String memory buffer pointer
;   D3 = Length of string (18 bytes)

_Go_fmt_Println_hello:
    move.l  _DOSBase, a6       ; Standard LVO call for dos.library
    jsr     -60(a6)            ; JSR _LVOOutput (offset -60) -> returns Output Handle in D0
    move.l  d0, d1             ; Move standard output handle into D1 (first param to Write)
    
    move.l  #_Hello_Amiga_Str, d2 ; Move string address into D2 (second parameter)
    move.l  #18, d3            ; Length of "Hello, Amiga 68k!" plus newline (third parameter)
    jsr     -48(a6)            ; JSR _LVOWrite (offset -48)
    rts

_Hello_Amiga_Str:
    dc.b    "Hello, Amiga 68k!",10,0`;

    mechanics = `1. **Low-level lowdown**:
   - The entry point maps strings into disk structures. In Go, strings are a header representation with structural length checks. For AmigaOS DOS calls, the compiler adds a null-terminator or relies on an explicit byte count passed directly to \`_LVOWrite\` (LVO -48).
   - **Exec Library base access**: \`dos.library\` is loaded in \`_DOSBase\` under classic Exec standards. This maps beautifully into modern cross-compilation environments.

2. **Motorola 680${cpu} optimization (${optLevel})**:
   - On classic **68000** setups, word access is faster than byte stream access. Aligning string structures to 2-byte boundary paths prevents address exception traps.
   - On **68020/040**, 32-bit registers can hold indices natively. We utilize full 32-bit \`move.l\` operations to maximize data transfer over the 32-bit bus.`;
  }
  
  return `### Compiled Successfully (Simulated ${optLevel})
Target Processor: M680${cpu}
Target System: AmigaOS 3.x
Output Format: Amiga Hunk Executable File

#### Selected Go Code Generation Overview

1. **Memory Execution Bounds**:
   Go's runtime stack is typically large (8KB minimum in historical, 2KB in modern). For AmigaOS 3.x, we must cap stack allocation and perform custom compiler-inserted checks to avoid overflowing classic Chip/Fast RAM boundaries.
   
2. **Library Call Vector Mechanics**:
   Unlike modern Unix/Windows which use standard dynamically linked libraries (.so or .dll) or static linking, AmigaOS shares RAM-resident ROM vectors. The compiler generates library pointers and reads offsets directly via register-relative instruction matrices (\`LVOs\`).

---

#### 🛠️ Generated m68k Assembler Output

\`\`\`assembly
${assembly}
\`\`\`

---

#### 🧠 Low-Level CPU Core & OS Mechanics
${mechanics}`;
}

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Amiga 68k Go Server running on http://localhost:${PORT}`);
  });
}

startServer();
