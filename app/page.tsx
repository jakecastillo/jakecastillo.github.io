"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, Code, Briefcase, Award } from "lucide-react";
import Section from "@/components/Section";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="w-80 h-80 mx-auto relative">
                <Image
                  src="/jake-portrait.jpg"
                  alt="Jake Castillo"
                  fill
                  className="object-cover rounded-full shadow-2xl"
                  priority
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left order-1 lg:order-2"
            >
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                Hi, I'm <span className="text-indigo-600">Jake Castillo</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl">
                Software Engineer specializing in full-stack development, cloud architecture, and innovative solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link
                  href="/about"
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Learn More About Me
                </Link>
                <Link
                  href="/contact"
                  className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
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
            <ChevronDown size={32} className="mx-auto text-gray-400" />
          </motion.div>
        </div>
      </section>

      {/* Overview Section */}
      <Section className="bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What I Do
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Full-Stack Development</h3>
            <p className="text-gray-600">
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
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cloud Architecture</h3>
            <p className="text-gray-600">
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
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Problem Solving</h3>
            <p className="text-gray-600">
              Tackling complex challenges with innovative solutions and collaborative teamwork.
            </p>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
