import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function AIGlyph({ className, size = 'md', animated = false }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  const Component = animated ? motion.svg : 'svg';
  const animationProps = animated ? {
    animate: { rotate: [0, 5, -5, 0] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  } : {};

  return (
    <Component
      viewBox="0 0 24 24"
      fill="none"
      className={cn(sizeClasses[size], className)}
      {...animationProps}
    >
      {/* Outer hexagon */}
      <path
        d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner neural pattern */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <line x1="12" y1="10" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="14" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" />
      <line x1="14" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" />
    </Component>
  );
}