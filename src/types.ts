export type CpuType = "68000" | "68020" | "68040";

export type AmigaOsVersion = "AmigaOS 3.0" | "AmigaOS 3.1" | "AmigaOS 3.2" | "AmigaOS 3.9";

export interface GoTemplate {
  id: string;
  name: string;
  description: string;
  category: "Standard" | "Graphics" | "Concurrency" | "GUI";
  code: string;
  defaultAssembly: string;
  consoleLines: string[];
  graphicType?: "window" | "copper_bobs" | "cli" | "groutine_visual";
}

export interface RegisterState {
  // Data Registers
  d0: string;
  d1: string;
  d2: string;
  d3: string;
  d4: string;
  d5: string;
  d6: string;
  d7: string;
  // Address Registers
  a0: string;
  a1: string;
  a2: string;
  a3: string;
  a4: string;
  a5: string;
  a6: string; // Amiga Library base standard register
  a7: string; // Stack Pointer
  // Program registers
  pc: string;
  sr: string;
  cycles: number;
  fastRam: string;
  chipRam: string;
}

export interface ToolchainStep {
  title: string;
  status: "pending" | "running" | "success" | "info";
  description: string;
  logs: string[];
}
