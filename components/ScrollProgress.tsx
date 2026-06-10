"use client";

import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";

export default function ScrollProgress() {
  // Lenis already eases scroll; bind scaleX directly (no double-smoothing).
  const { scrollYProgress } = useScroll();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setIsVisible(latest > 0.01);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-primary origin-left z-[60]"
      style={{ scaleX: scrollYProgress, opacity: isVisible ? 1 : 0 }}
      transition={{ opacity: { duration: 0.2 } }}
    />
  );
}
