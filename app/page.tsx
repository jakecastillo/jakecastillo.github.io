"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, Code, Briefcase, Award } from "lucide-react";
import Section from "@/components/Section";
import TerminalTyping from "@/components/TerminalTyping";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <div className="w-80 h-80 mx-auto relative">
                <Image
                  src="/jake-portrait.jpeg"
                  alt="Jake Castillo"
                  fill
                  className="object-cover rounded-full shadow-2xl"
                  priority
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-left order-2 lg:order-1"
            >
              <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
                Hi, I&apos;m <span className="text-primary">Jake Castillo</span>
              </h1>
              <div className="mb-8">
                <TerminalTyping />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link
                  href="/about"
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors"
                >
                  Learn More About Me
                </Link>
                <Link
                  href="/contact"
                  className="border border-primary text-primary px-8 py-3 rounded-lg font-medium hover:bg-primary/10 transition-colors"
                >
                  Get In Touch
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="animate-bounce text-center mt-16"
          >
            <ChevronDown size={32} className="mx-auto text-muted-foreground" />
          </motion.div>
        </div>
      </section>

      {/* Overview Section */}
      <Section className="bg-surface">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What I Do
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            I bring expertise in modern web development, cloud solutions, and software engineering best practices to deliver high-impact solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Full-Stack Development</h3>
            <p className="text-muted-foreground">
              Building robust applications with modern technologies like React, Node.js, and cloud platforms.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Cloud Architecture</h3>
            <p className="text-muted-foreground">
              Designing scalable, secure cloud solutions with AWS and modern infrastructure practices.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Problem Solving</h3>
            <p className="text-muted-foreground">
              Tackling complex challenges with innovative solutions and collaborative teamwork.
            </p>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
