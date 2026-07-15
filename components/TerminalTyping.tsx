"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Typewriter from "typewriter-effect";

import { resumeData } from "@/data/resume";

// Scoped scrollbar treatment for the terminal's output pane. Replaces the
// tailwind-scrollbar plugin classes (scrollbar-thin/scrollbar-thumb-*), which
// emit nothing since that plugin isn't installed — the scrollbar was silently
// falling back to the chunky global 10px thumb. Token-driven (--border-strong)
// rather than an off-palette gray, same local <style> pattern used by
// components/beam/BootIgnition.tsx (MOBILE_CSS).
const TERMINAL_SCROLL_CSS = `
.terminal-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
}
.terminal-scroll::-webkit-scrollbar {
  width: 6px;
}
.terminal-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.terminal-scroll::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 9999px;
}
`;

/* -------------------------------------------------------------------------- */
/*                                 FILE SYSTEM                                */
/* -------------------------------------------------------------------------- */

type FileSystemNode =
  | { type: "file"; content: string }
  | { type: "dir"; children: Record<string, FileSystemNode> };

// ~/work/ — PROTECTIVE disclosure posture (jc-396): domain summaries only.
// No client or system names, no uniquely identifying figures (a unique
// public fact is a unique identifier — one search resolves it), and stacks
// never bound to a specific system. The full named record lives in the
// owner's private resume — targeted disclosure, not broadcast.
const workFiles: Record<string, FileSystemNode> = {
  "readme.txt": {
    type: "file",
    content: "One file per focus area. Specific clients and systems are shared in interviews, not broadcast — ask me. See ~/experience for positions held.",
  },
  "devsecops.txt": {
    type: "file",
    content: resumeData.experience[0].description.join("\n"),
  },
  "modernization.txt": {
    type: "file",
    content:
      "Legacy financial modernization\n\nBackend developer and technical architect on a multi-phase modernization of a nine-figure public-sector financial platform — then onshore tech lead and SME for the legacy system's DevOps and M&O.",
  },
  "election-transparency.txt": {
    type: "file",
    content:
      "Election transparency\n\nFull-stack developer on a state government's election-transparency tooling — the class of system the public uses to follow money in politics.",
  },
  "healthcare.txt": {
    type: "file",
    content:
      "Healthcare builds\n\nTech lead owning third-party EMR integration and delivery of a health-insurance member app in a one-month sprint — guiding onshore developers and managing releases.",
  },
  "public-education.txt": {
    type: "file",
    content:
      "Public education\n\nBuilt and supported statewide public-education applications.",
  },
  "covid-response.txt": {
    type: "file",
    content:
      "COVID-19 response\n\nStatewide testing-registration platforms, government travel-authorization programs, and thermal-camera screening deployments — shipped while the pandemic was live.",
  },
  "first-role.txt": {
    type: "file",
    content:
      "CIMP — first engineering role\n\nA kiosk check-in and live queuing system for a State of Hawaiʻi public facility.\n\nLed front-end development with CIMP mentors and interns; planned and installed the system's hardware components.",
  },
};

const fileSystem: Record<string, FileSystemNode> = {
  "~": {
    type: "dir",
    children: {
      "work": {
        type: "dir",
        children: workFiles,
      },
      "skills": {
        type: "dir",
        children: {
          "languages.txt": { type: "file", content: resumeData.skills.languages.join("\n") },
          "databases.txt": { type: "file", content: resumeData.skills.databases.join("\n") },
          "frameworks.txt": { type: "file", content: resumeData.skills.frameworks.join("\n") },
        },
      },
      "experience": {
        type: "dir",
        children: resumeData.experience.reduce((acc, job) => {
          // simple slugify
          const slug = job.company.toLowerCase().replace(/[^a-z0-9]/g, "-") + ".txt";
          acc[slug] = {
            type: "file",
            content: `${job.title} @ ${job.company}\n${job.period}\n\n${job.description.join("\n")}`,
          };
          return acc;
        }, {} as Record<string, FileSystemNode>),
      },
      "about.md": { type: "file", content: resumeData.summary },
      "contact.txt": { type: "file", content: `Email: ${resumeData.email}\nHint: type 'copy email' to copy it to your clipboard.` },
      ".config": { type: "file", content: "theme=dark\nshell=beam-console\nstatus=online" },
    },
  },
};

