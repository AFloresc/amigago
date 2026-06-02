import { GoTemplate } from "../types";

export const templates: GoTemplate[] = [
  {
    id: "hello_world",
    name: "Classic Hello World (CLI)",
    description: "Simple console output using Go's fmt.Println. Highlights DOS-library calling mechanics on Amiga system bases.",
    category: "Standard",
    code: `package main

import "fmt"

func main() {
    // Under the hood, this translates into loading 'dos.library' 
    // and querying standard Output() stream handle wrapper,
    // then invoking Write() over standard out vector table.
    fmt.Println("Hello, Amiga OS 3.x!")
}`,
    defaultAssembly: `; --- Go-Amiga Compiler Output ---
; Target CPU: Motorola 68000
; Optimization: -O1 (Standard Stack Frames)
; Translation of main.main()

_main_main:
    link    a5,#0                ; Build standard stack frames on 68k
    movem.l d2-d3/a6,-(sp)       ; Preserve registers D2, D3 and A6 onstack
    
    ; Setup Call: Call DOSBase:Output()
    move.l  _DOSBase, a6         ; Load dos.library base register
    jsr     -60(a6)              ; JSR to LVO-60 -> _LVOOutput()
    tst.l   d0                   ; Did it return a valid output file handle?
    beq     .write_error         ; Zero indicates Failure -> fallback
    
    ; Setup Write Call: DOSBase:Write(handle, ptr, length)
    move.l  d0, d1               ; Argument 1: File Handle in D1
    move.l  #.go_str_const, d2   ; Argument 2: Memory Pointer to string buffer in D2
    move.l  #20, d3              ; Argument 3: String Length in D3 (20 bytes)
    jsr     -48(a6)              ; JSR to LVO-48 -> _LVOWrite()
    
.write_error:
    movem.l (sp)+,d2-d3/a6       ; Restore saved registers
    unlk    a5                   ; Discard stack frames
    rts                          ; Return to Go runtime startup

.go_str_const:
    dc.b    "Hello, Amiga OS 3.x!", 10, 0   ; Null-terminated with linefeed`,
    consoleLines: [
      "Amiga Shell v3.9 loaded.",
      "1> df0:goc68k -cpu=68000 -target=amigaos main.go",
      "Compiling Go AST structure...",
      "Resolving standard package 'fmt' mapped to 'dos.library' vectors.",
      "Resolving symbol table: _main_main",
      "Vasm Assembly generation complete. Hunk size: 184 bytes.",
      "1> compiled_executable.run",
      "Hello, Amiga OS 3.x!",
      "Program exited with exit code: 0"
    ],
    graphicType: "cli"
  },
  {
    id: "intuition_window",
    name: "Intuition GUI Window",
    description: "Launches a native cooperative window on the Workbench screen using the Amiga OS intuition.library.",
    category: "GUI",
    code: `package main

import (
    "amiga/exec"
    "amiga/intuition"
)

func main() {
    // Load intuition.library dynamically via Exec ROM library vector
    intuitionBase, err := exec.OpenLibrary("intuition.library", 36)
    if err != nil {
        panic("Could not load intuition.library!")
    }
    defer exec.CloseLibrary(intuitionBase)

    // Construct intuitive Window parameters matching Workbench layout specs
    winTags := intuition.NewWindow{
        Left:   40,
        Top:    40,
        Width:  340,
        Height: 180,
        Title:  "Go Amiga App",
        Flags:  intuition.WFLG_CLOSEGADGET | intuition.WFLG_DRAGBAR | intuition.WFLG_DEPTHGADGET | intuition.WFLG_ACTIVATE,
        IDCMP:  intuition.IDCMP_CLOSEWINDOW,
    }

    winPtr, err := intuition.OpenWindow(&winTags)
    if err != nil {
         panic("Failed to open custom win!")
    }
    
    // Virtual event loop listening to Amiga IDCMP port triggers
    for {
        msg := intuition.WaitPort(winPtr.UserPort)
        if msg.Class == intuition.IDCMP_CLOSEWINDOW {
            break
        }
        intuition.ReplyMsg(msg)
    }
    
    intuition.CloseWindow(winPtr)
}`,
    defaultAssembly: `; --- Go-Amiga Compiler Output ---
; Target CPU: Motorola 68020 (Enabled 32-bit Index Addressing)
; Optimization: -O2 (Inlined deferred blocks, static pointers)
; Translation of _main_main OpenWindow block

_main_main:
    link    a5,#-48              ; Reserve 48 bytes local stack for NewWindow struct
    movem.l d2-d4/a2/a6,-(sp)    ; Preserve critical registers
    
    ; Load ExecBase from hardcoded memory register $00000004
    move.l  4.w, a6              ; Move ExecBase pointer to A6
    
    ; Call Exec:OpenLibrary("intuition.library", 36)
    lea     .intuition_name(pc), a1 ; Argument 1: Library Name in A1
    moveq   #36, d0              ; Argument 2: Version number in D0
    jsr     -408(a6)             ; JSR to LVO-408 (_LVOOpenLibrary)
    move.l  d0, _IntuitionBase   ; Store library base for later uses
    beq     .panic_missing_lib   ; Panic if NULL
    
    ; Initialize custom memory mapping NewWindow structure on stack
    move.l  a5, a0               ; Point a0 to the base of stack buffer
    add.l   #-48, a0             ; Point to our local Struct block
    move.w  #40, 0(a0)           ; NewWindow.LeftEdge = 40
    move.w  #40, 2(a0)           ; NewWindow.TopEdge = 40
    move.w  #340, 4(a0)          ; NewWindow.Width = 340
    move.w  #180, 6(a0)          ; NewWindow.Height = 180
    move.b  #0, 8(a0)            ; DetailPen
    move.b  #1, 9(a0)            ; BlockPen
    move.l  #.window_title(pc), 10(a0) ; Title string pointer
    move.l  #$000F, 14(a0)       ; Flags (CLOSE | DRAG | DEPTH | ACTIVATE)
    move.l  #$0001, 18(a0)       ; IDCMP (CLOSEWINDOW)
    
    ; Call IntuitionBase:OpenWindow(NewWindow)
    move.l  _IntuitionBase, a6   ; Load Intuition Library base into A6
    move.l  a0, a0               ; Move struct pointer to A0 register
    jsr     -204(a6)             ; JSR to LVO-204 (_LVOOpenWindow)
    move.l  d0, _window_ptr      ; Save retrieved structural Window cursor

    ; ... Event Loop mapping follows ...
    movem.l (sp)+,d2-d4/a2/a6
    unlk    a5
    rts

.panic_missing_lib:
    illegal                      ; Halt runtime instantly
.intuition_name:
    dc.b    "intuition.library", 0
.window_title:
    dc.b    "Go Amiga App (68k)", 0`,
    consoleLines: [
      "1> goc68k -cpu=68020 -opt=O2 main.go",
      "Binding variables to absolute Exec structure tables...",
      "Mapping Go pointers to ROM library vector lists.",
      "Compiler linking: intuition.library LVO OpenWindow [LVO -204].",
      "Compilation SUCCESS. Executable 'GoApp' generated (8.2 KB).",
      "1> GoApp",
      "[INFO] Loading system ROM Vectors dynamically via SysBase...",
      "[GUI] Opened Window pointer at 0x00A3DF10 on Screen: WORKBENCH",
      "[GUI] Listening to IDCMP Messages at custom window message port.",
    ],
    graphicType: "window"
  },
  {
    id: "copper_hack",
    name: "Copper Screen Shacking (Hardware Hack)",
    description: "Bypasses standard OS layers to write directly to Denise graphics custom registers using standard pointer hardware-mapping.",
    category: "Graphics",
    code: `package main

import "unsafe"

// Amiga hardware custom chip registers memory-mapped offset
const CUSTOM_BASE uintptr = 0xDFF000

// Denise background color register memory address (COLOR00)
const BG_COLOR_REG uintptr = CUSTOM_BASE + 0x180

// Amiga beam position register (VHPOSR)
const VHPOSR_REG uintptr = CUSTOM_BASE + 0x006

func main() {
    // Map unsafe pointers to direct hardware registers
    colorPtr := (*uint16)(unsafe.Pointer(BG_COLOR_REG))
    beamPtr  := (*uint16)(unsafe.Pointer(VHPOSR_REG))

    // Disable standard multitasking copper system momentarily
    // (In simulated standalone mode, we create custom copper effect)
    for frame := 0; frame < 500; frame++ {
        // Synchronize with the vertical beam line 150 (WaitTOF equivalent in hardware)
        for {
            beam := *beamPtr
            line := (beam >> 8) & 0xFF
            if line == 150 {
                break
            }
        }
        
        // Write colorful raster stripes based on current frame ticks
        for stripe := 0; stripe < 40; stripe++ {
            // Write to Denis chip Color Register directly
            *colorPtr = uint16(stripe << 8 | (frame & 0xF))
        }
        
        // Return screen color back to classic Amiga slate blue
        *colorPtr = 0x124
    }
}`,
    defaultAssembly: `; --- Go-Amiga Compiler Output ---
; Target CPU: Motorola 68000 (Low level hardware register manipulation)
; Optimization: -O3 (Absolute Unmanaged Pointer Optimization)

_main_main:
    move.l  #$DFF000, a0         ; Load base address of custom chip registers
    move.l  #500, d2             ; Move Frame tick loops count to D2
    
.frame_loop:
    ; Wait for vertical beam to cross scanline target index 150
.beam_wait:
    move.w  $006(a0), d0         ; Load current VHPOSR registration
    lsr.w   #8, d0               ; Shift 8 bits right to extract Vertical Line
    and.w   #$FF, d0             ; Mask lower bits of line index
    cmp.w   #150, d0             ; Compare with targets line 150
    bne     .beam_wait           ; Fetch again if not there yet
    
    ; Render the vertical copper style stripes on display
    moveq   #0, d1               ; Reset stripe index counter
    
.stripe_write:
    move.w  d1, d3               ; D3 = current index
    lsl.w   #8, d3               ; Shift index left to Red color line
    
    ; Add current frame modulation factor to color
    move.w  d2, d4
    and.w   #$0F, d4             ; Mask frame ticks lower factors
    or.w    d4, d3               ; Blend colors
    
    move.w  d3, $180(a0)         ; WRITE directly to Denise COLOR00 hardware buffer ($DFF180)
    
    addq.w  #1, d1               ; Stripe++
    cmp.w   #40, d1              ; Drawn all 40 stripes?
    bne     .stripe_write        ; Keep drawing the raster blocks
    
    move.w  #$124, $180(a0)      ; Restore default dark-blue background ($DFF180)
    
    dbf     d2, .frame_loop      ; Decrement frame counter. Loop if not zero.
    rts`,
    consoleLines: [
      "1> goc68k -cpu=68000 -unsafe=true main.go",
      "[WARN] Unsafe memory operations enabled.",
      "WARNING: Directly accessing custom chips bypassing AmigaOS multitasking!",
      "Writing directly to Custom Chip registers base (0x00DFF000).",
      "Linking hardware pointers: Denise COLOR00 mapped at offset $180.",
      "Assembly generated. Size: 92 bytes.",
      "1> Run_Demo",
      "[INFO] System DMA intercepted. Launching Copper sync visuals...",
      "[INFO] Modulating Denise background colors directly.",
    ],
    graphicType: "copper_bobs"
  },
  {
    id: "exec_tasks",
    name: "Exec Tasks & Goroutines (Concurrency)",
    description: "Maps Go's concurrent channels onto Exec tasks, using software signal masks for high speed low memory co-routine scheduling.",
    category: "Concurrency",
    code: `package main

import (
    "amiga/exec"
    "fmt"
)

func worker(id int, pipe chan string) {
    // Inform mother process that task is executing
    pipe <- fmt.Sprintf("A68k Task %d is alive!", id)
}

func main() {
    execBase, _ := exec.InitScheduler()
    defer execBase.Close()

    // Create standard synchronized communication channel
    pipe := make(chan string, 2)

    // Spawn concurrent goroutines.
    // Under the hood, Go-Amiga compiler translates 'go' 
    // to dynamic ExecBase:CreateTask() calls!
    go worker(1, pipe)
    go worker(2, pipe)

    // Await data messages from cooperative Amiga Exec tasks
    msg1 := <-pipe
    msg2 := <-pipe

    fmt.Println("Main thread received:")
    fmt.Println("- " + msg1)
    fmt.Println("- " + msg2)
}`,
    defaultAssembly: `; --- Go-Amiga Compiler Output ---
; Target CPU: Motorola 68040 (Hyper fast context-switches)
; Concurrency mapping: Go 'go' keyword mapped to _LVOAddTask LVO -282

_Go_spawn_goroutine:
    link    a5,#-32              ; Build stack framework
    movem.l d2/a1/a2/a6,-(sp)
    
    move.l  4.w, a6              ; Load ExecBase from Memory offset $4
    
    ; CreateTask requires structural Task initialization
    move.l  #512, d0             ; Allocate 512 bytes stack segment (Sleek!)
    move.l  #$10001, d1          ; MEMF_PUBLIC | MEMF_CLEAR memory flags
    jsr     -198(a6)             ; LVO AllocMem!
    move.l  d0, a2               ; Handle pointer in A2 register
    beq     .scheduler_panic
    
    ; Populate Exec Task Structure fields for cooperative multitasking
    move.b  #1, 14(a2)           ; Task Node type (NT_TASK)
    move.b  #10, 9(a2)           ; Scheduler Priority (10) for higher weight
    move.l  #.task_label(pc), 10(a2) ; Task name marker string
    
    ; Call Exec:AddTask to register task into Amiga ROM Scheduler queue
    move.l  a2, a1               ; Task handle parameter in A1
    move.l  #.go_closure_entry(pc), a2 ; Pointer to actual Go executable code
    sub.l   a3, a3               ; Stack stream structure null boundary
    jsr     -282(a6)             ; JSR to _LVOAddTask
    
    movem.l (sp)+,d2/a1/a2/a6
    unlk    a5
    rts

.scheduler_panic:
    illegal                      ; Error trap
.task_label:
    dc.b    "GoGoroutineWorker", 0
.go_closure_entry:
    ; Subtask entry executes here and utilizes Exec:Signal() back to parent thread 
    rts`,
    consoleLines: [
      "1> goc68k -cpu=68044 -target=amigaos main.go",
      "Compiling Go AST with modular asynchronous task generator.",
      "Intercepting 'go' spawning keywords: redirecting to Exec Tasks.",
      "Optimizing Channels: mapped to Exec Signal flags for zero overhead.",
      "Compilation Complete. Goroutine-to-Exec binder initialized.",
      "1> compiled_scheduler_demo",
      "[SCHED] Initialized Go cooperative runtime on AmigaOS 3.x",
      "[SCHED] Spawning worker 1 -> Exec Task NT_TASK at 0x00B2DF4C",
      "[SCHED] Spawning worker 2 -> Exec Task NT_TASK at 0x00B2DF8E",
      "[SCHED] Task 1 context-switched - Sending ExecSignal to Main task.",
      "[SCHED] Task 2 context-switched - Sending ExecSignal to Main task.",
      "Main received:",
      "- A68k Task 1 is alive!",
      "- A68k Task 2 is alive!",
    ],
    graphicType: "groutine_visual"
  }
];
