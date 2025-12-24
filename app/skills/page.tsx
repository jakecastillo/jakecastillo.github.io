"use client";

import { motion } from "framer-motion";
import { Award, Code, Database, Server, CheckCircle } from "lucide-react";
import Section from "@/components/Section";
import { resumeData } from "@/data/resume";

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
      <Section className="bg-gray-50">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6"
          >
            Skills & Certifications
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            My technical expertise and professional certifications.
          </motion.p>
        </div>
      </Section>

      <Section className="bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {skillCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-6"
              >
                <div className="flex items-center mb-4">
                  <category.icon size={24} className="text-indigo-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {category.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
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
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Certifications</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resumeData.certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {cert.name}
                    </h3>
                    <p className="text-indigo-600 font-medium">{cert.issuer}</p>
                  </div>
                  <Award size={32} className="text-indigo-600" />
                </div>
                <div className="text-sm text-gray-500">
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