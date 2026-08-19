'use client';

import { motion, useReducedMotion } from 'framer-motion';

type RuleProps = {
  className?: string;
};

/**
 * A hairline that draws itself from the left on first view.
 *
 * This is the only motion on the site anyone consciously registers — it makes
 * the page feel drawn rather than faded in. Under `prefers-reduced-motion` the
 * rule is simply present from the start.
 *
 * There is deliberately no full-bleed variant. The obvious implementation —
 * `width: 100vw` with negative viewport margins — is wrong on any page that
 * scrolls, because 100vw counts the vertical scrollbar while the content box
 * does not, so every such rule overhangs by the scrollbar width and the whole
 * document gains a horizontal scrollbar. Both places that want an edge-to-edge
 * rule already render it outside the padded container, where plain `w-full`
 * reaches the edges on its own.
 */
export function Rule({ className = '' }: RuleProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`h-px overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="h-px w-full origin-left bg-border"
        initial={reduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
        }
      />
    </div>
  );
}
