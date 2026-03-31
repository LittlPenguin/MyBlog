"use client";

import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type RevealProps = MotionProps & {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className, delay = 0, ...props }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const motionEnabled = mounted && !prefersReducedMotion;

  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, y: 18, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, margin: "-56px" } : undefined}
      transition={motionEnabled ? { duration: 0.58, ease: [0.22, 1, 0.36, 1], delay } : undefined}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