export default function TerminalTyping() {
  const prefersReducedMotion = useReducedMotion();
  // "opening" renders a static, fully-readable transcript on the very first
  // frame (the terminal is NEVER an empty panel). "typing" runs the Typewriter
  // as progressive enhancement over the same content. "complete" hands off to
  // the interactive shell. Under reduced motion we never enter "typing".
  const [phase, setPhase] = useState<"opening" | "typing" | "complete">("opening");

  // Keep track of where we are. Root is "~"
  const [currentPath, setCurrentPath] = useState<string[]>(["~"]);

  // Authored boot log (jc-iuq): after `whoami`, the console keeps working —
  // a short DECORATIVE system-speak boot sequence that mirrors the four acts
  // the visitor is about to scroll (statement → approach → experience →
  // connection). No resume copy, no claims; "link BEAM" nods to the violet
  // thread. The Typewriter replays it line-by-line as a timed reveal (no
  // Canvas re-render); reduced motion lands the whole log statically. The
  // richer log + the right-sized card keep the panel <=30% empty at rest.
  const terminalContent = `$ whoami
Jake Castillo
$ beam --link
  link BEAM ............ ok
  mount /whoami ........ ok
  mount /approach ...... ok
  mount /work .......... ok
  mount /stack ......... ok
  mount /contact ....... ok
$ `;

  const bootTranscript = useMemo(
    () => terminalContent.replace(/\n\$\s*$/, ""),
    [terminalContent]
  );

  const availableCommands = useMemo(
    () => [
      "help",
      "clear",
      "ls",
      "cd",
      "cat",
      "pwd",
      "whoami",
      "whois",
      "copy email",
      "git log",
      "npm install",
      "sudo",
    ],
    []
  );

  // Tap-to-run command chips for coarse pointers (jc-p5g). Typing into the
  // console is implausible on a phone, so these fire the SAME dispatcher
  // (runCommand) as typed input — no forked logic. Fine pointers keep the
  // typed experience (the row is `hidden coarse:flex`). Paths are absolute so
  // each chip resolves regardless of the current working directory.
  const touchCommands = useMemo(
    () => ["help", "ls ~/work", "cat ~/work/readme.txt", "git log", "whois"],
    []
  );

  const [outputText, setOutputText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll whenever output changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [outputText, history]); // history added just in case

  const appendLines = (lines: string[]) => {
    if (lines.length === 0) return;
    setOutputText((current) => {
      const prefix = current.length === 0 ? "" : "\n";
      return `${current}${prefix}${lines.join("\n")}`;
    });
  };

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  /* -------------------------------------------------------------------------- */
  /*                                 FILE HELPERS                               */
  /* -------------------------------------------------------------------------- */

  // Resolve a path string to a node in fileSystem
  // commands like `cd ..` or `cd experience` needs to resolve relative to currentPath
  const resolvePath = (
    pathArg: string
  ): { targetPath: string[]; node: FileSystemNode | null } => {
    // Clone current path
    let steps = [...currentPath];

    // Handle absolute path/home alias
    if (pathArg.startsWith("~")) {
      steps = ["~"];
      pathArg = pathArg.slice(1);
      if (pathArg.startsWith("/")) pathArg = pathArg.slice(1);
    } else if (pathArg.startsWith("/")) {
      // Treat / as ~ for this simple sim
      steps = ["~"];
      pathArg = pathArg.slice(1);
    }

    const parts = pathArg.split("/").filter(Boolean);

    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        if (steps.length > 1) steps.pop();
        continue;
      }

      // Look up child in current tip
      const currentDirNode = getNode(steps);
      if (currentDirNode && currentDirNode.type === "dir" && currentDirNode.children[part]) {
        steps.push(part);
      } else {
        return { targetPath: steps, node: null }; // Invalid path segment
      }
    }

    return { targetPath: steps, node: getNode(steps) };
  };

  const getNode = (pathArray: string[]): FileSystemNode | null => {
    // Start at root which is fileSystem["~"]
    // pathArray[0] is always "~"
    let curr: FileSystemNode = fileSystem["~"];

    for (let i = 1; i < pathArray.length; i++) {
      if (curr.type !== "dir") return null;
      curr = curr.children[pathArray[i]];
      if (!curr) return null;
    }
    return curr;
  };

  /* -------------------------------------------------------------------------- */
  /*                                CMD RUNNER                                  */
  /* -------------------------------------------------------------------------- */

  const runCommand = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Display the command user just typed
    // Reconstruct prompt path, e.g. "~/experience"
    // Use slightly different format to separate prompt from output
    const promptPath = currentPath.length === 1 ? "~" : `~/${currentPath.slice(1).join("/")}`;
    appendLines([`${promptPath} $ ${trimmed}`]);

    const args = trimmed.split(/\s+/);
    const cmd = args[0].toLowerCase();
    const arg1 = args[1] || "";

    switch (cmd) {
      case "help":
        appendLines([
          "Available commands:",
          ...availableCommands.map((c) => `  ${c}`),
        ]);
        break;

      case "clear":
        setOutputText("");
        break;

      case "pwd":
        appendLines([currentPath.length === 1 ? "/home/jake" : `/home/jake/${currentPath.slice(1).join("/")}`]);
        break;

      case "whoami":
      case "whois":
        if (cmd === "whoami") {
          appendLines(["jake"]);
        } else {
          appendLines([
            `Name: ${resumeData.name}`,
            `Role: ${resumeData.summary.split(".")[0]}.`,
            `Location: ${resumeData.location}`,
            `Status: Online`,
            `Focus: DevSecOps · Cloud security`,
          ]);
        }
        break;

      case "ls": {
        // First non-flag token is the path (so `ls -la` still lists the
        // current dir, but `ls ~/work` resolves the target — needed for the
        // touch chips, which reuse this dispatcher).
        const pathArg = args.slice(1).find((a) => !a.startsWith("-"));
        const node = pathArg ? resolvePath(pathArg).node : getNode(currentPath);
        if (pathArg && !node) {
          appendLines([`ls: cannot access '${pathArg}': No such file or directory`]);
          break;
        }
        if (node?.type === "file") {
          // Real ls echoes the name back for a file target.
          appendLines([pathArg ?? ""]);
          break;
        }
        if (node?.type === "dir") {
          const files = Object.keys(node.children);
          const formatted = files.map((f) => {
            const isDir = node.children[f].type === "dir";
            return isDir ? `${f}/` : f;
          });
          appendLines([formatted.length === 0 ? "(empty)" : "  " + formatted.join("  ")]);
        }
        break;
      }

      case "cd": {
        if (!arg1) {
          setCurrentPath(["~"]);
          return;
        }
        const { targetPath, node } = resolvePath(arg1);
        if (node && node.type === "dir") {
          setCurrentPath(targetPath);
        } else if (node && node.type === "file") {
          appendLines([`bash: cd: ${arg1}: Not a directory`]);
        } else {
          appendLines([`bash: cd: ${arg1}: No such file or directory`]);
        }
        break;
      }

      case "cat": {
        if (!arg1) {
          appendLines(["Usage: cat <filename>"]);
          return;
        }
        const { node } = resolvePath(arg1);
        if (node && node.type === "file") {
          appendLines([node.content]);
        } else if (node && node.type === "dir") {
          appendLines([`cat: ${arg1}: Is a directory`]);
        } else {
          appendLines([`cat: ${arg1}: No such file or directory`]);
        }
        break;
      }

      case "sudo":
        if (arg1 === "rm" && args.includes("-rf") && (args.includes("/") || args.includes(".") || args.includes("*"))) {
          appendLines([
            "WARNING: destructive operation blocked.",
            "This shell is running in read-only observer mode.",
          ]);
        } else if (arg1 === "hire") {
          // trigger copy email logic
          runCommand("copy email");
        } else {
          appendLines(["sudo: permission denied. (You found the easter egg though!)"]);
        }
        break;

      case "git":
        if (arg1 === "log") {
          appendLines([
            "* 9a2b3c (HEAD -> main) feat: joined Pacific ImpactZone as DevSecOps engineer",
            "* 8d7e6f feat: rebuilding election-transparency tooling for a state government",
            "* 5c4b3a feat: modernized a nine-figure financial platform for the cloud",
            "* 1a2b3c init: B.S. Computer Engineering, University of Hawaii at Manoa",
          ]);
        } else {
          appendLines(["git: command not found. Try 'git log'."]);
        }
        break;

      case "npm":
        if (arg1 === "install" || arg1 === "i") {
          const pkg = args[2];
          if (!pkg) {
            appendLines(["npm ERR! missing argument: package name"]);
            return;
          }
          // check if skill exists in resumeData
          const allSkills = [
            ...resumeData.skills.languages,
            ...resumeData.skills.frameworks,
            ...resumeData.skills.databases,
          ].map(s => s.toLowerCase());

          if (allSkills.some(s => s.includes(pkg.toLowerCase()))) {
            appendLines([
              `npm WARN deprecated ${pkg}@0.0.1: This skill is already mastered.`,
              `+ ${pkg}@latest`,
              `added 1 package in 0.4s`
            ]);
          } else {
            appendLines([
              `npm ERR! 404 Not Found: ${pkg}`,
              `npm ERR! User has not yet installed '${pkg}'.`,
              `npm ERR! Suggestion: 'cat skills/languages.txt' for what's on the shelf.`
            ]);
          }
        } else {
          appendLines(["npm: command not found. Try 'npm install <skill>'."]);
        }
        break;

      case "copy":
        if (arg1 === "email") {
          try {
            await navigator.clipboard.writeText(resumeData.email);
            appendLines([`✓ Copied: ${resumeData.email}`]);
          } catch {
            // Fallback for some browsers
            const textarea = document.createElement("textarea");
            textarea.value = resumeData.email;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            appendLines([`✓ Copied: ${resumeData.email}`]);
          }
        } else {
          appendLines(["Usage: copy email"]);
        }
        break;

      default:
        appendLines([
          `✗ Command not found: ${cmd}`,
          "  Type \`help\` to see available commands",
        ]);
    }
  };

  // NOTE: deliberately do NOT auto-focus the input when typing completes.
  // Focusing a (possibly offscreen) input scrolls the page back to the terminal,
  // yanking the viewport away if the visitor has already scrolled elsewhere. The
  // terminal is interactive on click/tap instead (see onClick on the panel).

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        if (phase !== "opening") return;
        if (prefersReducedMotion) {
          // Reduced motion: skip the Typewriter entirely, seed the final boot
          // transcript and hand straight off to the interactive shell. Same
          // branded content, no per-character animation.
          setOutputText(bootTranscript);
          setPhase("complete");
        } else {
          setPhase("typing");
        }
      }}
      onClick={() => inputRef.current?.focus()}
      className={`terminal-shell relative bg-[color:var(--surface-overlay)] text-[color:var(--foreground)] font-mono text-sm rounded-xl mx-auto w-full max-w-xl min-w-0 overflow-hidden flex flex-col cursor-text text-left transition-shadow duration-200 ${
        isFocused
          ? "ring-2 ring-offset-2 ring-offset-background ring-[color:var(--primary-hover)] border border-border-strong"
          : "border border-border"
      }`}
      style={{
        height: "340px", // Right-sized to the boot log (jc-iuq): 8 content lines fill the resting console to <=30% empty
        // Luminance/border-based elevation: faint inner highlight + a soft ambient
        // glow (primary-tinted) instead of a heavy black drop shadow. On focus the
        // ambient glow intensifies, reinforcing the keyboard focus ring.
        boxShadow: isFocused
          ? "inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 0 0 1px rgba(139, 92, 246, 0.20), 0 0 40px -8px rgba(139, 92, 246, 0.45)"
          : "inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 1px 1px 0 rgba(0, 0, 0, 0.25), 0 0 32px -14px rgba(139, 92, 246, 0.30)",
        fontFamily: "var(--font-geist-mono), 'SF Mono', Menlo, Monaco, monospace"
      }}
    >
      {/* Beam-console chrome — bar derived near the surface-overlay token
          (#2a2a32). The three foreign macOS hues (red/yellow/green traffic
          lights) are gone; in their place a single lit violet node (the beam
          entering the frame) plus two dim status vents, all monochrome. */}
      <div className="relative flex items-center h-7 px-3 bg-[#2a2a32] border-b border-[#202028] shrink-0">
        <div className="flex items-center gap-2 absolute left-3" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-primary-hover shadow-[0_0_8px_1px_rgba(139,92,246,0.85)]" />
          <span className="h-2 w-2 rounded-full border border-border-strong" />
          <span className="h-2 w-2 rounded-full border border-border" />
        </div>
        <div className="w-full text-center">
          <span className="text-[color:var(--muted-foreground)] text-xs font-semibold flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z" /></svg>
            beam · console
          </span>
        </div>
      </div>

      {/* Opening phase — the boot transcript rendered as STATIC styled text on
          the very first frame, so the panel is never empty/black before the
          Typewriter takes over. role="log" so AT announce the same content. */}
      {phase === "opening" && (
        <div
          role="log"
          aria-live="polite"
          aria-label="Terminal boot transcript"
          tabIndex={0}
          className="p-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere] flex-1 min-w-0 overflow-auto overflow-x-hidden min-h-0 pr-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--primary-hover)]"
        >
          {bootTranscript}
        </div>
      )}

      {/* Typing phase — progressive enhancement: the Typewriter replays the
          same transcript character-by-character (only for non-reduced-motion). */}
      {phase === "typing" && (
        <div
          role="log"
          aria-live="polite"
          aria-label="Terminal boot transcript"
          tabIndex={0}
          className="p-3 whitespace-pre-wrap break-words flex-1 min-w-0 overflow-auto overflow-x-hidden min-h-0 pr-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--primary-hover)] [&_.Typewriter__wrapper]:whitespace-pre-wrap [&_.Typewriter__wrapper]:break-words [&_.Typewriter__wrapper]:[overflow-wrap:anywhere] [&_.Typewriter__wrapper]:block [&_.Typewriter__cursor]:text-[color:var(--primary-hover)]"
        >
          <Typewriter
            options={{
              autoStart: true,
              loop: false,
              delay: 25,
              cursor: "▋",
            }}
            onInit={(typewriter) => {
              typewriter
                .typeString(escapeHtml(terminalContent).replaceAll("\n", "<br/>"))
                .callFunction(() => {
                  setOutputText(bootTranscript);
                  setPhase("complete");
                })
                .start();
            }}
          />
        </div>
      )}

      {/* Interactive phase */}
      {phase === "complete" && (
        <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
          <style>{TERMINAL_SCROLL_CSS}</style>
          {/* Scrollback fills the card's height so the console never reads as a
              half-empty panel; the live prompt + readout are pinned to the
              bottom edge (see the console footer below), so the card earns its
              full height at 1440x900 / 1920x1080 with no dead lower half. */}
          <div
            ref={scrollContainerRef}
            role="log"
            aria-live="polite"
            aria-label="Terminal output. Use arrow keys to scroll."
            tabIndex={0}
            className="terminal-scroll flex-1 min-w-0 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] pr-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--primary-hover)] rounded-sm"
          >
            {outputText}
            <div className="h-1" />
          </div>

          {/* Pinned console footer — the live prompt and a persistent system
              readout, anchored to the bottom. */}
          <div className="shrink-0 mt-1 border-t border-[#202028] pt-2">
            <form
              className="flex items-center gap-2 min-w-0"
              onSubmit={async (e) => {
                e.preventDefault();
                const value = inputValue;
                setInputValue("");
                setHistoryIndex(null);
                if (!value.trim()) return;
                setHistory((prev) => [...prev, value]);
                await runCommand(value);
              }}
            >
              <span className="text-[color:var(--primary-hover)] select-none shrink-0 text-sm font-semibold">
                {currentPath.length === 1 ? "~" : currentPath[currentPath.length - 1]} $
              </span>
              {/* Idle block cursor: a visible caret BEFORE any focus/input so a
                  first-time visitor sees the prompt is live. Static (not
                  blinking) under reduced motion; the native caret takes over on
                  focus. */}
              {!isFocused && inputValue === "" && (
                <span aria-hidden="true" className="terminal-caret shrink-0" />
              )}
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (history.length === 0) return;
                    const nextIndex =
                      historyIndex === null
                        ? history.length - 1
                        : Math.max(0, historyIndex - 1);
                    setHistoryIndex(nextIndex);
                    setInputValue(history[nextIndex] ?? "");
                    return;
                  }

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (history.length === 0) return;
                    if (historyIndex === null) return;
                    const nextIndex = historyIndex + 1;
                    if (nextIndex >= history.length) {
                      setHistoryIndex(null);
                      setInputValue("");
                      return;
                    }
                    setHistoryIndex(nextIndex);
                    setInputValue(history[nextIndex] ?? "");
                    return;
                  }

                  if (e.key === "Tab") {
                    e.preventDefault();
                    const current = inputValue.trimStart();
                    // Basic autocomplete for commands only for now
                    if (!current) {
                      return;
                    }
                    const matches = availableCommands.filter((c) =>
                      c.startsWith(current.toLowerCase())
                    );
                    if (matches.length > 0) {
                      setInputValue(matches[0]);
                    }
                  }

                  // Ctrl+L to clear
                  if (e.ctrlKey && e.key === "l") {
                    e.preventDefault();
                    setOutputText("");
                  }
                }}
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                placeholder="type 'help'"
                // coarse:text-[16px] — iOS Safari auto-zooms the viewport on
                // focus of any input under 16px; at mono sizes the visual
                // delta from text-sm (14px) is negligible, so this only bumps
                // on touch (coarse = "(hover: none)", see globals.css).
                className="flex-1 min-w-0 bg-transparent text-[color:var(--foreground)] text-sm coarse:text-[16px] placeholder:text-subtle-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)]"
                aria-label="Terminal input"
              />
            </form>

            {/* Tap-to-run command chips (jc-p5g) — coarse pointers only, so the
                desktop typed experience is untouched (`hidden coarse:flex`).
                Each chip fires the SAME runCommand dispatcher as typed input.
                stopPropagation keeps the panel's click-to-focus handler from
                pulling focus into the input (and popping the iOS keyboard) — the
                keyboard appears only when the visitor taps the input itself.
                Own overflow-x container so the row scrolls without widening the
                card; 44px min target height for touch. */}
            <div
              role="group"
              aria-label="Quick commands"
              className="hidden coarse:flex items-center gap-2 mt-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {touchCommands.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  aria-label={`Run command: ${cmd}`}
                  onClick={(e) => {
                    // Do not focus the input — running the command should not
                    // pop the keyboard (see comment above).
                    e.stopPropagation();
                    void runCommand(cmd);
                  }}
                  className="shrink-0 inline-flex items-center min-h-[44px] px-3 rounded-md border border-border bg-[color:var(--surface-overlay)] text-[color:var(--muted-foreground)] text-xs whitespace-nowrap transition-colors duration-200 hover:text-[color:var(--foreground)] hover:border-border-strong active:text-[color:var(--foreground)] active:border-[color:var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)]"
                >
                  <span aria-hidden="true" className="mr-1.5 font-semibold text-[color:var(--primary-hover)]">$</span>
                  {cmd}
                </button>
              ))}
            </div>

            {/* Persistent system readout — a live signal indicator plus a
                standing hint at the genuinely fun command set, so the discovery
                surface is always visible without any input. */}
            <div className="mt-1.5 flex items-center justify-between gap-3 text-[0.6875rem] label select-none">
              {/* Both readout spans are decorative for AT — the input's
                  placeholder already carries the 'help' hint accessibly. */}
              <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_1px_rgba(45,212,191,0.6)]" />
                signal: live
              </span>
              {/* Arrow-key history has no touch equivalent, so the hint is
                  fine-pointer only (coarse:hidden) — it never advertises an
                  affordance a phone user can't reach. min-w-0 lets THIS segment
                  be the one that truncates, so at 320-430px the signal readout
                  holds one line instead of wrapping into it (jc-37q). */}
              <span aria-hidden="true" className="min-w-0 truncate coarse:hidden">
                type &lsquo;help&rsquo; &middot; &uarr; history
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ribbon-grain scanlines (jc-iuq) — a decorative CRT dither that ties
          the console to the beam ribbon's texture. Pure luminance (no hue) so
          the two-color system is untouched; fully static (no animation) so
          reduced motion needs no separate path. pointer-events-none keeps the
          interactive shell fully clickable/scrollable underneath. Average
          darkening ~5% (1 of every 3 rows at 16%), so the high-contrast
          terminal text (#ededf2 on #1c1c24, ~13:1) stays comfortably legible. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)",
        }}
      />
    </motion.div>
  );
}
