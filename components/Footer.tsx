import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { resumeData } from "@/data/resume";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr_1.1fr] gap-8 md:[&>div]:max-w-xs md:[&>div]:mx-auto">
          <div>
            <h3 className="text-lg font-semibold mb-4 tracking-tight">Jake Castillo</h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Software Engineer specializing in full-stack development and cloud solutions.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 tracking-tight">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/experience" className="text-muted-foreground hover:text-foreground transition-colors">
                  Experience
                </Link>
              </li>
              <li>
                <Link href="/skills" className="text-muted-foreground hover:text-foreground transition-colors">
                  Skills
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 tracking-tight">Contact Info</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-muted-foreground" />
                <a href={`mailto:${resumeData.email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {resumeData.email}
                </a>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">{resumeData.phone}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">{resumeData.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Jake Castillo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
