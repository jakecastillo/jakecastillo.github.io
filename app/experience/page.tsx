"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import Section from "@/components/Section";
import { resumeData } from "@/data/resume";

export default function Experience() {
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
            Work Experience
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            My professional journey in software engineering and technology leadership.
          </motion.p>
        </div>
      </Section>

      <Section className="bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {resumeData.experience.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-lg text-indigo-600 font-medium mb-2">
                      {job.company}
                    </p>
                  </div>
                  <div className="flex items-center text-gray-500 mt-2 sm:mt-0">
                    <Calendar size={16} className="mr-1" />
                    <span>{job.period}</span>
                  </div>
                </div>


                <ul className="space-y-2">
                  {job.description.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-indigo-600 mr-2 mt-1">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}