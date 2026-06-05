# AmigaGo: Go Cross-Compiler & M68k Assembly Playground

**AmigaGo** is an interactive, modern web-based developer environment, cross-compilation playground, and Motorola 68k CPU simulator designed for writing the **Go Programming Language** on legacy **AmigaOS 3.x** architectures. 

Featuring a highly polished **Bold Typography / Cyberpunk Industrial** theme, the playground allows developers to draft Go code targeting classic custom chips and execute simulated compilation, track machine registers step-by-step, review real-time AI-driven optimizations, and export production-ready cross-compilation configurations.

---

## 🚀 Core Features

### 1. Multi-Target AmigaOS SDK Support
Select your exact legacy target SDK:
*   **AmigaOS 3.0** (Kickstart 39) — OCS/ECS compatibility
*   **AmigaOS 3.1** (Kickstart 40) — Classic AGA baseline
*   **AmigaOS 3.2** (Kickstart 47) — Advanced modern recreation SDK *(Newly Added)*
*   **AmigaOS 3.9** (Kickstart 45) — Late-stage software enhancements

### 2. Motorola CPU Profile Matrix
Configure microarchitecture profiles with accurate PAL clock simulation:
*   **Intellectual Motorola 68000** (7.16 MHz) — Target classic A500/A2000 models
*   **Stable Motorola 68020** (14.18 MHz) — Enhanced 32-bit arithmetic, targeting A1200/CD32
*   **Powerhouse Motorola 68040** (40.00 MHz) — Full pipelined execution & Integrated FPU

### 3. Integrated Go Script Library
Quickly load and customize pre-configured template scripts categorized by use-case:
*   **Standard**: System initialization, pointer mapping, and basic calculations.
*   **Graphics**: Low-level Copper list modifications and direct hardware screen manipulation.
*   **Concurrency**: Cooperative goroutines mapping, channel synchronization, and signal handlers.
*   **GUI**: Classic Amiga Intuition Window generation and dynamic memory allocates.

### 4. 1084S CRT Monitor Simulator
Click **Compile Go Payload** to trigger simulated Go SSA-to-M68K transpilation. See detailed linker logs on our simulated CRT display and visualize real-time graphics outputs, bouncing bob animations, window close hooks, or concurrency channel pipes.

### 5. Step-by-Step M68k Debugger
Step-execute through translated Motorola assembly Hunk files:
*   Inspect changes to **Data Registers** (`D0`-`D7`)
*   Inspect **Address Registers** (`A0`-`A7`, with stack pointer monitoring)
*   Trace **Program Counter (PC)** offsets, status code flags, and instruction cycles.

### 6. Gemini-powered m68k Compiler Advisor
Click **Run Compiler Advisor** to invoke real-time, context-aware AI analyses. The backend models the target microarchitecture's quirks (cache sizes, pipeline splitting, stack layout constraints, trap vectors) and suggestions on optimizing your Go code's output.

### 7. Exportable Toolchains
Need a real cross-compiling environment? Hop onto the **Toolchain Setup** tab to view, copy, and configure real:
*   **Dockerfiles** targeting GCC 13.2 cross-compiler toolchains
*   **Makefiles** configuring custom target profiles
*   **Go SDK Header Bindings** linking standard Go structures directly to AmigaOS library bases (e.g. `_DOSBase`, `_IntuitionBase`) via A6 register traps.

---

## 🛠️ Usage Instructions

Follow these steps to explore and test Go architectures on AmigaOS:

1.  **Select a Script Template**: Browse the **Amiga OS 3.x Go Script Library** in the top left, filter by Category, and look over the pre-built templates. Select one to automatically populate the editor buffer with compliant Go.
2.  **Edit Go Code**: Write or modify variables, function loops, or pointers in the editor text interface.
3.  **Configure Target Specs**: Turn to the **Compiler Options** panel to customize:
    *   **Processor Core** (68000, 68020, 68040)
    *   **Target OS** (AmigaOS 3.0 up to AmigaOS 3.2 Kickstart 47)
    *   **Optimization Levels** (no-optimization up to `-O3` direct hardware overrides)
4.  **Simulate Compilation**: Click the high-visibility **Compile Go Payload** button. Watch the compiler parse Go SSA blocks and successfully map executable segments.
5.  **Examine CRT Outputs**: Turn to the **1084S CRT Monitor** tab on the right:
    *   Click the **CLI Shell** to view detailed system startup structures, link addresses, and stack registers.
    *   Click the **CRT Screen** to view interactive graphical renders representing the Go runtime execution.
6.  **Step-Execute CPU Instructions**: Switch over to the **M68k Registers** tab on the right. Hit the **Step** button to watch the virtual CPU traverse machine instructions in real-time, mapping register mutations and program counters step-by-step.
7.  **Generate Gemini Optimization Advice**: Switch to the **Gemini Advisor** tab and click **Run Compiler Advisor**. Read the deep-dive technical overview detailing performance bottlenecks, register mapping, and optimal assembly strategies.
8.  **Clone the Build Toolchain**: Access **Toolchain Setup** to copy configuration files and prepare a real cross-compiling workplace on Linux, macOS, or Windows platforms.

---

## ⚙️ Technical Architecture Specs (A68K-SSA)

*   **Compiler Pipeline**: Go SSA AST Code ➔ SSA Inlines ➔ Register Allocations (D0-D2, A0-A2) ➔ Assembler Hunks (Vasm target) ➔ System Exec Binary.
*   **Memory Footprint Limit**: Strict 8.2KB to 12.8KB stack boundaries bypass virtual pages, mapping directly to physical fast RAM zones to ensure peak execution speed.
*   **LVO Trap Conventions**: System interactions are bound under the standard Amiga **A6 register layout linkage**, permitting direct communication with ROM kernels via fast machine trap steps without standard OS context overlays.

---

## 🚀 Deployment site
🌐 [Live site](hhttps://amigago.netlify.app/)
