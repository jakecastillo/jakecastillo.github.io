"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Image from "next/image";
import TerminalTyping from "@/components/TerminalTyping";
import StageManager from "@/components/StageManager";
import ActPhilosophy from "@/components/ActPhilosophy";
import ActExperience from "@/components/ActExperience";
import ActSkills from "@/components/ActSkills";
import ActContact from "@/components/ActContact";
import HeaderTypewriter from "@/components/HeaderTypewriter";

export default function Home() {
  return (
    <div className="relative w-full">
      <StageManager />
      {/* Act I: The Statement */}
      <section id="home" className="relative min-h-screen py-24 flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="z-10 w-full max-w-6xl mx-auto flex flex-col items-center gap-12"
        >
          {/* Profile & Identity */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-primary to-accent">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-background relative">
                <Image
                  src="/jake-portrait.jpeg"
                  alt="Jake Castillo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-mono tracking-[0.3em] text-accent uppercase">
                Jake Castillo
              </h2>
              <HeaderTypewriter />
            </div>
          </div>

          {/* Terminal Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="w-full max-w-2xl"
          >
            <TerminalTyping />
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-[10px] uppercase tracking-widest font-mono">Initialize Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* Act II: Philosophy */}
      <div id="about">
        <ActPhilosophy />
      </div>

      {/* Act III: Experience & Skills */}
      <div id="exp">
        <ActExperience />
      </div>
      <div id="skills">
        <ActSkills />
      </div>

      {/* Act IV: Connection */}
      <div id="contact">
        <ActContact />
      </div>
    </div>
  );
}
