"use client";

import { resumeData } from "@/data/resume";

export default function ActSkills() {
    return (
        <section className="py-32 px-6 md:px-12 bg-surface-elevated relative overflow-hidden">
            {/* Background Matrix/Grid effect could go here */}

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-16">
                    <h2 className="text-4xl md:text-6xl font-bold">TECHNICAL ARSENAL</h2>
                </div>

                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
                    <SkillGroup title="LANGUAGES" skills={resumeData.skills.languages} />
                    <SkillGroup title="FRAMEWORKS" skills={resumeData.skills.frameworks} />
                    <SkillGroup title="CLOUD & INFRA" skills={resumeData.skills.platforms} />
                    <SkillGroup title="DATABASES" skills={resumeData.skills.databases} />
                    <SkillGroup title="PRACTICES" skills={resumeData.skills.practices} />
                    <SkillGroup title="ROLES" skills={resumeData.skills.roles} />
                </div>

                <div className="mt-24 pt-12 border-t border-border/30">
                    <h3 className="text-sm font-mono tracking-[0.5em] text-accent mb-8">CERTIFICATIONS</h3>
                    <div className="flex flex-wrap gap-8">
                        {resumeData.certifications.map((cert, idx) => (
                            <div key={idx} className="p-6 border border-border/50 bg-background/50 backdrop-blur-sm rounded-lg hover:border-primary/50 transition-colors">
                                <h4 className="text-xl font-bold mb-2">{cert.name}</h4>
                                <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function SkillGroup({ title, skills }: { title: string, skills: string[] }) {
    return (
        <div>
            <h3 className="text-lg font-mono font-bold text-foreground mb-6 border-l-2 border-primary pl-4">{title}</h3>
            <div className="flex flex-wrap gap-3">
                {skills.map(skill => (
                    <span key={skill} className="px-3 py-1 text-sm border border-border rounded-full hover:bg-white/5 hover:border-white/20 transition-all cursor-default">
                        {skill}
                    </span>
                ))}
            </div>
        </div>
    );
}
