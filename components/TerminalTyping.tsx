"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Typewriter from "typewriter-effect";
import { resumeData } from "@/data/resume";

export default function TerminalTyping() {
  const [phase, setPhase] = useState<'opening' | 'typing' | 'complete'>('opening');

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

  useEffect(() => {
    if (phase === 'typing') {
      const typingTime = terminalContent.length * 30; // 30ms per character
      const timer = setTimeout(() => setPhase('complete'), typingTime);
      return () => clearTimeout(timer);
    }
  }, [phase, terminalContent]);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: '100%', opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={() => setPhase('typing')}
      className="bg-[#282a36] text-[#f8f8f2] font-mono text-sm sm:text-base p-4 rounded-lg shadow-lg mx-auto h-[320px] overflow-hidden"
    >
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-[#ff5555] rounded-full mr-2"></div>
        <div className="w-3 h-3 bg-[#f1fa8c] rounded-full mr-2"></div>
        <div className="w-3 h-3 bg-[#50fa7b] rounded-full mr-2"></div>
        <span className="text-[#6272a4] ml-2">Terminal - Jake Castillo</span>
      </div>
      <div className="whitespace-pre-line">
        {phase === 'complete' ? (
          <>{terminalContent}<span className="animate-pulse">|</span></>
        ) : phase === 'typing' ? (
          <Typewriter
            options={{
              strings: [terminalContent],
              autoStart: true,
              loop: false,
              delay: 30,
              cursor: "|",
            }}
          />
        ) : null}
      </div>
    </motion.div>
  );
}