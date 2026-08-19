'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in seconds. Use small increments (0.05–0.12) within a group. */
  delay?: number;
  /** Distance travelled on entry, in px. */
  distance?: number;
  className?: string;
  /** Render as a different element. Defaults to a div. */
  as?: 'div' | 'section' | 'li' | 'article' | 'span';
};

/**
 * Scroll-triggered entrance animation.
 *
 * Honours `prefers-reduced-motion`: when the user has asked for reduced motion
 * the content renders immediately at rest with no transform, rather than
 * animating a shorter distance. Movement is the thing they opted out of.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 16,
  className,
  as = 'div',
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0 }
        : { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </MotionTag>
  );
}
