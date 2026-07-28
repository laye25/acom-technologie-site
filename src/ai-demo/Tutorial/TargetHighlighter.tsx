// src/ai-demo/Tutorial/TargetHighlighter.tsx
// Visual target overlay with pointer halo targeting data-acom-id or data-tutorial-id

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TargetHighlighterProps {
  targetAcomId: string;
  onDismiss?: () => void;
}

export const TargetHighlighter: React.FC<TargetHighlighterProps> = ({
  targetAcomId,
  onDismiss
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!targetAcomId) {
      setRect(null);
      setNotFound(false);
      return;
    }

    let scrolled = false;

    const updateRect = () => {
      const el = 
        document.querySelector(`[data-acom-id="${targetAcomId}"]`) ||
        document.querySelector(`[data-tutorial-id="${targetAcomId}"]`) ||
        document.querySelector(`#${targetAcomId}`);

      if (el) {
        if (!scrolled) {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (e) {
            // Ignore scroll errors in unsupported environments
          }
          scrolled = true;
        }

        const currentRect = el.getBoundingClientRect();
        setRect(currentRect);
        setNotFound(false);

        console.log('[TUTORIAL_DIAGNOSTIC]', {
          targetAcomId,
          found: true,
          elementType: el.tagName,
          boundingRect: currentRect
        });
      } else {
        setRect(null);
        setNotFound(true);

        console.log('[TUTORIAL_DIAGNOSTIC]', {
          targetAcomId,
          found: false
        });
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 300);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [targetAcomId]);

  return (
    <AnimatePresence>
      {notFound && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 right-6 bg-slate-900/90 text-white border border-amber-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md z-50 max-w-sm flex items-center justify-between gap-3 text-xs"
        >
          <div>
            <span className="font-bold text-amber-400 block">⚠️ TARGET_NOT_FOUND</span>
            <span className="text-slate-300">Cible : <code className="text-amber-300 font-mono">{targetAcomId}</code></span>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="text-slate-400 hover:text-white text-xs px-2 py-1">✕</button>
          )}
        </motion.div>
      )}

      {rect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            pointerEvents: 'none',
            zIndex: 9998
          }}
          className="rounded-xl border-2 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.7)] animate-pulse"
        />
      )}
    </AnimatePresence>
  );
};
