"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import Section from "@/components/Section";
import { resumeData } from "@/data/resume";

export default function About() {
  return (
    <>
      <Section className="bg-gray-50">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6"
          >
            About Me
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            {resumeData.summary}
          </motion.p>
        </div>
      </Section>

      <Section className="bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={32} className="text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Education</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-lg p-8"
          >
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {resumeData.education.degree}
            </h3>
            <p className="text-lg text-gray-600 mb-2">
              {resumeData.education.institution}
            </p>
            <p className="text-gray-500">
              Graduated {resumeData.education.graduation}
            </p>
          </motion.div>
        </div>
      </Section>
    </>
  );
}