import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { resumeData } from "@/data/resume";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Jake Castillo</h3>
            <p className="text-gray-300 mb-4">
              Software Engineer specializing in full-stack development and cloud solutions.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/experience" className="text-gray-300 hover:text-white transition-colors">
                  Experience
                </Link>
              </li>
              <li>
                <Link href="/skills" className="text-gray-300 hover:text-white transition-colors">
                  Skills
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail size={16} className="mr-2" />
                <a href={`mailto:${resumeData.email}`} className="text-gray-300 hover:text-white transition-colors">
                  {resumeData.email}
                </a>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="mr-2" />
                <span className="text-gray-300">{resumeData.phone}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2" />
                <span className="text-gray-300">{resumeData.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © {new Date().getFullYear()} Jake Castillo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}