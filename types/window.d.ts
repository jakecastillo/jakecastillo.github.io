import type { TypewriterClass } from "typewriter-effect";

declare global {
  interface Window {
    headerTypewriter?: TypewriterClass;
    terminalTypewriter?: TypewriterClass;
  }
}

export {};
