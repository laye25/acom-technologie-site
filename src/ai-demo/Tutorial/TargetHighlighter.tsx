// src/ai-demo/Tutorial/TargetHighlighter.tsx
// Visual target overlay with pointer halo targeting data-acom-id or data-tutorial-id

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TargetHighlighterProps {
  targetAcomId: string;
  onDismiss?: () => void;
}

// Aliases mapping for bulletproof target matching
const ID_ALIASES: Record<string, string[]> = {
  'billing.quote_modal.title': ['quote_modal.title', 'billing.quote_modal.title'],
  'billing.quote_modal.section_client': ['quote_modal.section_client', 'billing.quote_modal.client_section'],
  'billing.quote_modal.field_name': ['billing.quote_modal.customer_name', 'quote_modal.field_name', 'quote_modal.customer_name'],
  'billing.quote_modal.customer_name': ['billing.quote_modal.field_name', 'quote_modal.customer_name'],
  'billing.quote_modal.field_phone': ['billing.quote_modal.customer_phone', 'quote_modal.field_phone'],
  'billing.quote_modal.customer_phone': ['billing.quote_modal.field_phone', 'quote_modal.customer_phone'],
  'billing.quote_modal.field_validity': ['billing.quote_modal.expiry_days', 'quote_modal.field_validity'],
  'billing.quote_modal.expiry_days': ['billing.quote_modal.field_validity', 'quote_modal.expiry_days'],
  'billing.quote_modal.field_address': ['billing.quote_modal.customer_address', 'quote_modal.field_address'],
  'billing.quote_modal.customer_address': ['billing.quote_modal.field_address', 'quote_modal.customer_address'],
  'billing.quote_modal.section_items': ['billing.quote_modal.articles_section', 'quote_modal.section_items'],
  'billing.quote_modal.articles_section': ['billing.quote_modal.section_items', 'quote_modal.articles_section'],
  'billing.quote_modal.btn_add_product': ['billing.quote_modal.product_select', 'quote_modal.btn_add_product'],
  'billing.quote_modal.btn_add_manual': ['quote_modal.btn_add_manual'],
  'billing.quote_modal.empty_items_zone': ['billing.quote_modal.items_empty', 'quote_modal.empty_items_zone'],
  'billing.quote_modal.btn_cancel': ['quote_modal.btn_cancel'],
  'billing.quote_modal.btn_submit': ['billing.quote_modal.submit_btn', 'quote_modal.btn_submit'],
  'billing.quote_modal.btn_close': ['billing.quote_modal.close_btn', 'quote_modal.btn_close']
};

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

    const findTargetElement = (): Element | null => {
      // 1. Direct match by data-acom-id
      let el = document.querySelector(`[data-acom-id="${targetAcomId}"]`);
      if (el) return el;

      // 2. Direct match by data-tutorial-id or id
      el = document.querySelector(`[data-tutorial-id="${targetAcomId}"]`) || document.querySelector(`#${targetAcomId}`);
      if (el) return el;

      // 3. Match through aliases
      const aliases = ID_ALIASES[targetAcomId] || [];
      for (const alias of aliases) {
        el = document.querySelector(`[data-acom-id="${alias}"]`) ||
             document.querySelector(`[data-tutorial-id="${alias}"]`) ||
             document.querySelector(`#${alias}`);
        if (el) return el;
      }

      // 4. Try stripping prefix or adding prefix
      if (targetAcomId.includes('.')) {
        const parts = targetAcomId.split('.');
        const lastPart = parts[parts.length - 1];
        el = document.querySelector(`[data-acom-id*="${lastPart}"]`);
        if (el) return el;
      }

      return null;
    };

    const updateRect = () => {
      const el = findTargetElement();

      if (el) {
        if (!scrolled) {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          } catch (e) {
            // Ignore scroll errors
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
    const interval = setInterval(updateRect, 200);
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
          className="fixed bottom-6 right-6 bg-slate-900/90 text-white border border-amber-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md z-[9999] max-w-sm flex items-center justify-between gap-3 text-xs"
        >
          <div>
            <span className="font-bold text-amber-400 block">⚠️ ÉLÉMENT NON TROUVÉ</span>
            <span className="text-slate-300">Cible : <code className="text-amber-300 font-mono">{targetAcomId}</code></span>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="text-slate-400 hover:text-white text-xs px-2 py-1">✕</button>
          )}
        </motion.div>
      )}

      {rect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: Math.max(4, rect.top - 6),
            left: Math.max(4, rect.left - 6),
            width: rect.width + 12,
            height: rect.height + 12,
            pointerEvents: 'none',
            zIndex: 9998
          }}
          className="rounded-2xl border-2 border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.35),0_0_35px_rgba(37,99,235,0.85)] animate-pulse"
        >
          {/* Subtle luminous blue inner ring */}
          <div className="absolute inset-0 rounded-2xl ring-2 ring-cyan-400/40" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

