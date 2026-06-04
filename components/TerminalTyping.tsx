"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";

import { resumeData } from "@/data/resume";
import { projects } from "@/data/projects";
import { BRAND } from "@/components/desktop/config/brand";

/* -------------------------------------------------------------------------- */
/*                                 FILE SYSTEM                                */
/* -------------------------------------------------------------------------- */

type FileSystemNode =
  | { type: "file"; content: string }
  | { type: "dir"; children: Record<string, FileSystemNode> };

// Build the ~/projects directory directly from the Projects app data so that
// `ls`/`cat` surface the same case studies as `open projects`.
const projectFiles: Record<string, FileSystemNode> = projects.reduce(
  (acc, project) => {
    const topOutcome = project.outcomes[0];
    const links: string[] = [];
    if (project.repoUrl) links.push(`Repo: ${project.repoUrl}`);
    if (project.liveUrl) links.push(`Live: ${project.liveUrl}`);

    const content = [
      `# ${project.title}`,
      `${project.role} · ${project.period}`,
      "",
      "Problem:",
      project.problem,
      ...(topOutcome
        ? ["", `Outcome: ${topOutcome.value} (${topOutcome.label})`]
        : []),
      ...(links.length ? ["", ...links] : []),
      "",
      "→ run 'open projects' for the full case study",
    ].join("\n");

    acc[`${project.slug}.md`] = { type: "file", content };
    return acc;
  },
  {} as Record<string, FileSystemNode>
);

