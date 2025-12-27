"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Typewriter from "typewriter-effect";
import { useRouter } from "next/navigation";
import { resumeData } from "@/data/resume";

export default function TerminalTyping() {
  const router = useRouter();
  const [phase, setPhase] = useState<"opening" | "typing" | "complete">(
    "opening",
  );

  const terminalContent = `$ whoami
Jake Castillo
$ cat fun-fact.txt
Uma Musume is one of my favorite video games
$ ls skills/
JavaScript TypeScript C C++ SQL HTML
MySQL PostgreSQL NestJS Express Node.js
Angular React Vue Prisma Next.js AI AWS
Agile DRY YAGNI
$ `;

  const bootTranscript = useMemo(
    () => terminalContent.replace(/\n\$\s*$/, ""),
    [terminalContent],
  );

  const commands = useMemo(
    () => [
      "help",
      "about",
      "skills",
      "experience",
      "contact",
      "theme dark",
      "theme light",
      "theme toggle",
      "copy email",
      "clear",
    ],
    [],
  );

  const [outputText, setOutputText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const appendLines = (lines: string[]) => {
    if (lines.length === 0) return;
    setOutputText((current) => {
      const prefix = current.length === 0 ? "" : "\n";
      return `${current}${prefix}${lines.join("\n")}`;
    });
  };

  const setTheme = (next: "light" | "dark") => {
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("theme", next);
  };

  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme;
    const resolvedCurrent =
      current === "light" || current === "dark"
        ? current
        : window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
          ? "dark"
          : "light";
    setTheme(resolvedCurrent === "dark" ? "light" : "dark");
  };

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const runCommand = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    appendLines([`$ ${trimmed}`]);

    const normalized = trimmed.toLowerCase();
    if (normalized === "help") {
      appendLines([
        "Available commands:",
        commands.map((c) => `  - ${c}`).join("\n"),
      ]);
      return;
    }

    if (normalized === "clear") {
      setOutputText(bootTranscript);
      return;
    }

    if (normalized === "about") {
      appendLines(["Opening /about ..."]);
      router.push("/about");
      return;
    }

    if (normalized === "skills") {
      appendLines(["Opening /skills ..."]);
      router.push("/skills");
      return;
    }

    if (normalized === "experience") {
      appendLines(["Opening /experience ..."]);
      router.push("/experience");
      return;
    }

    if (normalized === "contact") {
      appendLines(["Opening /contact ..."]);
      router.push("/contact");
      return;
    }

    if (normalized === "theme toggle") {
      toggleTheme();
      appendLines(["Theme toggled."]);
      return;
    }

    if (normalized === "theme dark") {
      setTheme("dark");
      appendLines(["Theme set to dark."]);
      return;
    }

    if (normalized === "theme light") {
      setTheme("light");
      appendLines(["Theme set to light."]);
      return;
    }

    if (normalized === "copy email") {
      try {
        await navigator.clipboard.writeText(resumeData.email);
        appendLines([`Copied: ${resumeData.email}`]);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = resumeData.email;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        appendLines([`Copied: ${resumeData.email}`]);
      }
      return;
    }

    appendLines([
      `Command not found: ${trimmed}`,
      "Type `help` to see available commands.",
    ]);
  };

  useEffect(() => {
    if (phase !== "complete") return;
    inputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [outputText]);

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={() => setPhase("typing")}
      onClick={() => inputRef.current?.focus()}
      className="bg-[var(--terminal-bg)] text-[var(--terminal-fg)] border border-[color:var(--terminal-border)] font-mono text-sm sm:text-base p-4 rounded-lg shadow-lg mx-auto h-[320px] w-full max-w-2xl min-w-0 overflow-hidden flex flex-col origin-left"
    >
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-[#ff5555] rounded-full mr-2"></div>
        <div className="w-3 h-3 bg-[#f1fa8c] rounded-full mr-2"></div>
        <div className="w-3 h-3 bg-[#50fa7b] rounded-full mr-2"></div>
        <span className="text-[var(--terminal-muted)] ml-2">
          Terminal - Jake Castillo
        </span>
      </div>
      {phase === "typing" ? (
        <div className="whitespace-pre-wrap break-words flex-1 min-w-0 overflow-auto overflow-x-hidden min-h-0 pr-2 [&_.Typewriter__wrapper]:whitespace-pre-wrap [&_.Typewriter__wrapper]:break-words [&_.Typewriter__wrapper]:[overflow-wrap:anywhere] [&_.Typewriter__wrapper]:block [&_.Typewriter__wrapper]:max-w-full [&_.Typewriter__cursor]:max-w-full">
          <Typewriter
            options={{
              autoStart: false,
              loop: false,
              delay: 30,
              cursor: "|",
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
      ) : null}

      {phase === "complete" ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div
            ref={scrollContainerRef}
            className="flex-1 min-w-0 overflow-auto overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-h-0 pr-2"
          >
            {outputText}
          </div>

          <form
            className="mt-2 flex items-center gap-2 min-w-0"
            onSubmit={async (e) => {
              e.preventDefault();
              const value = inputValue;
              const trimmed = value.trim();
              setInputValue("");
              setHistoryIndex(null);
              if (!trimmed) return;
              setHistory((prev) => [...prev, value]);
              await runCommand(value);
            }}
          >
            <span className="text-primary select-none shrink-0">$</span>
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
                  if (!current) {
                    appendLines([
                      "Tip: start typing, then press Tab to autocomplete.",
                    ]);
                    return;
                  }
                  const matches = commands.filter((c) =>
                    c.startsWith(current.toLowerCase()),
                  );
                  if (matches.length === 0) return;
                  if (matches.length === 1) {
                    setInputValue(matches[0]);
                    return;
                  }
                  appendLines(["", matches.join("  "), ""]);
                }
              }}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              placeholder="Type `help` and press Enter"
              className="flex-1 min-w-0 bg-transparent outline-none text-[var(--terminal-fg)] placeholder:text-[var(--terminal-muted)]"
              aria-label="Terminal input"
            />
          </form>
        </div>
      ) : null}
    </motion.div>
  );
}
