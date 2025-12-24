"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin } from "lucide-react";
import Section from "@/components/Section";
import { resumeData } from "@/data/resume";

export default function Contact() {
  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: resumeData.email,
      href: `mailto:${resumeData.email}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: resumeData.phone,
      href: `tel:${resumeData.phone}`,
    },
    {
      icon: MapPin,
      label: "Location",
      value: resumeData.location,
      href: null,
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "Connect on LinkedIn",
      href: resumeData.linkedin,
    },
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
            Get In Touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            I&apos;m always interested in new opportunities and collaborations. Feel free to
            reach out!
          </motion.p>
        </div>
      </Section>

      <Section className="bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-6 text-center"
              >
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {info.label}
                </h3>
                {info.href ? (
                  <a
                    href={info.href}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                    target={info.label === "LinkedIn" ? "_blank" : undefined}
                    rel={info.label === "LinkedIn" ? "noopener noreferrer" : undefined}
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-gray-700">{info.value}</p>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-gray-600">
              I&apos;m currently based in {resumeData.location} and open to remote opportunities
              worldwide.
            </p>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
