import Desktop from "@/components/desktop/Desktop";
import { resumeData } from "@/data/resume";

export default function Home() {
    return (
        <>
            {/* SEO résumé fallback — semantic HTML for crawlers, hidden from sighted users */}
            <div className="sr-only">
                <h1>{resumeData.name}</h1>
                <p>{resumeData.summary}</p>
                <p>Location: {resumeData.location}</p>
                <p>
                    Email: <a href={`mailto:${resumeData.email}`}>{resumeData.email}</a>
                </p>
                <p>
                    LinkedIn: <a href={resumeData.linkedin}>{resumeData.linkedin}</a>
                </p>

                <h2>Experience</h2>
                <ul>
                    {resumeData.experience.map((job, i) => (
                        <li key={i}>
                            <h3>
                                {job.title} — {job.company}
                            </h3>
                            <p>{job.period}</p>
                            <ul>
                                {job.description.map((d, j) => (
                                    <li key={j}>{d}</li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>

                <h2>Skills</h2>
                <ul>
                    {[...resumeData.skills.languages, ...resumeData.skills.frameworks, ...resumeData.skills.databases, ...resumeData.skills.platforms].map(
                        (s, i) => (
                            <li key={i}>{s}</li>
                        ),
                    )}
                </ul>

                <h2>Certifications</h2>
                <ul>
                    {resumeData.certifications.map((c, i) => (
                        <li key={i}>
                            {c.name} — {c.issuer} ({c.issued} – {c.expires})
                        </li>
                    ))}
                </ul>
            </div>

            <Desktop />
        </>
    );
}
