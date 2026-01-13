"use client";

import { motion } from "framer-motion";
import { Award, Code, Database, Server, CheckCircle } from "lucide-react";
import { SiJavascript, SiTypescript, SiC, SiCplusplus, SiPostgresql, SiHtml5, SiMysql, SiNestjs, SiExpress, SiNodedotjs, SiAngular, SiReact, SiVuedotjs, SiPrisma, SiNextdotjs, SiOpenai, SiAmazon } from 'react-icons/si';
import type { IconType } from "react-icons";
import Section from "@/components/Section";
import { resumeData } from "@/data/resume";

const skillIcons: Record<string, IconType> = {

  'JavaScript': SiJavascript,

  'TypeScript': SiTypescript,

  'C': SiC,

  'C++': SiCplusplus,

  'SQL': SiPostgresql,

  'HTML': SiHtml5,

  'MySQL': SiMysql,

  'PostgreSQL': SiPostgresql,

  'NestJS': SiNestjs,

  'Express': SiExpress,

  'Node.js': SiNodedotjs,

  'Angular': SiAngular,

  'React': SiReact,

  'Vue': SiVuedotjs,

  'Prisma': SiPrisma,

  'Next.js': SiNextdotjs,

  'AI Agent Integration': SiOpenai,

  'AWS (infrastructure design)': SiAmazon,

};

export default function Skills() {
  const skillCategories = [
    { title: "Languages", items: resumeData.skills.languages, icon: Code },
    { title: "Databases", items: resumeData.skills.databases, icon: Database },
    { title: "Frameworks & Libraries", items: resumeData.skills.frameworks, icon: Server },
    { title: "Platforms", items: resumeData.skills.platforms, icon: Server },
    { title: "Development Practices", items: resumeData.skills.practices, icon: CheckCircle },
  ];

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
            Skills & Certifications
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            My technical expertise and professional certifications.
          </motion.p>
        </div>
      </Section>

      <Section className="bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {skillCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-muted/50 border border-border/60 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center mb-4">
                  <category.icon size={24} className="text-primary mr-3" />
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">
                    {category.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {category.items.map((item, i) => {
                    const Icon = skillIcons[item] || CheckCircle;
                    return (
                      <li key={i} className="flex items-center">
                        <Icon size={16} className="text-primary mr-2" />
                        <span className="text-foreground/80 leading-relaxed">{item}</span>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-accent" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-8 tracking-tight">Certifications</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resumeData.certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-primary/10 to-accent/5 rounded-xl p-6 border border-border/60 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1 tracking-tight">
                      {cert.name}
                    </h3>
                    <p className="text-primary font-medium">{cert.issuer}</p>
                  </div>
                  <Award size={32} className="text-primary" />
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <p>Issued: {cert.issued}</p>
                  <p>Expires: {cert.expires}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
