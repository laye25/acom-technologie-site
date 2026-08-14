// src/ai-demo/Tutorial/TargetHighlighter.tsx
// Dynamic Spotlight & Target Overlay for Acom IA Tutorials
// Automatically wraps target elements with exact coordinates, padding, border-radius, and smooth scrolling.

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TargetHighlighterProps {
  targetAcomId?: string;
  padding?: number;
  onDismiss?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
}

// Comprehensive dictionary of aliases for bulletproof target matching
const ID_ALIASES: Record<string, string[]> = {
  'header.logo_and_title': ['header.logo_and_title'],
  'header.module_name': ['header.module_name'],
  'header.plan_badge': ['header.plan_badge'],
  'header.theme_toggle': ['header.theme_toggle'],
  'header.notifications': ['header.notifications'],
  'header.user_profile': ['header.user_profile'],
  'header.licence_status': ['header.licence_status'],
  'header.stores_count': ['header.stores_count'],
  'header.active_saas': ['header.active_saas'],
  'header.disk_write': ['header.disk_write'],
  'dashboard.quick_access.bar': ['dashboard.quick_access.bar'],
  'dashboard.quick_access.ai_demo_btn': ['dashboard.quick_access.ai_demo_btn'],
  'dashboard.quick_access.acomzone_btn': ['dashboard.quick_access.acomzone_btn'],
  'dashboard.quick_access.desktop_btn': ['dashboard.quick_access.desktop_btn'],
  'dashboard.quick_access.docs_btn': ['dashboard.quick_access.docs_btn'],
  'dashboard.quick_access.logout_btn': ['dashboard.quick_access.logout_btn'],
  'merchant.navbar': ['merchant.navbar'],
  'nav-dashboard': ['nav-dashboard', 'nav-apercu'],
  'nav-apercu': ['nav-apercu', 'nav-dashboard'],
  'nav-tailleur_clients': ['nav-tailleur_clients', 'nav-clients'],
  'nav-tailleur_orders': ['nav-tailleur_orders', 'nav-orders'],
  'nav-tailleur_tissus': ['nav-tailleur_tissus', 'nav-tissus'],
  'nav-tailleur_boutique': ['nav-tailleur_boutique', 'nav-boutique'],
  'nav-tailleur_gallery': ['nav-tailleur_gallery', 'nav-gallery', 'nav-moodboards'],
  'nav-tailleur_artisans': ['nav-tailleur_artisans', 'nav-artisans', 'nav-equipe'],
  'nav-tailleur_mercerie': ['nav-tailleur_mercerie', 'nav-mercerie'],
  'nav-tailleur_closure': ['nav-tailleur_closure', 'nav-closure'],
  'nav-tailleur_embroidery': ['nav-tailleur_embroidery', 'nav-broderie'],
  'nav-caisse': ['nav-caisse', 'nav-pos', 'nav-commerce_pos'],
  'nav-stock': ['nav-stock', 'nav-inventory'],
  'nav-fournisseurs': ['nav-fournisseurs', 'nav-suppliers'],
  'nav-facturation': ['nav-facturation', 'nav-billing', 'nav-invoices'],
  'nav-audit': ['nav-audit'],
  'nav-compta': ['nav-compta', 'nav-accounting'],
  'nav-accounting': ['nav-accounting', 'nav-compta'],
  'nav-pressing_closure': ['nav-pressing_closure', 'nav-closure', 'nav-cash_closure'],
  'nav-reports': ['nav-reports', 'nav-rapports'],
  'nav-settings': ['nav-settings', 'nav-reglages'],
  'dashboard.briefing.card': ['dashboard.briefing.card', 'briefing_card'],
  'dashboard.sync.card': ['dashboard.sync.card', 'sync_card'],
  'dashboard.sync.actions_zone': ['dashboard.sync.actions_zone'],
  'dashboard.couture.orders_card': ['dashboard.couture.orders_card'],
  'dashboard.couture.advances_card': ['dashboard.couture.advances_card'],
  'dashboard.couture.recent_orders_card': ['dashboard.couture.recent_orders_card'],
  'dashboard.stats.total_stock_value': ['dashboard.stats.total_stock_value'],
  'dashboard.stats.total_stock_profit': ['dashboard.stats.total_stock_profit'],
  'dashboard.stats.period_select': ['dashboard.stats.period_select'],
  'dashboard.stats.revenue_card': ['dashboard.stats.revenue_card', 'dashboard.stats.pressing_revenue_card'],
  'dashboard.stats.cashflow_card': ['dashboard.stats.cashflow_card'],
  'dashboard.stats.expenses_card': ['dashboard.stats.expenses_card'],
  'dashboard.stats.net_profit_card': ['dashboard.stats.net_profit_card'],
  'dashboard.stats.sales_volume_card': ['dashboard.stats.sales_volume_card'],
  'dashboard.stats.average_basket_card': ['dashboard.stats.average_basket_card'],
  'dashboard.stats.sales_profit_card': ['dashboard.stats.sales_profit_card'],
  'dashboard.stats.stock_alerts_card': ['dashboard.stats.stock_alerts_card'],
  'dashboard.charts.performance_card': ['dashboard.charts.performance_card'],
  'dashboard.accounting.summary_card': ['dashboard.accounting.summary_card'],
  'dashboard.activity.recent_feed': ['dashboard.activity.recent_feed'],
  'dashboard.recap.general_card': ['dashboard.recap.general_card'],
  'dashboard.stock.low_stock_table': ['dashboard.stock.low_stock_table'],
  'dashboard.assistant_floating_btn': ['dashboard.assistant_floating_btn'],
  'dashboard.footer': ['dashboard.footer'],
  'pressing.cash_closure.container': ['cash_closure.container', 'pressing.cash_closure.container'],
  'pressing.cash_closure.header': ['cash_closure.header', 'pressing.cash_closure.header'],
  'pressing.cash_closure.form_card': ['cash_closure.form_card', 'pressing.cash_closure.form_card'],
  'pressing.cash_closure.validate': ['cash_closure.validate', 'pressing.cash_closure.validate'],
  'billing.quote_modal.title': ['quote_modal.title', 'billing.quote_modal.title'],
  'billing.quote_modal.section_client': ['quote_modal.section_client', 'billing.quote_modal.client_section'],
  'orders.form_modal_title': ['orders.form_modal_title', 'create_order_modal.title'],
  'orders.form_client': ['orders.form_client', 'orders.form_client_select', 'orders.client_select'],
  'orders.form_client_select': ['orders.form_client_select', 'orders.form_client', 'orders.client_select'],
  'orders.form_model': ['orders.form_model', 'orders.form_model_input', 'orders.model_input'],
  'orders.form_price': ['orders.form_price', 'orders.form_price_input', 'orders.price_input'],
  'orders.form_advance': ['orders.form_advance', 'orders.form_advance_input', 'orders.advance_input'],
  'orders.form_delivery_date': ['orders.form_delivery_date', 'orders.form_delivery_date_input', 'orders.delivery_date_input'],
  'orders.form_status': ['orders.form_status', 'orders.form_status_select', 'orders.status_select'],
  'orders.form_urgent': ['orders.form_urgent', 'orders.form_urgent_input', 'isUrgent'],
  'orders.form_later': ['orders.form_later', 'orders.form_later_input', 'isLater'],
  'orders.form_fabric_section': ['orders.form_fabric_section', 'orders.fabric_section'],
  'orders.form_fabric_select': ['orders.form_fabric_select', 'orders.fabric_select'],
  'orders.form_fabric_meters': ['orders.form_fabric_meters', 'orders.fabric_meters'],
  'orders.form_mercerie_section': ['orders.form_mercerie_section', 'orders.mercerie_section'],
  'orders.form_add_mercerie_btn': ['orders.form_add_mercerie_btn', 'orders.add_mercerie_btn'],
  'orders.form_cancel_btn': ['orders.form_cancel_btn', 'orders.cancel_btn'],
  'orders.form_submit_btn': ['orders.form_submit_btn', 'orders.submit_btn', 'orders.save_btn']
};

