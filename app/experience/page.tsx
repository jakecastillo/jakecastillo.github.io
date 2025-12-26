"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import Section from "@/components/Section";
import { resumeData } from "@/data/resume";

export default function Experience() {
  return (
    <>
      <Section className="bg-muted">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
          >
            Work Experience
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
          >
            My professional journey in software engineering and technology leadership.
          </motion.p>
        </div>
      </Section>

      <Section className="bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {resumeData.experience.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-muted/60 border border-border rounded-lg p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground mb-1">
                      {job.title}
                    </h3>
                    <p className="text-lg text-primary font-medium mb-2">
                      {job.company}
                    </p>
                  </div>
                  <div className="flex items-center text-muted-foreground mt-2 sm:mt-0">
                    <Calendar size={16} className="mr-1" />
                    <span>{job.period}</span>
                  </div>
                </div>


                <ul className="space-y-2">
                  {job.description.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-primary mr-2 mt-1">•</span>
                      <span className="text-foreground/80">{item}</span>
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
