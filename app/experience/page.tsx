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
            className="text-4xl sm:text-5xl font-bold text-foreground mb-6 tracking-tight"
          >
            Work Experience
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            My professional journey in software engineering and technology leadership.
          </motion.p>
        </div>
      </Section>

      <Section className="bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div
              className="absolute left-4 top-0 bottom-0 w-px bg-border/70"
              aria-hidden="true"
            />
            <ol className="space-y-8" aria-label="Work experience timeline">
              {resumeData.experience.map((job, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative pl-12"
                >
                  <div
                    className="absolute left-4 top-8 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-surface"
                    aria-hidden="true"
                  />

                  <div className="bg-muted/50 border border-border/60 rounded-xl p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
                      <div>
                        <h3 className="text-2xl font-semibold text-foreground mb-1 tracking-tight">
                          {job.title}
                        </h3>
                        {job.companyUrl ? (
                          <a
                            href={job.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-lg text-primary font-medium mb-2 hover:text-primary-hover transition-colors"
                          >
                            {job.company}
                          </a>
                        ) : (
                          <p className="text-lg text-primary font-medium mb-2">
                            {job.company}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar size={16} className="mr-1" />
                        <span>{job.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {job.description.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-primary mr-2 mt-1">•</span>
                          <span className="text-foreground/80 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </Section>
    </>
  );
}