export const TargetHighlighter: React.FC<TargetHighlighterProps> = ({
  targetAcomId,
  padding = 8,
  onDismiss
}) => {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [notFound, setNotFound] = useState(false);
  const scrolledTargetRef = useRef<string>('');
  const animationFrameRef = useRef<number | null>(null);

  // Helper to find all DOM elements corresponding to targetAcomId or its aliases
  const findTargetElements = useCallback((targetId: string): HTMLElement[] => {
    if (!targetId) return [];

    const foundElements: HTMLElement[] = [];

    // Support comma-separated IDs (e.g. multi-element group)
    const targetKeys = targetId.split(',').map((s) => s.trim()).filter(Boolean);

    for (const key of targetKeys) {
      // 1. Direct match
      let list = Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-acom-id="${key}"], [data-tutorial-id="${key}"], #${key}`
        )
      );

      // 2. Check Aliases
      if (list.length === 0 && ID_ALIASES[key]) {
        for (const alias of ID_ALIASES[key]) {
          list = Array.from(
            document.querySelectorAll<HTMLElement>(
              `[data-acom-id="${alias}"], [data-tutorial-id="${alias}"], #${alias}`
            )
          );
          if (list.length > 0) break;
        }
      }

      // 3. Fallback partial match if nested key
      if (list.length === 0 && key.includes('.')) {
        const lastPart = key.split('.').pop();
        if (lastPart) {
          list = Array.from(
            document.querySelectorAll<HTMLElement>(`[data-acom-id*="${lastPart}"]`)
          );
        }
      }

      // Collect visible elements
      for (const el of list) {
        if (el && el.clientWidth > 0 && el.clientHeight > 0) {
          foundElements.push(el);
        }
      }
    }

    return foundElements;
  }, []);

  // Recalculate exact bounding rectangle across all matched target elements
  const updateTargetRect = useCallback(() => {
    if (!targetAcomId) {
      setRect(null);
      setNotFound(false);
      return;
    }

    const elements = findTargetElements(targetAcomId);

    if (elements.length === 0) {
      setRect(null);
      setNotFound(true);
      return;
    }

    setNotFound(false);

    // Compute unified bounding box that contains all target elements
    let minTop = Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    elements.forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.top < minTop) minTop = b.top;
      if (b.left < minLeft) minLeft = b.left;
      if (b.right > maxRight) maxRight = b.right;
      if (b.bottom > maxBottom) maxBottom = b.bottom;
    });

    // Check if valid bounding box
    if (minTop === Infinity || minLeft === Infinity || maxRight <= minLeft || maxBottom <= minTop) {
      setRect(null);
      setNotFound(true);
      return;
    }

    // Smooth scroll into view on step transition
    const primaryEl = elements[0];
    if (scrolledTargetRef.current !== targetAcomId) {
      scrolledTargetRef.current = targetAcomId;

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      // Check if target is out of view
      const isOutOfView =
        minTop < 60 ||
        minLeft < 0 ||
        maxBottom > viewportHeight - 60 ||
        maxRight > viewportWidth;

      if (isOutOfView) {
        try {
          primaryEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        } catch (e) {
          // Fallback scroll
          window.scrollTo({ top: window.scrollY + minTop - 120, behavior: 'smooth' });
        }
      }
    }

    // Calculate computed border radius of primary element
    let parsedRadius = 16; // default 16px
    try {
      const computedStyle = window.getComputedStyle(primaryEl);
      const br = computedStyle.borderRadius;
      if (br) {
        const val = parseInt(br, 10);
        if (!isNaN(val) && val > 0) {
          parsedRadius = val;
        }
      }
    } catch (e) {
      // Ignore style extraction errors
    }

    const adjustedRadius = `${Math.min(40, parsedRadius + padding / 2)}px`;

    // Apply safety padding
    const newRect: TargetRect = {
      top: Math.max(2, minTop - padding),
      left: Math.max(2, minLeft - padding),
      width: Math.min(window.innerWidth - 4, maxRight - minLeft + padding * 2),
      height: Math.min(window.innerHeight - 4, maxBottom - minTop + padding * 2),
      borderRadius: adjustedRadius
    };

    setRect((prev) => {
      if (!prev) return newRect;
      // Only update if changed by at least 0.5px to avoid unnecessary re-renders
      if (
        Math.abs(prev.top - newRect.top) < 0.5 &&
        Math.abs(prev.left - newRect.left) < 0.5 &&
        Math.abs(prev.width - newRect.width) < 0.5 &&
        Math.abs(prev.height - newRect.height) < 0.5 &&
        prev.borderRadius === newRect.borderRadius
      ) {
        return prev;
      }
      return newRect;
    });
  }, [targetAcomId, findTargetElements, padding]);

  // Handle continuous tracking and listeners
  useEffect(() => {
    // Reset scrolled flag when targetAcomId changes
    scrolledTargetRef.current = '';

    const handleLoop = () => {
      updateTargetRect();
      animationFrameRef.current = requestAnimationFrame(handleLoop);
    };

    // Initial update
    updateTargetRect();

    // Start rAF loop for smooth scrolling and position updates
    animationFrameRef.current = requestAnimationFrame(handleLoop);

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [targetAcomId, updateTargetRect]);

  if (!targetAcomId) return null;

  return (
    <AnimatePresence mode="wait">
      {notFound && (
        <motion.div
          key="not-found-badge"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bottom-6 right-6 bg-slate-900/90 text-white border border-amber-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md z-[99999] max-w-sm flex items-center justify-between gap-3 text-xs pointer-events-auto"
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
          key="target-halo"
          initial={{
            opacity: 0,
            scale: 0.98,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }}
          animate={{
            opacity: 1,
            scale: 1,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: rect.borderRadius
          }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 30,
            mass: 0.8
          }}
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 999990,
            boxShadow:
              '0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 35px rgba(59, 130, 246, 0.9), inset 0 0 20px rgba(59, 130, 246, 0.45)',
            border: '2.5px solid #3b82f6'
          }}
          className="rounded-2xl transition-colors duration-300"
        >
          {/* Glowing pulse ring */}
          <div
            className="absolute -inset-1.5 rounded-[inherit] border border-cyan-400/60 animate-pulse pointer-events-none"
            style={{
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)'
            }}
          />

          {/* Top right target star badge */}
          <div className="absolute -top-3.5 -right-3.5 w-7 h-7 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-black shadow-xl animate-bounce">
            ★
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
