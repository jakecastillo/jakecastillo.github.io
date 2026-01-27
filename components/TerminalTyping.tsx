"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Typewriter from "typewriter-effect";

import { resumeData } from "@/data/resume";

/* -------------------------------------------------------------------------- */
/*                                 FILE SYSTEM                                */
/* -------------------------------------------------------------------------- */

type FileSystemNode =
  | { type: "file"; content: string }
  | { type: "dir"; children: Record<string, FileSystemNode> };

const fileSystem: Record<string, FileSystemNode> = {
  "~": {
    type: "dir",
    children: {
      "projects": {
        type: "dir",
        children: {
          "portfolio.txt": { type: "file", content: "Built with Next.js, Framer Motion, and excessive caffeine." },
          "client-work.md": { type: "file", content: "Check out the projects section for the real deal." },
        },
      },
      "skills": {
        type: "dir",
        children: {
          "frontend.txt": { type: "file", content: resumeData.skills.languages.join("\n") },
          "backend.txt": { type: "file", content: resumeData.skills.databases.join("\n") },
          "tools.txt": { type: "file", content: resumeData.skills.frameworks.join("\n") },
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
      "contact.txt": { type: "file", content: `Email: ${resumeData.email}\nDocs: type 'copy email' to put in clipboard.` },
      ".config": { type: "file", content: "theme=dark\nfont=geek-mono\ncoffee_level=critical" },
    },
  },
};

export default function TerminalTyping() {
  const [phase, setPhase] = useState<"opening" | "typing" | "complete">("opening");

  // Keep track of where we are. Root is "~"
  const [currentPath, setCurrentPath] = useState<string[]>(["~"]);

  const terminalContent = `$ whoami
Jake Castillo
$ cat fun-fact.txt
Uma Musume is one of my favorite games
$ ls skills/
TypeScript  React  Node.js  AWS  Next.js
PostgreSQL  NestJS  Vue  Prisma
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

  const [outputText, setOutputText] = useState("");
  const [inputValue, setInputValue] = useState("");
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
            `Uptime: 26 years`,
          ]);
        }
        break;

      case "ls": {
        // Support `ls -la` or just `ls`
        // We might accept a path arg later, but keep it simple: ls [currentDir]
        const node = getNode(currentPath);
        if (node?.type === "dir") {
          const files = Object.keys(node.children);
          // If -la or -a, maybe add hidden?
          // We'll just list them all for now, maybe color directories
          const formatted = files.map((f) => {
            const isDir = node.children[f].type === "dir";
            return isDir ? `${f}/` : f;
          });
          if (formatted.length === 0) {
            appendLines(["(empty)"]);
          } else {
            appendLines(["  " + formatted.join("  ")]);
          }
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
            "WARNING: SYSTEM CRYTICAL OPERATION DETECTED.",
            "Deleting system32...",
            "...",
            "Just kidding. Please don't delete my portfolio.",
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
            "* 9a2b3c (HEAD -> main) feat: added interactive terminal",
            "* 8d7e6f fix: resolved coffee dependency cycle",
            "* 5g4h3i feat: graduated university",
            "* 1a2b3c init: hello world",
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
            "coffee",
            "sleep",
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
              `npm ERR! Suggestion: 'npm install coffee'`
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

  useEffect(() => {
    if (phase !== "complete") return;
    inputRef.current?.focus();
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
      onAnimationComplete={() => setPhase("typing")}
      onClick={() => inputRef.current?.focus()}
      className="bg-[#1c1c1c] text-[#f1f1f1] border border-[#3a3a3a] font-mono text-sm rounded-xl mx-auto w-full max-w-xl min-w-0 overflow-hidden flex flex-col cursor-text shadow-2xl text-left"
      style={{
        height: "360px", // Increased height slightly for better scroll space
        boxShadow: "0 20px 60px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        fontFamily: "Menlo, Monaco, 'Courier New', monospace"
      }}
    >
      {/* Window chrome */}
      <div className="relative flex items-center h-7 px-3 bg-[#3a3a3a] border-b border-[#2a2a2a] shrink-0">
        <div className="flex gap-2 absolute left-3">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
        </div>
        <div className="w-full text-center">
          <span className="text-[#999] text-xs font-semibold flex items-center justify-center gap-1.5 opacity-80">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z" /></svg>
            jake — -zsh
          </span>
        </div>
      </div>

      {/* Typing phase */}
      {phase === "typing" && (
        <div className="p-3 whitespace-pre-wrap break-words flex-1 min-w-0 overflow-auto overflow-x-hidden min-h-0 pr-2 text-xs leading-relaxed [&_.Typewriter__wrapper]:whitespace-pre-wrap [&_.Typewriter__wrapper]:break-words [&_.Typewriter__wrapper]:[overflow-wrap:anywhere] [&_.Typewriter__wrapper]:block [&_.Typewriter__cursor]:text-primary">
          <Typewriter
            options={{
              autoStart: false,
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
          <div
            ref={scrollContainerRef}
            className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] pr-2 text-xs leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
          >
            {outputText}

            {/* Input area attached to bottom of output */}
            <form
              className="flex items-center gap-2 min-w-0 pt-0" // removed border-t
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
              <span className="text-primary select-none shrink-0 text-xs font-semibold">
                {currentPath.length === 1 ? "~" : currentPath[currentPath.length - 1]} $
              </span>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
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
                placeholder=""
                className="flex-1 min-w-0 bg-transparent outline-none text-[#f1f1f1] text-xs placeholder:text-gray-500 placeholder:opacity-50"
                aria-label="Terminal input"
              />
            </form>
            {/* Dummy element to force scroll to bottom? No, scrollTop setting is better */}
            <div className="h-2"></div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