const fileSystem: Record<string, FileSystemNode> = {
  "~": {
    type: "dir",
    children: {
      "projects": {
        type: "dir",
        children: projectFiles,
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
  // Keep track of where we are. Root is "~"
  const [currentPath, setCurrentPath] = useState<string[]>(["~"]);

  // Value-forward MOTD: leads with identity + the security thesis, surfaces the
  // security verbs this shell now understands, and ends on a visible hire prompt.
  // (Replaces the old video-game fun-fact transcript.) Built from an array so a
  // missing optional BRAND.availability never leaves a blank line.
  const terminalContent = useMemo(
    () =>
      [
        "$ whoami",
        `${BRAND.name} — ${BRAND.role}`,
        BRAND.whoami,
        "$ cat /etc/motd",
        "secure-by-default shell · the secure path is the fast path",
        BRAND.availability ? `availability: ${BRAND.availability}` : null,
        "try: audit · scan · privileges · help",
        "$ ls skills/",
        "TypeScript  React  Node.js  AWS  Next.js",
        "PostgreSQL  NestJS  Vue  Prisma",
        '$ # hiring? type "hire" →',
        "$ ",
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
    []
  );

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
      "audit",
      "scan",
      "privileges",
      "hire",
      "resume",
      "copy email",
      "git log",
      "npm install",
      "sudo",
      "open",
      "close",
    ],
    []
  );

  const [outputText, setOutputText] = useState(bootTranscript);
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  // The line the user was typing before they started walking back through
  // history with ArrowUp. Restored when they ArrowDown past the newest entry,
  // mirroring readline/bash behaviour so an in-progress draft is never lost.
  const [historyDraft, setHistoryDraft] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const openWindow = useDesktopStore((s) => s.open);
  const closeWindow = useDesktopStore((s) => s.close);
  // Re-fire the perimeter SEAL on deliberate secure actions (audit / hire). The
  // orb owns all reduced-motion + desktop gating, so we just stamp the trigger.
  const pulseSecure = useDesktopStore((s) => s.pulseSecure);

  // The desktop shell is aria-hidden while boot is not interactive, so the
  // input must not steal focus before then (avoids a focus-in-aria-hidden a11y
  // violation). Mirrors the `isInteractive` gate in Desktop.tsx.
  const bootPhase = useBootStore((s) => s.phase);
  const isInteractive = bootPhase === "ready" || bootPhase === "reveal";

  const APP_LIST: AppId[] = ["readme", "terminal", "about", "career", "stack", "projects", "contact"];
  const APP_ALIASES: Record<string, AppId> = {
    "readme.md": "readme",
    "about.md": "about",
    "career.app": "career",
    "stack.app": "stack",
    "contact.app": "contact",
    "projects.app": "projects",
  };

  // `scan` / `nmap localhost` presents the apps as the only "open ports" — a
  // surface-exposure map that doubles as a sitemap. Ports are arbitrary-but-
  // memorable (ssh/http/etc.) and the SERVICE column is the app id you can
  // `open`. Ordered to match the dock / least-attack-surface narrative.
  const SCAN_PORTS: { port: string; service: AppId; note: string }[] = [
    { port: "22/tcp", service: "readme", note: "start here" },
    { port: "80/tcp", service: "terminal", note: "interactive shell" },
    { port: "443/tcp", service: "about", note: "the thesis" },
    { port: "8080/tcp", service: "career", note: "audit log" },
    { port: "5432/tcp", service: "stack", note: "tooling" },
    { port: "3000/tcp", service: "projects", note: "control evidence" },
    { port: "587/tcp", service: "contact", note: "secure channel" },
  ];

  const resolveAppId = (raw: string): AppId | null => {
    const lower = raw.toLowerCase();
    if (APP_LIST.includes(lower as AppId)) return lower as AppId;
    if (APP_ALIASES[lower]) return APP_ALIASES[lower];
    return null;
  };

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

  // Copy text to the clipboard with a legacy execCommand fallback for browsers
  // that block the async Clipboard API. Shared by `copy email` and `hire`.
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        return true;
      } catch {
        return false;
      }
    }
  };

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

    // Surface dropped trailing tokens for commands that only consume a fixed
    // number of args, so input is never silently partially-ignored.
    const warnExtraArgs = (used: number) => {
      const extra = args.slice(used);
      if (extra.length > 0) {
        appendLines([`${cmd}: ignoring extra operand${extra.length > 1 ? "s" : ""}: ${extra.join(" ")}`]);
      }
    };

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
        // Use the same `~`-rooted convention as the prompt, command echo, and
        // cd/cat so the path model is consistent across every surface.
        appendLines([promptPath]);
        warnExtraArgs(1);
        break;

      case "whoami":
      case "whois":
        if (cmd === "whoami") {
          appendLines([
            `${BRAND.name} — ${BRAND.role}`,
            BRAND.whoami,
          ]);
        } else {
          appendLines([
            `Name: ${BRAND.name}`,
            `Role: ${BRAND.role}`,
            `Location: ${BRAND.location}`,
            `Status: Online`,
            `Uptime: 26 years`,
          ]);
        }
        warnExtraArgs(1);
        break;

      case "audit": {
        // Faux-honest security report. No fabricated CVEs — every line is a
        // posture statement that's actually true of this static, dependency-
        // light build. This is the load-bearing security verb.
        appendLines([
          "running SAST + dependency audit on jakeOS...",
          "  [scan] static analysis ............ done",
          "  [scan] dependency audit .......... done",
          "  [scan] secret detection .......... done",
          "",
          "  0 criticals / 0 high / 0 medium",
          "  0 hardcoded secrets",
          "  deps: clean (0 known advisories)",
          "  secure-by-default: enabled",
          "  least-privilege: enforced",
          "",
          "✓ audit passed — the secure path is the fast path",
        ]);
        // R1: a successful audit is a deliberate secure action → re-seal.
        pulseSecure();
        break;
      }

      case "nmap":
      case "scan": {
        // `scan` / `nmap localhost` maps the only exposed surface: the apps.
        // It doubles as a sitemap — every SERVICE is an id you can `open`.
        if (cmd === "nmap" && arg1 && arg1.toLowerCase() !== "localhost" && arg1.toLowerCase() !== "127.0.0.1") {
          appendLines([`nmap: ${arg1}: scanning external hosts is out of scope. Try 'nmap localhost'.`]);
          break;
        }
        const colWidth = SCAN_PORTS.reduce((w, p) => Math.max(w, p.service.length), 0);
        appendLines([
          "Starting scan against localhost (jakeOS)...",
          "PORT       STATE  SERVICE",
          ...SCAN_PORTS.map(
            (p) =>
              `${p.port.padEnd(10)} open   ${p.service.padEnd(colWidth)}  ${p.note}`,
          ),
          "",
          `${SCAN_PORTS.length} services exposed — every other port closed by default.`,
          "→ run 'open <service>' to connect",
        ]);
        break;
      }

      case "privileges":
      case "groups": {
        // Standalone least-privilege gag. Kept off whoami (which warns on extra
        // args) so it reads as its own clean security verb.
        appendLines([
          "uid=1000(jake) gid=1000(jake)",
          "effective privileges (least-privilege model):",
          "  read:resume        granted",
          "  open:contact       granted",
          "  ship:secure-code   granted",
          "  break:production   denied",
          "  access:secrets     denied",
          "→ everything else dropped at startup. exactly what's needed, nothing more.",
        ]);
        warnExtraArgs(1);
        break;
      }

      case "hire": {
        // The headline easter egg, now fully delivering: open Contact, copy the
        // email, and confirm. (`sudo hire` routes here too.)
        openWindow("contact");
        const copied = await copyToClipboard(resumeData.email);
        appendLines([
          "✓ Contact channel opened.",
          copied
            ? `✓ Email copied to clipboard: ${resumeData.email}`
            : `→ Email: ${resumeData.email}`,
          "Let's build something secure. ✦",
        ]);
        // R1: opening Contact already re-fires the perimeter SEAL via the
        // store's open()→pulseSecure(), so no explicit pulse is needed here.
        break;
      }

      case "resume": {
        // R5: programmatic download of the static résumé PDF, jakeOS-style.
        const link = document.createElement("a");
        link.href = "/resume.pdf";
        link.download = "jake-castillo-resume.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        appendLines([
          "↓ downloading resume.pdf ...",
          "✓ saved jake-castillo-resume.pdf",
        ]);
        warnExtraArgs(1);
        break;
      }

      case "ls": {
        // `ls` lists the current dir; `ls <path>` lists the target dir/file.
        // Ignore a leading flag token (e.g. `-la`) when picking the path arg.
        const pathArg = args.slice(1).find((a) => !a.startsWith("-")) ?? "";
        const resolved = pathArg
          ? resolvePath(pathArg)
          : { targetPath: currentPath, node: getNode(currentPath) };
        const targetPath = resolved.targetPath;
        const node = resolved.node;

        if (!node) {
          appendLines([`ls: ${pathArg}: No such file or directory`]);
          break;
        }
        if (node.type === "file") {
          // `ls <file>` echoes the file name, like real ls.
          appendLines([pathArg]);
          break;
        }

        const files = Object.keys(node.children);
        const formatted = files.map((f) => {
          const isDir = node.children[f].type === "dir";
          return isDir ? `${f}/` : f;
        });
        if (formatted.length === 0) {
          appendLines(["(empty)"]);
        } else {
          appendLines(["  " + formatted.join("  ")]);
        }
        // Nudge toward the full case studies when listing ~/projects.
        if (targetPath[targetPath.length - 1] === "projects") {
          appendLines(["→ run 'open projects' for the full case studies"]);
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
          warnExtraArgs(2);
        } else if (node && node.type === "file") {
          appendLines([`bash: cd: ${arg1}: Not a directory`]);
        } else {
          appendLines([`bash: cd: ${arg1}: No such file or directory`]);
        }
        break;
      }

      case "cat": {
        const targets = args.slice(1).filter((a) => !a.startsWith("-"));
        if (targets.length === 0) {
          appendLines(["Usage: cat <filename> [filename...]"]);
          return;
        }
        // Honour every file argument, concatenating output like real `cat`.
        const lines: string[] = [];
        for (const target of targets) {
          // In-world refusal: secrets never leave the vault. Match the path
          // however it's written (/etc/secrets, ~/etc/secrets, etc/secrets).
          if (/^(~\/|\/)?etc\/secrets\/?$/.test(target.toLowerCase())) {
            lines.push("cat: /etc/secrets: permission denied — secrets stay in the vault");
            continue;
          }
          const { node } = resolvePath(target);
          if (node && node.type === "file") {
            lines.push(node.content);
          } else if (node && node.type === "dir") {
            lines.push(`cat: ${target}: Is a directory`);
          } else {
            lines.push(`cat: ${target}: No such file or directory`);
          }
        }
        appendLines(lines);
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
          // Route to the full hire flow (open Contact + copy email + confirm).
          await runCommand("hire");
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

          if (allSkills.includes(pkg.toLowerCase())) {
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
          const copied = await copyToClipboard(resumeData.email);
          appendLines([
            copied
              ? `✓ Copied: ${resumeData.email}`
              : `→ Email: ${resumeData.email}`,
          ]);
        } else {
          appendLines(["Usage: copy email"]);
        }
        break;

      case "open": {
        if (!arg1) {
          appendLines(["Usage: open <app>", "Apps: readme, about, career, stack, projects, contact"]);
          return;
        }
        const id = resolveAppId(arg1);
        if (!id) {
          appendLines([`open: ${arg1}: unknown app`]);
          return;
        }
        openWindow(id);
        appendLines([`opening ${id}.app...`]);
        break;
      }

      case "close": {
        if (!arg1) {
          appendLines(["Usage: close <app>"]);
          return;
        }
        const id = resolveAppId(arg1);
        if (!id) {
          appendLines([`close: ${arg1}: unknown app`]);
          return;
        }
        closeWindow(id);
        appendLines([`closed ${id}.app`]);
        break;
      }

      default:
        appendLines([
          `✗ Command not found: ${cmd}`,
          "  Type \`help\` to see available commands",
        ]);
    }
  };

  // Focus the input so the user can type immediately — but only once the shell
  // is interactive. While boot is still running the shell is aria-hidden, and a
  // focused element inside an aria-hidden subtree is an a11y violation
  // (WCAG / axe aria-hidden-focus), so we wait for `isInteractive`.
  useEffect(() => {
    if (!isInteractive) return;
    inputRef.current?.focus();
  }, [isInteractive]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
      onClick={() => inputRef.current?.focus()}
      className="bg-[#0a0a18] text-foreground font-mono text-sm w-full h-full min-w-0 overflow-hidden flex flex-col cursor-text text-left"
    >
      {/* Interactive terminal body */}
      <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] pr-2 text-xs leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        >
          {/* Neofetch-style identity banner — mobile only, fills the void above the prompt */}
          <div
            className="md:hidden flex items-start gap-3 mb-3 select-none"
            aria-hidden="true"
          >
            {/* Compact VOID/LASER 'J' glyph (violet/cyan) — kept narrow so it never wraps */}
            <pre className="text-[10px] leading-[1.15] shrink-0 m-0 whitespace-pre">
              <span className="text-primary">{"·▄▄▄▄ ▄▄▄▄▄\n"}</span>
              <span className="text-primary">{"   ▐█    █ \n"}</span>
              <span className="text-accent">{"   ▐█    █ \n"}</span>
              <span className="text-accent">{"▐█▌▐█    █ \n"}</span>
              <span className="text-accent">{" ▀▀▘  ▀▀▀  "}</span>
            </pre>
            {/* Aligned key:value facts — short values to avoid wrapping at 360px */}
            <dl className="text-[10px] leading-[1.15] m-0 min-w-0">
              <div className="flex gap-1 min-w-0">
                <dt className="text-primary">user:</dt>
                <dd className="text-foreground/90 truncate">jake</dd>
              </div>
              <div className="flex gap-1 min-w-0">
                <dt className="text-primary">role:</dt>
                <dd className="text-foreground/90 truncate">{BRAND.role}</dd>
              </div>
              <div className="flex gap-1 min-w-0">
                <dt className="text-accent">host:</dt>
                <dd className="text-foreground/90 truncate">jakeOS</dd>
              </div>
              <div className="flex gap-1 min-w-0">
                <dt className="text-accent">loc:</dt>
                <dd className="text-foreground/90 truncate">Honolulu</dd>
              </div>
              <div className="flex gap-1 min-w-0">
                <dt className="text-accent">certs:</dt>
                <dd className="text-foreground/90 truncate">AWS SAA</dd>
              </div>
              <div className="flex gap-1 min-w-0">
                <dt className="text-accent">shell:</dt>
                <dd className="text-foreground/90 truncate">zsh</dd>
              </div>
            </dl>
          </div>

          {outputText}

          <div className="md:hidden flex gap-1 mb-2 overflow-x-auto pb-1 -mx-1 px-1">
              {["help", "ls", "whoami", "open projects", "open about", "copy email"].map((cmd) => (
                  <button
                      key={cmd}
                      type="button"
                      onClick={async () => {
                          setInputValue("");
                          if (cmd.toLowerCase() !== "clear") {
                              setHistory((prev) => [...prev, cmd]);
                          }
                          await runCommand(cmd);
                      }}
                      className="shrink-0 px-2 py-1 text-[10px] rounded border border-white/10 text-muted-foreground bg-white/5 hover:bg-white/10 transition-colors font-mono"
                  >
                      {cmd}
                  </button>
              ))}
          </div>

          {/* Input area attached to bottom of output */}
          <form
            className="flex items-center gap-2 min-w-0 pt-0" // removed border-t
            onSubmit={async (e) => {
              e.preventDefault();
              const value = inputValue;
              setInputValue("");
              setHistoryIndex(null);
              setHistoryDraft("");
              if (!value.trim()) return;
              // `clear` wipes the screen, so keeping it in recallable history
              // just makes ArrowUp re-offer a screen-clear — skip it.
              if (value.trim().toLowerCase() !== "clear") {
                setHistory((prev) => [...prev, value]);
              }
              await runCommand(value);
            }}
          >
            <span className="text-primary select-none shrink-0 text-xs font-semibold">
              {currentPath.length === 1 ? "~" : `~/${currentPath.slice(1).join("/")}`} $
            </span>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (history.length === 0) return;
                  // First step into history: stash the line being typed so
                  // ArrowDown can restore it later (readline behaviour).
                  if (historyIndex === null) {
                    setHistoryDraft(inputValue);
                  }
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
                    // Past the newest entry: restore the stashed draft instead
                    // of blanking the line.
                    setHistoryIndex(null);
                    setInputValue(historyDraft);
                    return;
                  }
                  setHistoryIndex(nextIndex);
                  setInputValue(history[nextIndex] ?? "");
                  return;
                }

                // Tab = autocomplete, but only when there is actually something
                // to complete. Otherwise (empty input, no match, or Shift+Tab)
                // let the browser move focus so the input is not a keyboard
                // trap (WCAG 2.1.2 No Keyboard Trap).
                if (e.key === "Tab" && !e.shiftKey) {
                  const current = inputValue.trimStart();
                  if (!current) return; // nothing to complete → allow focus to advance
                  const matches = availableCommands.filter((c) =>
                    c.startsWith(current.toLowerCase())
                  );
                  if (matches.length > 0 && matches[0] !== current.toLowerCase()) {
                    e.preventDefault();
                    setInputValue(matches[0]);
                  }
                  // No (further) completion → don't swallow Tab; focus advances.
                  return;
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
              className="flex-1 min-w-0 bg-transparent outline-none text-foreground text-xs placeholder:text-muted-foreground placeholder:opacity-50"
              aria-label="Terminal input"
            />
          </form>
          {/* Dummy element to force scroll to bottom? No, scrollTop setting is better */}
          <div className="h-2"></div>
        </div>
      </div>
    </motion.div>
  );
}
