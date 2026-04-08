import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Image, Transformer, Group, Path, Circle, Line, Ellipse } from 'react-konva';
import useImage from 'use-image';
import { 
  Upload, Type, Palette, Download, Trash2, Plus, Minus, Move, MousePointer2, 
  Layers, Copy, Save, Send, CheckCircle2, LayoutGrid, Shapes, Crown, 
  Wrench, FolderOpen, Sparkles, Mic, Image as ImageIcon, StickyNote, 
  Timer, Maximize2, Grid3X3, ChevronDown, Search, X, ArrowLeft,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, PaintRoller, CaseSensitive, ArrowUpDown, Scaling, Undo, Redo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useSupabaseData } from '../../hooks/useSupabase';
import { generateDesign } from '../../lib/gemini';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import DesignSelectorModal, { CATEGORIES } from './DesignSelectorModal';
import { CanvasElement, Design, Template } from '../../types';

interface CardEditorProps {
  initialTemplate?: any; // SVG string, URL, or design object
  templateId?: string;
  onExport?: (dataUrl: string) => void;
}

// --- Helper Functions for Template Hydration ---
const hydrateText = (text: string, profile?: any, contextElements?: CanvasElement[], fontSize?: number) => {
  if (!text) return text;
  
  // 1. Try to find a matching field in the current design (context)
  // Only hydrate if the template text looks like a placeholder
  const isPlaceholder = text.toUpperCase().includes('NOM') || 
                       text.toUpperCase().includes('NAME') || 
                       text.toUpperCase().includes('DIRECTEUR') ||
                       text.toUpperCase().includes('WWW.') ||
                       text.toUpperCase().includes('SITE WEB') ||
                       text.includes('@');

  if (isPlaceholder && contextElements && fontSize && fontSize > 12) {
    const matchingText = contextElements.find(el => el.type === 'text' && el.fontSize && el.fontSize > 12)?.text;
    if (matchingText && matchingText !== 'Nouveau texte') return matchingText;
  }

  // 2. Fallback to profile data for placeholders
  if (profile) {
    const upper = text.toUpperCase();
    if (upper.includes('VOTRE NOM') || upper.includes('NOM PRÉNOM') || upper.includes('YOUR NAME')) {
      return profile.displayName || profile.name || text;
    }
    if (upper.includes('DIRECTEUR') || upper.includes('POSTE') || upper.includes('JOB TITLE')) {
      return profile.jobTitle || profile.position || text;
    }
    if (upper.includes('WWW.') || upper.includes('SITE WEB')) {
      return profile.website || 'www.studioacom.fr';
    }
    if (upper.includes('EMAIL') || text.includes('@')) {
      return profile.email || text;
    }
  }

  return text;
};

const hydrateImage = (element: CanvasElement, profile?: any, contextElements?: CanvasElement[]) => {
  const src = element.src;
  if (!src) return src;

  // If the template image source looks like a logo placeholder
  const isLogoPlaceholder = src.toLowerCase().includes('logo') || 
                           src.includes('placeholder') || 
                           src.includes('picsum.photos') ||
                           src.includes('brand') ||
                           src === 'LOGO_PLACEHOLDER';

  if (isLogoPlaceholder) {
    // 1. Try to find a logo in the current design (context)
    if (contextElements) {
      const contextLogo = contextElements.find(el => 
        el.type === 'image' && 
        el.src && 
        (el.src.toLowerCase().includes('logo') || !el.src.includes('background'))
      )?.src;
      if (contextLogo) return contextLogo;
    }

    // 2. Fallback to profile logo/photo
    if (profile?.photoURL || profile?.logoUrl) {
      return profile.photoURL || profile.logoUrl;
    }
    
    // 3. Default Studio Acom logo if nothing else found
    return 'https://firebasestorage.googleapis.com/v0/b/studio-acom.appspot.com/o/assets%2Flogo-acom.png?alt=media';
  }

  return src;
};

// --- Components ---
const MiniPreview = ({ elements, bgColor, profile, contextElements }: { 
  elements: CanvasElement[], 
  bgColor: string,
  profile?: any,
  contextElements?: CanvasElement[]
}) => {
  return (
    <div 
      className="relative w-full h-full overflow-hidden pointer-events-none" 
      style={{ backgroundColor: bgColor, containerType: 'inline-size' }}
    >
      {elements.map((el) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${(el.x / 600) * 100}%`,
          top: `${(el.y / 350) * 100}%`,
          transform: `rotate(${el.rotation || 0}deg)`,
          transformOrigin: 'top left',
          opacity: el.opacity !== undefined ? el.opacity : 1,
        };

        if (el.shadowColor) {
          style.filter = `drop-shadow(${el.shadowOffsetX || 0}px ${el.shadowOffsetY || 0}px ${el.shadowBlur || 0}px ${el.shadowColor})`;
        }

        const hydratedText = el.type === 'text' ? hydrateText(el.text, profile, contextElements, el.fontSize) : '';
        const hydratedSrc = el.type === 'image' ? hydrateImage(el, profile, contextElements) : '';

        if (el.type === 'text') {
          style.color = el.fill;
          style.fontSize = `${((el.fontSize || 16) / 600) * 100}cqi`;
          style.fontWeight = 'bold';
          style.whiteSpace = 'pre-wrap';
          style.lineHeight = '1';
          if (el.fontFamily) style.fontFamily = el.fontFamily;
          if (el.align) {
            style.textAlign = el.align as React.CSSProperties['textAlign'];
          }
        } else if (el.type === 'shape' || el.type === 'circle') {
          if (el.fillLinearGradientColorStops) {
            const stops = el.fillLinearGradientColorStops;
            const cssStops = [];
            for (let i = 0; i < stops.length; i += 2) {
              cssStops.push(`${stops[i+1]} ${Number(stops[i]) * 100}%`);
            }
            style.background = `linear-gradient(to right, ${cssStops.join(', ')})`;
          } else {
            style.backgroundColor = el.fill;
          }
          style.width = el.width ? `${(el.width / 600) * 100}%` : (el.radius ? `${(el.radius * 2 / 600) * 100}%` : '10%');
          style.height = el.height ? `${(el.height / 350) * 100}%` : (el.radius ? `${(el.radius * 2 / 350) * 100}%` : '2%');
          if (el.type === 'circle') style.borderRadius = '50%';
          if (el.stroke) {
            style.border = `${(el.strokeWidth || 1) * 0.1}px solid ${el.stroke}`;
          }
        } else if (el.type === 'image') {
          style.width = `${(el.width || 100) / 600 * 100}%`;
          style.height = `${(el.height || 100) / 350 * 100}%`;
        } else if (el.type === 'path' || el.type === 'ellipse') {
          style.width = '100%';
          style.height = '100%';
          style.left = '0';
          style.top = '0';
        }

        return (
          <div key={el.id} style={style}>
            {el.type === 'text' && hydratedText}
            {el.type === 'image' && hydratedSrc && (
              <img src={hydratedSrc} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            )}
            {(el.type === 'path' || el.type === 'ellipse') && (
              <svg viewBox="0 0 600 350" className="w-full h-full overflow-visible">
                {el.fillLinearGradientColorStops && (
                  <defs>
                    <linearGradient id={`grad-preview-${el.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      {(() => {
                        const stops = [];
                        for (let i = 0; i < el.fillLinearGradientColorStops.length; i += 2) {
                          stops.push(<stop key={i} offset={`${Number(el.fillLinearGradientColorStops[i]) * 100}%`} stopColor={String(el.fillLinearGradientColorStops[i+1])} />);
                        }
                        return stops;
                      })()}
                    </linearGradient>
                  </defs>
                )}
                {el.type === 'path' ? (
                  <path 
                    d={el.data} 
                    fill={el.fillLinearGradientColorStops ? `url(#grad-preview-${el.id})` : el.fill} 
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    transform={`translate(${el.x}, ${el.y}) scale(${el.scaleX || 1}, ${el.scaleY || 1})`} 
                  />
                ) : (
                  <ellipse
                    cx={el.x}
                    cy={el.y}
                    rx={el.radiusX}
                    ry={el.radiusY}
                    fill={el.fillLinearGradientColorStops ? `url(#grad-preview-${el.id})` : el.fill}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                  />
                )}
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Helper for Image Element ---
const URLImage = ({ element, isSelected, onSelect, onChange }: { 
  element: CanvasElement; 
  isSelected: boolean; 
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
}) => {
  const [img] = useImage(element.src || '');
  const shapeRef = useRef<any>(null);

  return (
    <>
      <Image
        ref={shapeRef}
        id={element.id}
        image={img}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
    </>
  );
};

// --- Helper for Text Element ---
const EditableText = ({ element, isSelected, onSelect, onChange, onDoubleClick }: { 
  element: CanvasElement; 
  isSelected: boolean; 
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
  onDoubleClick: (e: any) => void;
}) => {
  const shapeRef = useRef<any>(null);

  return (
    <>
      <Text
        ref={shapeRef}
        id={element.id}
        text={element.text}
        x={element.x}
        y={element.y}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fontStyle={element.fontStyle}
        textDecoration={element.textDecoration}
        align={element.align}
        lineHeight={element.lineHeight}
        letterSpacing={element.letterSpacing}
        fill={element.fill}
        opacity={element.opacity}
        shadowColor={element.shadowColor}
        shadowBlur={element.shadowBlur}
        shadowOffsetX={element.shadowOffsetX}
        shadowOffsetY={element.shadowOffsetY}
        shadowOpacity={element.shadowOpacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          node.scaleX(1);
          onChange({
            x: node.x(),
            y: node.y(),
            fontSize: Math.max(1, node.fontSize() * scaleX),
          });
        }}
      />
    </>
  );
};

// --- Templates ---
const TEMPLATES = [
  {
    id: 'acom-bc-modern',
    name: 'Design Moderne',
    category: 'Papeterie & Bureautique',
    subCategory: 'Carte de Visite',
    bgColor: '#ffffff',
    elements: [
      { id: 'bg', type: 'shape', x: 0, y: 0, width: 600, height: 350, fill: '#ffffff' },
      { id: 'accent', type: 'shape', x: 0, y: 0, width: 15, height: 350, fill: '#4c1d95' },
      { id: 'logo', type: 'image', x: 40, y: 40, width: 80, height: 80, src: 'LOGO_PLACEHOLDER' },
      { id: 'company', type: 'text', x: 130, y: 65, text: 'STUDIO ACOM', fontSize: 24, fill: '#1f2937', fontWeight: 'bold', fontFamily: 'Inter' },
      { id: 'name', type: 'text', x: 40, y: 160, text: 'VOTRE NOM', fontSize: 28, fill: '#4c1d95', fontWeight: 'bold', fontFamily: 'Inter' },
      { id: 'title', type: 'text', x: 40, y: 200, text: 'VOTRE TITRE', fontSize: 14, fill: '#6b7280', fontFamily: 'Inter' },
      { id: 'line', type: 'shape', x: 40, y: 230, width: 520, height: 1, fill: '#e5e7eb' },
      { id: 'email', type: 'text', x: 40, y: 250, text: 'votre@email.com', fontSize: 12, fill: '#4b5563', fontFamily: 'Inter' },
      { id: 'phone', type: 'text', x: 40, y: 275, text: '+33 1 23 45 67 89', fontSize: 12, fill: '#4b5563', fontFamily: 'Inter' },
      { id: 'web', type: 'text', x: 40, y: 300, text: 'www.studioacom.fr', fontSize: 12, fill: '#4b5563', fontFamily: 'Inter' }
    ]
  },
  {
    id: 'acom-bc-corporate',
    name: 'Design Corporate',
    category: 'Papeterie & Bureautique',
    subCategory: 'Carte de Visite',
    bgColor: '#f8fafc',
    elements: [
      { id: 'bg', type: 'shape', x: 0, y: 0, width: 600, height: 350, fill: '#f8fafc' },
      { id: 'header', type: 'shape', x: 0, y: 0, width: 600, height: 80, fill: '#1e293b' },
      { id: 'logo', type: 'image', x: 40, y: 15, width: 50, height: 50, src: 'LOGO_PLACEHOLDER' },
      { id: 'company', type: 'text', x: 100, y: 30, text: 'STUDIO ACOM', fontSize: 20, fill: '#ffffff', fontWeight: 'bold', fontFamily: 'Inter' },
      { id: 'name', type: 'text', x: 40, y: 120, text: 'VOTRE NOM', fontSize: 32, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Inter' },
      { id: 'title', type: 'text', x: 40, y: 165, text: 'DIRECTEUR GÉNÉRAL', fontSize: 12, fill: '#64748b', fontWeight: 'bold', fontFamily: 'Inter', letterSpacing: 2 },
      { id: 'contact-bg', type: 'shape', x: 350, y: 120, width: 210, height: 180, fill: '#ffffff', radius: 12 },
      { id: 'email', type: 'text', x: 370, y: 150, text: 'contact@votreentreprise.com', fontSize: 10, fill: '#1e293b', fontFamily: 'Inter' },
      { id: 'phone', type: 'text', x: 370, y: 180, text: '+33 (0)1 23 45 67 89', fontSize: 10, fill: '#1e293b', fontFamily: 'Inter' },
      { id: 'web', type: 'text', x: 370, y: 210, text: 'www.votreentreprise.fr', fontSize: 10, fill: '#1e293b', fontFamily: 'Inter' }
    ]
  },
  {
    id: 'acom-bc-creative',
    name: 'Design Créatif',
    category: 'Papeterie & Bureautique',
    subCategory: 'Carte de Visite',
    bgColor: '#ffffff',
    elements: [
      { id: 'bg', type: 'shape', x: 0, y: 0, width: 600, height: 350, fill: '#ffffff' },
      { id: 'blob1', type: 'circle', x: 550, y: 50, radius: 120, fill: '#f43f5e', opacity: 0.2 },
      { id: 'blob2', type: 'circle', x: 50, y: 300, radius: 80, fill: '#3b82f6', opacity: 0.2 },
      { id: 'logo', type: 'image', x: 260, y: 60, width: 80, height: 80, src: 'LOGO_PLACEHOLDER' },
      { id: 'name', type: 'text', x: 0, y: 160, width: 600, text: 'VOTRE NOM', fontSize: 36, fill: '#0f172a', fontWeight: 'black', fontFamily: 'Inter', align: 'center' },
      { id: 'title', type: 'text', x: 0, y: 210, width: 600, text: 'DESIGNER CRÉATIF', fontSize: 14, fill: '#f43f5e', fontWeight: 'bold', fontFamily: 'Inter', align: 'center', letterSpacing: 4 },
      { id: 'socials', type: 'text', x: 0, y: 280, width: 600, text: '@votrepseudo | behance.net/vous', fontSize: 12, fill: '#64748b', fontFamily: 'Inter', align: 'center' }
    ]
  },
  {
    id: 'acom-flyer-vibrant',
    name: 'Design Vibrant',
    category: 'Marketing & Publicité',
    subCategory: 'Flyer A5',
    bgColor: '#4c1d95',
    elements: [
      { id: 'bg', type: 'shape', x: 0, y: 0, width: 600, height: 350, fill: '#4c1d95' },
      { id: 'circle1', type: 'circle', x: 400, y: -50, radius: 150, fill: '#6d28d9', opacity: 0.5 },
      { id: 'circle2', type: 'circle', x: 500, y: 200, radius: 100, fill: '#7c3aed', opacity: 0.3 },
      { id: 'headline', type: 'text', x: 50, y: 80, text: 'VOTRE ÉVÉNEMENT', fontSize: 48, fill: '#ffffff', fontWeight: 'bold', fontFamily: 'Inter' },
      { id: 'subline', type: 'text', x: 50, y: 150, text: 'Une expérience inoubliable', fontSize: 24, fill: '#ddd6fe', fontFamily: 'Inter' },
      { id: 'details', type: 'text', x: 50, y: 220, text: 'Date: 12 Mai 2024 | Lieu: Paris', fontSize: 18, fill: '#ffffff', fontWeight: 'bold', fontFamily: 'Inter' },
      { id: 'cta-bg', type: 'shape', x: 50, y: 270, width: 200, height: 45, fill: '#ffffff', radius: 8 },
      { id: 'cta-text', type: 'text', x: 85, y: 282, text: 'RÉSERVER MAINTENANT', fontSize: 14, fill: '#4c1d95', fontWeight: 'bold', fontFamily: 'Inter' },
      { id: 'logo', type: 'image', x: 480, y: 40, width: 80, height: 80, src: 'LOGO_PLACEHOLDER' }
    ]
  },
  {
    id: 'acom-letterhead-clean',
    name: 'Design Clean',
    category: 'Papeterie & Bureautique',
    subCategory: 'Papier En-tête A4',
    bgColor: '#ffffff',
    elements: [
      { id: 'bg', type: 'shape', x: 0, y: 0, width: 600, height: 350, fill: '#ffffff' },
      { id: 'top-bar', type: 'shape', x: 0, y: 0, width: 600, height: 5, fill: '#4c1d95' },
      { id: 'logo', type: 'image', x: 50, y: 40, width: 60, height: 60, src: 'LOGO_PLACEHOLDER' },
      { id: 'company', type: 'text', x: 120, y: 55, text: 'STUDIO ACOM', fontSize: 20, fill: '#1f2937', fontWeight: 'bold', fontFamily: 'Inter' },
      { id: 'address', type: 'text', x: 400, y: 50, text: '123 Avenue des Arts\n75001 Paris, France', fontSize: 10, fill: '#6b7280', align: 'right', fontFamily: 'Inter' },
      { id: 'line', type: 'shape', x: 50, y: 120, width: 500, height: 1, fill: '#f3f4f6' },
      { id: 'footer-line', type: 'shape', x: 50, y: 300, width: 500, height: 1, fill: '#f3f4f6' },
      { id: 'footer-text', type: 'text', x: 50, y: 315, text: 'SIRET: 123 456 789 00012 | TVA: FR 12 345678901', fontSize: 8, fill: '#9ca3af', fontFamily: 'Inter' }
    ]
  }
];

const FONTS = [
  'Inter', 'Cormorant Garamond', 'Montserrat', 'Playfair Display', 'Roboto', 'Open Sans', 'Lato'
];

export const CardEditor: React.FC<CardEditorProps> = ({ initialTemplate, templateId, onExport }) => {
  const { isAdmin, isManager, profile, user } = useAuth();
  const { data: dbTemplates, refresh: refreshTemplates } = useSupabaseData<any>({
    tableName: 'design_templates',
    order: { column: 'createdAt', direction: 'desc' },
    realtime: false,
    limit: 50
  });

  const { data: userDesigns, refresh: refreshUserDesigns } = useSupabaseData<any>({
    tableName: 'designs',
    filter: { column: 'ownerId', value: user?.id },
    skip: !user,
    realtime: true,
    limit: 50
  });

  const [itemToDelete, setItemToDelete] = useState<{ id: string, collection: string } | null>(null);

  const deleteTemplate = async (id: string, e: React.MouseEvent, collectionName: string = 'design_templates') => {
    e.stopPropagation();
    setItemToDelete({ id, collection: collectionName });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const { id, collection: collectionName } = itemToDelete;
    setItemToDelete(null);
    
    const toastId = toast.loading("Suppression...");
    try {
      const { error } = await supabase.from(collectionName).delete().eq('id', id);
      if (error) throw error;
      
      // Give Firestore a moment to propagate the deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (collectionName === 'design_templates') {
        await refreshTemplates(true); // Force refresh from server, bypassing cache
      } else {
        await refreshUserDesigns(true); // Force refresh for user designs too
      }
      
      toast.success("Design supprimé.", { id: toastId });
    } catch (error) {
      console.error("Error deleting design:", error);
      toast.error("Erreur lors de la suppression.", { id: toastId });
    }
  };

  const getTemplateData = (t: any) => {
    let design = t.design;
    if (typeof design === 'string') {
      try {
        design = JSON.parse(design);
      } catch (e) {
        design = null;
      }
    }
    
    const elements = design?.pages?.[0]?.elements || design?.elements || t.elements || [];
    const bgColor = design?.pages?.[0]?.bgColor || design?.bgColor || t.bgColor || '#ffffff';
    
    return { elements, bgColor };
  };

  const [pages, _setPages] = useState<{ elements: CanvasElement[], bgColor: string }[]>([
    { elements: TEMPLATES[0].elements as CanvasElement[], bgColor: TEMPLATES[0].bgColor },
    { elements: [], bgColor: '#ffffff' }
  ]);

  const [history, setHistory] = useState<typeof pages[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history once
  useEffect(() => {
    if (history.length === 0) {
      setHistory([pages]);
      setHistoryIndex(0);
    }
  }, []);

  const setPages = (updater: typeof pages | ((prev: typeof pages) => typeof pages)) => {
    _setPages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      
      // Update history in a separate state update to avoid stale closures
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        // Only push if the state actually changed to avoid redundant history entries
        if (JSON.stringify(newHistory[newHistory.length - 1]) === JSON.stringify(next)) {
          return prevHistory;
        }
        if (newHistory.length >= 50) newHistory.shift();
        newHistory.push(next);
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
      
      return next;
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      _setPages(history[newIndex]);
      setSelectedIds([]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      _setPages(history[newIndex]);
      setSelectedIds([]);
    }
  };

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [designTitle, setDesignTitle] = useState('Design sans titre');
  const [designId, setDesignId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    visible: false
  });
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showMargins, setShowMargins] = useState(false);
  const [showBleed, setShowBleed] = useState(false);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);

  const copySelected = () => {
    if (selectedIds.length === 0) return;
    const toCopy = elements.filter(el => selectedIds.includes(el.id));
    setClipboard(toCopy);
    toast.success(`${toCopy.length} élément(s) copié(s)`);
  };

  const pasteSelected = () => {
    if (clipboard.length === 0) return;
    
    const newIds: string[] = [];
    setElements(prev => {
      const newElements = [...prev];
      clipboard.forEach(el => {
        const newId = Math.random().toString(36).substr(2, 9);
        newIds.push(newId);
        newElements.push({
          ...el,
          id: newId,
          x: el.x + 20,
          y: el.y + 20
        });
      });
      return newElements;
    });
    setSelectedIds(newIds);
    toast.success(`${clipboard.length} élément(s) collé(s)`);
  };

  const moveSelected = (dx: number, dy: number) => {
    if (selectedIds.length === 0) return;
    setElements(prev => prev.map(el => 
      selectedIds.includes(el.id) 
        ? { ...el, x: el.x + dx, y: el.y + dy } 
        : el
    ));
  };

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;
    
    setElements(prev => {
      const newElements = [...prev];
      const newIds: string[] = [];
      selectedIds.forEach(id => {
        const el = prev.find(e => e.id === id);
        if (el) {
          const newId = Math.random().toString(36).substr(2, 9);
          newIds.push(newId);
          newElements.push({
            ...el,
            id: newId,
            x: el.x + 20,
            y: el.y + 20
          });
        }
      });
      setSelectedIds(newIds);
      return newElements;
    });
  };

  const selectAll = () => {
    setSelectedIds(elements.map(el => el.id));
  };

  const elements = pages[currentPageIndex].elements;
  const bgColor = pages[currentPageIndex].bgColor;

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;

  const setElements = (newElements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
    setPages(prev => {
      const currentElements = prev[currentPageIndex].elements;
      const nextElements = typeof newElements === 'function' ? newElements(currentElements) : newElements;
      
      // Sanitize to prevent NaN coordinates and other invalid values
      const sanitizedElements = nextElements.map(el => ({
        ...el,
        x: isFinite(el.x) ? el.x : 0,
        y: isFinite(el.y) ? el.y : 0,
        width: el.width !== undefined ? (isFinite(el.width) ? el.width : 100) : undefined,
        height: el.height !== undefined ? (isFinite(el.height) ? el.height : 100) : undefined,
        fontSize: el.fontSize !== undefined ? (isFinite(el.fontSize) ? el.fontSize : 16) : undefined,
      }));

      const nextPages = [...prev];
      nextPages[currentPageIndex] = {
        ...nextPages[currentPageIndex],
        elements: sanitizedElements
      };
      return nextPages;
    });
  };

  const setBgColor = (newColor: string) => {
    setPages(prev => {
      const nextPages = [...prev];
      nextPages[currentPageIndex] = {
        ...nextPages[currentPageIndex],
        bgColor: newColor
      };
      return nextPages;
    });
  };

  const saveDesign = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour enregistrer.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Enregistrement du design...");

    try {
      const designData = {
        name: designTitle,
        owner_id: user.id,
        elements: elements,
        bg_color: bgColor,
        updated_at: new Date().toISOString(),
      };

      if (designId) {
        const { error } = await supabase.from('designs').update(designData).eq('id', designId);
        if (error) throw error;
        toast.success("Design mis à jour !", { id: toastId });
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase.from('designs').insert({
          ...designData,
          id: newId,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        setDesignId(newId);
        toast.success("Design enregistré !", { id: toastId });
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du design:", error);
      toast.error("Erreur lors de l'enregistrement.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textAreaPos, setTextAreaPos] = useState({ x: 0, y: 0, width: 0 });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 600, height: 350 });
  const [zoom, setZoom] = useState(1);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [savedDesign, setSavedDesign] = useState<any>(null);

  // Auto-save to localStorage
  useEffect(() => {
    if (hasLoaded.current) {
      const designToSave = {
        pages,
        designTitle,
        timestamp: Date.now(),
        templateId
      };
      localStorage.setItem('studio_acom_autosave', JSON.stringify(designToSave));
    }
  }, [pages, designTitle, templateId]);

  // Check for auto-save on mount
  useEffect(() => {
    const saved = localStorage.getItem('studio_acom_autosave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only prompt if the saved design is relatively recent (e.g., last 24h) 
        // or if it's a different design than what's currently loading
        if (parsed && parsed.pages && parsed.pages[0].elements.length > 0) {
          setSavedDesign(parsed);
          // We'll show the prompt after the initial load logic runs
          setTimeout(() => setShowRestorePrompt(true), 1000);
        }
      } catch (e) {
        console.error("Error parsing autosave", e);
      }
    }
  }, []);

  const restoreDesign = () => {
    if (savedDesign) {
      setPages(savedDesign.pages);
      setDesignTitle(savedDesign.designTitle || 'Design restauré');
      setShowRestorePrompt(false);
      toast.success("Design restauré avec succès !");
    }
  };

  const discardSavedDesign = () => {
    localStorage.removeItem('studio_acom_autosave');
    setShowRestorePrompt(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        copySelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        pasteSelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!editingTextId && selectedIds.length > 0) {
          e.preventDefault();
          handleRemoveSelected();
        }
      } else if (e.key.startsWith('Arrow')) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          switch (e.key) {
            case 'ArrowLeft': moveSelected(-step, 0); break;
            case 'ArrowRight': moveSelected(step, 0); break;
            case 'ArrowUp': moveSelected(0, -step); break;
            case 'ArrowDown': moveSelected(0, step); break;
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, clipboard, editingTextId, historyIndex, history.length]);

  useEffect(() => {
    if (trRef.current && stageRef.current) {
      const nodes = selectedIds.map(id => stageRef.current.findOne('#' + id)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, elements]);

  const handlePromptImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const svgText = event.target?.result as string;
      const { parseSvgToElements } = await import('../../lib/svgParser');
      const newElements = parseSvgToElements(svgText);
      setElements([...elements, ...newElements]);
    };
    reader.readAsText(file);
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const stageScale = useMemo(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 40;
      const containerHeight = containerRef.current.offsetHeight - 40;
      const scaleX = containerWidth / 600;
      const scaleY = containerHeight / 350;
      const baseScale = Math.min(scaleX, scaleY, 1);
      return baseScale * zoom;
    }
    return zoom;
  }, [zoom, stageSize.width, isMobileSidebarOpen]);

  const loadTemplate = async (template: any) => {
    // Check if this is a variant pointing to a hardcoded template
    if (template.templateId) {
      const hardcoded = TEMPLATES.find(t => t.id === template.templateId);
      if (hardcoded) {
        // Use the hardcoded template but keep the name/subcategory from the variant if needed
        template = { ...hardcoded, name: template.name || hardcoded.name, subCategory: template.subCategory || hardcoded.subCategory };
      }
    }

    const hydrateElements = (elements: CanvasElement[]) => {
      return elements.map(el => {
        if (el.type === 'text') {
          return { ...el, text: hydrateText(el.text, profile, elements, el.fontSize) };
        }
        if (el.type === 'image') {
          return { ...el, src: hydrateImage(el, profile, elements) };
        }
        return el;
      });
    };

    if (template.templateSvg) {
      // Handle Variant from studioAcom
      try {
        const { parseSvgToElements } = await import('../../lib/svgParser');
        const newElements = parseSvgToElements(template.templateSvg);
        setPages([
          { elements: hydrateElements(newElements), bgColor: '#ffffff' },
          { elements: [], bgColor: '#ffffff' }
        ]);
        if (template.name) setDesignTitle(template.name);
        if (template.subCategory) setCurrentProductContext(template.subCategory);
      } catch (error) {
        console.error("Error parsing variant SVG:", error);
      }
    } else if (template.pages) {
      if (template.subCategory) setCurrentProductContext(template.subCategory);
      setPages(template.pages.map((p: any) => ({
        ...p,
        elements: hydrateElements(p.elements)
      })));
    } else if (template.sides) {
      if (template.subCategory) setCurrentProductContext(template.subCategory);
      setPages([
        { 
          elements: hydrateElements(template.sides.front.elements), 
          bgColor: template.sides.front.bgColor 
        },
        { 
          elements: hydrateElements(template.sides.back.elements), 
          bgColor: template.sides.back.bgColor 
        }
      ]);
    } else {
      if (template.subCategory) setCurrentProductContext(template.subCategory);
      setPages([
        { 
          elements: hydrateElements(template.elements as CanvasElement[]), 
          bgColor: template.bgColor 
        },
        { elements: [], bgColor: '#ffffff' }
      ]);
    }
    setCurrentPageIndex(0);
    setSelectedIds([]);
    setIsMobileSidebarOpen(false);
  };

  const hasLoaded = useRef(false);

  useEffect(() => {
    const loadInitial = async () => {
      if (hasLoaded.current) return;
      
      if (initialTemplate && typeof initialTemplate === 'object') {
        if (initialTemplate.id) setDesignId(initialTemplate.id);
        if (initialTemplate.name) setDesignTitle(initialTemplate.name);
        loadTemplate(initialTemplate);
        hasLoaded.current = true;
      } else if (initialTemplate && typeof initialTemplate === 'string' && initialTemplate.toLowerCase().includes('<svg')) {
        try {
          const { parseSvgToElements } = await import('../../lib/svgParser');
          const newElements = parseSvgToElements(initialTemplate);
          if (newElements.length > 0) {
            setPages([
              { elements: newElements, bgColor: '#ffffff' },
              { elements: [], bgColor: '#ffffff' }
            ]);
            hasLoaded.current = true;
          } else if (templateId) {
            // Fallback to templateId if SVG parsing yielded no elements
            const foundInDb = dbTemplates.find((t: any) => t.id === templateId);
            if (foundInDb) {
              loadTemplate(foundInDb.design || foundInDb);
              hasLoaded.current = true;
            } else {
              const foundInHardcoded = TEMPLATES.find((t: any) => t.id === templateId);
              if (foundInHardcoded) {
                loadTemplate(foundInHardcoded);
                hasLoaded.current = true;
              }
            }
          }
        } catch (error) {
          console.error("Error parsing initial SVG:", error);
          if (templateId) {
            const foundInDb = dbTemplates.find((t: any) => t.id === templateId);
            if (foundInDb) {
              loadTemplate(foundInDb.design || foundInDb);
              hasLoaded.current = true;
            } else {
              const foundInHardcoded = TEMPLATES.find((t: any) => t.id === templateId);
              if (foundInHardcoded) {
                loadTemplate(foundInHardcoded);
                hasLoaded.current = true;
              }
            }
          }
        }
      } else if (templateId) {
        const foundInDb = dbTemplates.find((t: any) => t.id === templateId);
        if (foundInDb) {
          loadTemplate(foundInDb.design || foundInDb);
          hasLoaded.current = true;
        } else {
          const foundInHardcoded = TEMPLATES.find((t: any) => t.id === templateId);
          if (foundInHardcoded) {
            loadTemplate(foundInHardcoded);
            hasLoaded.current = true;
          }
        }
      }
    };
    
    if (dbTemplates.length > 0 || !templateId) {
      loadInitial();
    }
  }, [initialTemplate, templateId, dbTemplates]);

  const [isSvgModalOpen, setIsSvgModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Fondations de Marque');
  const [templateSubCategory, setTemplateSubCategory] = useState('Logo Principal');
  const [templateSearch, setTemplateSearch] = useState('');
  const [currentProductContext, setCurrentProductContext] = useState<string | null>(null);
  const [templatePrice, setTemplatePrice] = useState('');
  const [templatePromotion, setTemplatePromotion] = useState(false);
  const [templatePromotionPercentage, setTemplatePromotionPercentage] = useState('');
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'elements' | 'text' | 'brand' | 'upload' | 'tools' | 'projects' | 'effects' | 'position' | 'spacing' | 'background' | 'options' | 'ai'>('templates');
  const [prompt, setPrompt] = useState('');
  
  const [copiedStyle, setCopiedStyle] = useState<Partial<CanvasElement> | null>(null);

  const updateSelectedElement = (newAttrs: Partial<CanvasElement>) => {
    if (selectedIds.length > 0) {
      setElements(elements.map(el => selectedIds.includes(el.id) ? { ...el, ...newAttrs } : el));
    }
  };

  const selectedElement = useMemo(() => elements.find(el => el.id === (selectedIds[0] || null)), [elements, selectedIds]);

  const bringToFront = () => {
    if (selectedIds.length > 0) {
      setElements(prev => {
        const newElements = [...prev];
        const selected = newElements.filter(el => selectedIds.includes(el.id));
        const remaining = newElements.filter(el => !selectedIds.includes(el.id));
        return [...remaining, ...selected];
      });
    }
  };

  const sendToBack = () => {
    if (selectedIds.length > 0) {
      setElements(prev => {
        const newElements = [...prev];
        const selected = newElements.filter(el => selectedIds.includes(el.id));
        const remaining = newElements.filter(el => !selectedIds.includes(el.id));
        return [...selected, ...remaining];
      });
    }
  };

  const [isPositionMenuOpen, setIsPositionMenuOpen] = useState(false);
  const [isEffectsMenuOpen, setIsEffectsMenuOpen] = useState(false);
  const [isSpacingMenuOpen, setIsSpacingMenuOpen] = useState(false);

  const sidebarTabs = [
    { id: 'templates', label: 'Modèles', icon: LayoutGrid },
    { id: 'ai', label: 'Assistant IA', icon: Sparkles },
    { id: 'elements', label: 'Éléments', icon: Shapes },
    { id: 'text', label: 'Texte', icon: Type },
    { id: 'background', label: 'Fond', icon: Palette },
    { id: 'brand', label: 'Marque', icon: Crown },
    { id: 'upload', label: 'Importer', icon: Upload },
    { id: 'tools', label: 'Outils', icon: Wrench },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
    { id: 'options', label: 'Options', icon: Wrench },
  ];

  const [svgInput, setSvgInput] = useState('');

  const TEMPLATE_CATEGORIES = [
    { name: 'Logo Principal', size: '500x500px', categoryId: 'brand' },
    { name: 'Variante de Logo', size: '400x150px', categoryId: 'brand' },
    { name: 'Favicon', size: '64x64px', categoryId: 'brand' },
    { name: 'Carte de Visite', size: '3.5x2 pouces', categoryId: 'print' },
    { name: 'Papier En-tête A4', size: '210x297mm', categoryId: 'print' },
    { name: 'Enveloppe DL', size: '220x110mm', categoryId: 'print' },
    { name: 'Flyer A5', size: '148x210mm', categoryId: 'marketing' },
    { name: 'Dépliant 3 volets', size: 'A4 ouvert', categoryId: 'marketing' },
    { name: 'Affiche événementielle', size: '40x60cm', categoryId: 'marketing' },
    { name: 'Roll-up de salon', size: '85x200cm', categoryId: 'goodies' },
    { name: 'Habillage de mug', size: '200x95mm', categoryId: 'goodies' },
    { name: 'Étiquette de produit', size: 'personnalisable', categoryId: 'goodies' },
  ];

  const STUDIO_CATEGORIES = [
    { name: 'Papeterie & Bureautique', subs: ['Carte de Visite', 'Papier En-tête A4', 'Enveloppe DL', 'Chemise à rabats'] },
    { name: 'Marketing & Publicité', subs: ['Flyer A5', 'Dépliant 3 volets', 'Affiche événementielle', 'Brochure'] },
    { name: 'Signalétique & Goodies', subs: ['Roll-up de salon', 'Habillage de mug', 'Étiquette de produit', 'Bâche'] }
  ];

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Veuillez entrer un nom pour le modèle.");
      return;
    }

    try {
      // Sanitize pages array to remove undefined values which Firestore doesn't like
      const sanitizedPages = JSON.parse(JSON.stringify(pages));
      
      console.log("Saving template:", { name: templateName, category: templateCategory, pages: sanitizedPages });
      
      const selectedCategory = TEMPLATE_CATEGORIES.find(c => c.name === templateCategory);
      
      await supabase.from('design_templates').insert({
        name: templateName,
        category: templateCategory,
        subCategory: templateSubCategory,
        price: templatePrice ? Number(templatePrice) : 0,
        promotion: templatePromotion,
        promotionPercentage: templatePromotion && templatePromotionPercentage ? Number(templatePromotionPercentage) : 0,
        categoryId: selectedCategory?.categoryId || 'print',
        pages: sanitizedPages,
        created_at: new Date().toISOString(),
        isPublic: true,
        user_id: user?.id || 'anonymous'
      });
      
      toast.success("Modèle enregistré avec succès !");
      setIsSaveModalOpen(false);
      setTemplateName('');
      setTemplateCategory('Fondations de Marque');
      setTemplateSubCategory('Logo Principal');
      setTemplatePrice('');
      setTemplatePromotion(false);
      setTemplatePromotionPercentage('');
      refreshTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erreur lors de l'enregistrement du modèle.");
    }
  };

  const handleSubmitForPrinting = async () => {
    if (!user && !contactInfo.email) {
      setIsContactModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Capture a preview of the front side
      const dataUrl = stageRef.current.toDataURL();
      
      await supabase.from('design_requests').insert({
        user_id: user?.id || null,
        user_email: user?.email || contactInfo.email,
        user_name: profile?.displayName || user?.user_metadata?.full_name || contactInfo.name || 'Client',
        user_phone: contactInfo.phone || null,
        pages: pages,
        preview_url: dataUrl,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      setIsSuccessModalOpen(true);
      setIsContactModalOpen(false);
      toast.success("Votre design a été envoyé avec succès !");
    } catch (error) {
      console.error("Error submitting design:", error);
      toast.error("Erreur lors de l'envoi du design.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseSVG = (svgString: string) => {
    const parseTransform = (transform: string | null) => {
      if (!transform) return { x: 0, y: 0, rotation: 0 };
      let x = 0, y = 0, rotation = 0;
      
      const translateMatch = transform.match(/translate\(([^, ]+)[, ]*([^)]+)?\)/);
      if (translateMatch) {
        x = parseFloat(translateMatch[1]);
        y = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
      }
      
      const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
      if (rotateMatch) {
        rotation = parseFloat(rotateMatch[1]);
      }

      const matrixMatch = transform.match(/matrix\(([^, ]+)[, ]+([^, ]+)[, ]+([^, ]+)[, ]+([^, ]+)[, ]+([^, ]+)[, ]+([^)]+)\)/);
      if (matrixMatch) {
        x = parseFloat(matrixMatch[5]);
        y = parseFloat(matrixMatch[6]);
        const a = parseFloat(matrixMatch[1]);
        const b = parseFloat(matrixMatch[2]);
        rotation = Math.atan2(b, a) * (180 / Math.PI);
      }
      
      return { x, y, rotation };
    };

    const getStyle = (el: Element, prop: string) => {
      const attr = el.getAttribute(prop);
      if (attr) return attr;
      const style = (el as HTMLElement).style;
      if (style && style.getPropertyValue(prop)) return style.getPropertyValue(prop);
      return null;
    };

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      if (!svgElement) {
        toast.error("Code SVG invalide (balise <svg> non trouvée).");
        return;
      }

      const viewBox = svgElement.getAttribute('viewBox');
      let vWidth = parseFloat(svgElement.getAttribute('width') || '0');
      let vHeight = parseFloat(svgElement.getAttribute('height') || '0');
      let vX = 0;
      let vY = 0;

      if (viewBox) {
        const parts = viewBox.split(/[ ,]+/).map(parseFloat);
        if (parts.length === 4) {
          vX = parts[0];
          vY = parts[1];
          vWidth = parts[2];
          vHeight = parts[3];
        }
      }

      if (!vWidth || !vHeight) {
        vWidth = 600;
        vHeight = 350;
      }

      const scaleX = 600 / vWidth;
      const scaleY = 350 / vHeight;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (600 - vWidth * scale) / 2;
      const offsetY = (350 - vHeight * scale) / 2;

      const newElements: CanvasElement[] = [];
      const bgColorAttr = svgElement.getAttribute('fill') || svgElement.style.backgroundColor || '#ffffff';
      if (bgColorAttr !== 'none') setBgColor(bgColorAttr);

      const processElement = (el: Element, parentTransform = { x: 0, y: 0, rotation: 0 }) => {
        const fill = getStyle(el, 'fill') || '#000000';
        const stroke = getStyle(el, 'stroke');
        const strokeWidth = parseFloat(getStyle(el, 'stroke-width') || '0');
        const opacity = parseFloat(getStyle(el, 'opacity') || '1');
        const transform = parseTransform(el.getAttribute('transform'));
        
        const totalX = parentTransform.x + transform.x;
        const totalY = parentTransform.y + transform.y;
        const totalRotation = parentTransform.rotation + transform.rotation;

        const commonProps: any = {
          fill: fill === 'none' ? undefined : fill,
          stroke: stroke === 'none' ? undefined : stroke,
          strokeWidth: strokeWidth * scale,
          opacity: opacity,
          rotation: totalRotation,
          draggable: true,
        };

        // Gradient detection
        if (fill && fill.startsWith('url(#')) {
          const gradId = fill.match(/url\(#([^)]+)\)/)?.[1];
          if (gradId) {
            const gradEl = doc.getElementById(gradId);
            if (gradEl && gradEl.tagName === 'linearGradient') {
              const stops: (number | string)[] = [];
              Array.from(gradEl.querySelectorAll('stop')).forEach(stop => {
                const offset = stop.getAttribute('offset');
                const color = stop.getAttribute('stop-color') || stop.style.stopColor || '#000000';
                const offsetNum = offset?.endsWith('%') ? parseFloat(offset) / 100 : parseFloat(offset || '0');
                stops.push(offsetNum, color);
              });
              
              if (stops.length > 0) {
                commonProps.fillLinearGradientColorStops = stops;
                const parseCoord = (val: string | null, total: number) => {
                  if (!val) return 0;
                  if (val.endsWith('%')) return (parseFloat(val) / 100) * total;
                  return parseFloat(val);
                };
                const x1 = parseCoord(gradEl.getAttribute('x1'), vWidth) * scale;
                const y1 = parseCoord(gradEl.getAttribute('y1'), vHeight) * scale;
                const x2 = parseCoord(gradEl.getAttribute('x2') || '100%', vWidth) * scale;
                const y2 = parseCoord(gradEl.getAttribute('y2'), vHeight) * scale;
                commonProps.fillLinearGradientStartPoint = { x: x1, y: y1 };
                commonProps.fillLinearGradientEndPoint = { x: x2, y: y2 };
                commonProps.fill = undefined;
              }
            }
          }
        }

        const filterAttr = getStyle(el, 'filter');
        if (filterAttr) {
          if (filterAttr.includes('drop-shadow')) {
            commonProps['shadowColor'] = '#000000';
            commonProps['shadowBlur'] = 10;
            commonProps['shadowOpacity'] = 0.5;
            commonProps['shadowOffsetX'] = 5;
            commonProps['shadowOffsetY'] = 5;
          } else {
            const filterIdMatch = filterAttr.match(/url\(#([^)]+)\)/);
            if (filterIdMatch) {
              const filterId = filterIdMatch[1];
              const filterEl = doc.getElementById(filterId);
              if (filterEl) {
                const dropShadow = filterEl.querySelector('feDropShadow');
                if (dropShadow) {
                  commonProps['shadowColor'] = dropShadow.getAttribute('flood-color') || '#000000';
                  commonProps['shadowBlur'] = parseFloat(dropShadow.getAttribute('stdDeviation') || '5') * 2;
                  commonProps['shadowOpacity'] = parseFloat(dropShadow.getAttribute('flood-opacity') || '0.5');
                  commonProps['shadowOffsetX'] = parseFloat(dropShadow.getAttribute('dx') || '2') * scale;
                  commonProps['shadowOffsetY'] = parseFloat(dropShadow.getAttribute('dy') || '2') * scale;
                }
              }
            }
          }
        }

        if (el.tagName === 'rect') {
          newElements.push({
            ...commonProps,
            id: `svg-rect-${Math.random()}`,
            type: 'shape',
            x: (parseFloat(el.getAttribute('x') || '0') + totalX - vX) * scale + offsetX,
            y: (parseFloat(el.getAttribute('y') || '0') + totalY - vY) * scale + offsetY,
            width: parseFloat(el.getAttribute('width') || '0') * scale,
            height: parseFloat(el.getAttribute('height') || '0') * scale,
          });
        } else if (el.tagName === 'text' || el.tagName === 'textPath' || el.tagName === 'tspan') {
          const fontSize = parseFloat(getStyle(el, 'font-size') || '16') * scale;
          const textAnchor = getStyle(el, 'text-anchor') || 'start';
          let align = 'left';
          if (textAnchor === 'middle') align = 'center';
          else if (textAnchor === 'end') align = 'right';

          newElements.push({
            ...commonProps,
            id: `svg-text-${Math.random()}`,
            type: 'text',
            x: (parseFloat(el.getAttribute('x') || '0') + totalX - vX) * scale + offsetX,
            y: (parseFloat(el.getAttribute('y') || '0') + totalY - vY) * scale + offsetY - (fontSize * 0.8),
            text: el.textContent || '',
            fontSize: fontSize,
            fontFamily: getStyle(el, 'font-family') || undefined,
            fill: fill === 'none' ? '#000000' : fill,
            align: align,
          });
        } else if (el.tagName === 'path') {
          newElements.push({
            ...commonProps,
            id: `svg-path-${Math.random()}`,
            type: 'path',
            x: (totalX - vX) * scale + offsetX,
            y: (totalY - vY) * scale + offsetY,
            data: el.getAttribute('d') || '',
            width: 600,
            height: 350,
          });
        } else if (el.tagName === 'circle') {
          newElements.push({
            ...commonProps,
            id: `svg-circle-${Math.random()}`,
            type: 'circle',
            x: (parseFloat(el.getAttribute('cx') || '0') + totalX - vX) * scale + offsetX,
            y: (parseFloat(el.getAttribute('cy') || '0') + totalY - vY) * scale + offsetY,
            radius: parseFloat(el.getAttribute('r') || '0') * scale,
          });
        } else if (el.tagName === 'ellipse') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const rx = parseFloat(el.getAttribute('rx') || '0');
          const ry = parseFloat(el.getAttribute('ry') || '0');
          const d = `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 ${-rx * 2},0`;
          newElements.push({
            ...commonProps,
            id: `svg-ellipse-${Math.random()}`,
            type: 'path',
            x: (totalX - vX) * scale + offsetX,
            y: (totalY - vY) * scale + offsetY,
            data: d,
          });
        } else if (el.tagName === 'polygon' || el.tagName === 'polyline') {
          const points = el.getAttribute('points') || '';
          const d = `M ${points}${el.tagName === 'polygon' ? ' Z' : ''}`;
          newElements.push({
            ...commonProps,
            id: `svg-poly-${Math.random()}`,
            type: 'path',
            x: (totalX - vX) * scale + offsetX,
            y: (totalY - vY) * scale + offsetY,
            data: d,
          });
        } else if (el.tagName === 'line') {
          const x1 = parseFloat(el.getAttribute('x1') || '0');
          const y1 = parseFloat(el.getAttribute('y1') || '0');
          const x2 = parseFloat(el.getAttribute('x2') || '0');
          const y2 = parseFloat(el.getAttribute('y2') || '0');
          newElements.push({
            ...commonProps,
            id: `svg-line-${Math.random()}`,
            type: 'path',
            x: (totalX - vX) * scale + offsetX,
            y: (totalY - vY) * scale + offsetY,
            data: `M ${x1},${y1} L ${x2},${y2}`,
          });
        } else if (el.tagName === 'image') {
          newElements.push({
            ...commonProps,
            id: `svg-image-${Math.random()}`,
            type: 'image',
            x: (parseFloat(el.getAttribute('x') || '0') + totalX - vX) * scale + offsetX,
            y: (parseFloat(el.getAttribute('y') || '0') + totalY - vY) * scale + offsetY,
            width: parseFloat(el.getAttribute('width') || '0') * scale,
            height: parseFloat(el.getAttribute('height') || '0') * scale,
            src: el.getAttribute('href') || el.getAttribute('xlink:href') || '',
          });
        } else if (el.tagName === 'g') {
          Array.from(el.children).forEach(child => processElement(child, { x: totalX, y: totalY, rotation: totalRotation }));
        } else if (el.tagName === 'use') {
          const href = el.getAttribute('href') || el.getAttribute('xlink:href');
          if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetEl = doc.getElementById(targetId);
            if (targetEl) {
              const useX = parseFloat(el.getAttribute('x') || '0');
              const useY = parseFloat(el.getAttribute('y') || '0');
              processElement(targetEl, { x: totalX + useX, y: totalY + useY, rotation: totalRotation });
            }
          }
        }
      };

      Array.from(svgElement.children).forEach(child => processElement(child));

      if (newElements.length > 0) {
        setElements(newElements);
        setSelectedIds([]);
        setIsSvgModalOpen(false);
        setSvgInput('');
        toast.success("Modèle SVG chargé avec succès !");
      } else {
        toast.error("Aucun élément compatible trouvé dans le SVG.");
      }
    } catch (error) {
      console.error("SVG Parsing error:", error);
      toast.error("Erreur lors de la lecture du SVG.");
    }
  };

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const ratio = 350 / 600; // Business card ratio
        const newWidth = Math.min(containerWidth - 40, 600);
        setStageSize({
          width: newWidth,
          height: newWidth * ratio
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleAddText = () => {
    const newId = `text-${Date.now()}`;
    const newElement: CanvasElement = {
      id: newId,
      type: 'text',
      x: stageSize.width / 2 - 50,
      y: stageSize.height / 2,
      text: 'Nouveau texte',
      fontSize: 18,
      fill: '#000000'
    };
    setElements([...elements, newElement]);
    setSelectedIds([newId]);
    setIsMobileSidebarOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newId = `img-${Date.now()}`;
      const newElement: CanvasElement = {
        id: newId,
        type: 'image',
        x: stageSize.width / 2 - 50,
        y: stageSize.height / 2 - 50,
        width: 100,
        height: 100,
        src: event.target?.result as string
      };
      setElements([...elements, newElement]);
      setSelectedIds([newId]);
      setIsMobileSidebarOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    if (stageRef.current) {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 });
      if (onExport) onExport(dataUrl);
      
      // Also trigger direct download for demo
      const link = document.createElement('a');
      link.download = 'carte-visite.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleTextDoubleClick = (e: any, id: string) => {
    const textNode = e.target;
    const stage = textNode.getStage();
    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    setEditingTextId(id);
    setTextAreaPos({
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
      width: textNode.width() * textNode.scaleX(),
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingTextId) {
      setElements(elements.map(el => 
        el.id === editingTextId ? { ...el, text: e.target.value } : el
      ));
    }
  };

  const handleRemoveSelected = () => {
    if (selectedIds.length > 0) {
      setElements(elements.filter(el => !selectedIds.includes(el.id)));
      setSelectedIds([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      {/* Top Header Bar (Canva Style) */}
      <div className="h-14 bg-black text-white flex items-center justify-between px-4 z-40 shadow-md flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/20" />
          
          {/* Undo/Redo Buttons */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Annuler (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Rétablir (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-white/20" />
          <div className="flex flex-col">
            <input 
              type="text" 
              value={designTitle}
              onChange={(e) => setDesignTitle(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-white focus:ring-0 w-40 md:w-64 placeholder:text-white/50"
              placeholder="Design sans titre"
            />
            <span className="text-[10px] text-white/70 font-medium px-3 -mt-1 hidden">Modifié il y a quelques instants</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex items-center space-x-1 bg-white/10 p-1 rounded-lg">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-white/10 rounded-md text-white"><Minus className="w-4 h-4" /></button>
            <span className="text-xs font-bold text-white min-w-[45px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-white/10 rounded-md text-white"><Plus className="w-4 h-4" /></button>
          </div>

          <button 
            onClick={() => handleExport()}
            className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg font-bold hover:bg-white/20 transition-all text-xs md:text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Exporter</span>
          </button>

          <button 
            onClick={() => {
              if (isAdmin || isManager) {
                saveDesign();
              } else {
                handleSubmitForPrinting();
              }
            }}
            disabled={isSaving || isSubmitting}
            className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-white/90 transition-all shadow-lg disabled:opacity-50 text-xs md:text-sm"
          >
            {isSaving || isSubmitting ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isAdmin || isManager ? "Sauvegarder" : "Commander"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Restore Design Prompt */}
        <AnimatePresence>
          {showRestorePrompt && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-white border border-primary/20 shadow-2xl rounded-2xl p-4 flex items-center space-x-4 min-w-[300px] md:min-w-[400px]"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Travail non sauvegardé détecté</p>
                <p className="text-xs text-gray-500">Voulez-vous restaurer votre session précédente ?</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={discardSavedDesign}
                  className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Ignorer
                </button>
                <button 
                  onClick={restoreDesign}
                  className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-all shadow-sm"
                >
                  Restaurer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar - Main Tabs (Desktop) */}
        <div className="hidden md:flex w-20 bg-white border-r border-gray-100 flex-col items-center py-4 space-y-2 z-50">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'templates') {
                  setIsDesignModalOpen(true);
                }
                setActiveTab(tab.id as any);
              }}
              className={`w-16 h-16 flex flex-col items-center justify-center rounded-xl transition-all group ${
                activeTab === tab.id 
                  ? 'text-primary bg-primary/5' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className={`w-6 h-6 mb-1 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Secondary Panel - Tab Content */}
        <div className={`${isMobileSidebarOpen ? 'flex' : 'hidden md:flex'} w-full md:w-80 absolute md:relative left-0 right-0 md:right-auto bottom-16 md:bottom-0 top-0 bg-white border-r border-gray-100 flex-col z-40 shadow-xl md:shadow-none`}>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'options' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Options Avancées</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-gray-700">Afficher la Grille</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={showRulers} onChange={(e) => setShowRulers(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-gray-700">Afficher les Règles</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={showMargins} onChange={(e) => setShowMargins(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-gray-700">Marges d'impression</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={showBleed} onChange={(e) => setShowBleed(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-gray-700">Zones de fond perdu (Bleed)</span>
                </label>
              </div>
            </div>
          )}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900">Assistant IA</h3>
              <p className="text-sm text-gray-500">Générez un design unique à partir d'une description textuelle.</p>
              
              {/* Prompt Area */}
              <div className="bg-white border-2 border-primary/20 rounded-2xl p-4 shadow-sm focus-within:border-primary transition-all">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Décrivez votre design de rêve"
                  className="w-full h-24 bg-transparent border-none outline-none resize-none text-sm font-medium placeholder:text-gray-400"
                />
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 transition-colors ${uploadedImage ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePromptImageUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (!prompt) return;
                  setIsSubmitting(true);
                  try {
                    const generatedElements = await generateDesign(prompt, uploadedImage || undefined);
                    setElements(generatedElements);
                    setUploadedImage(null); // Clear image after generation
                    setIsMobileSidebarOpen(false);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center space-x-2 hover:border-primary hover:text-primary transition-all group font-bold text-sm shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
                )}
                <span>{isSubmitting ? 'Génération...' : 'Générer le design'}</span>
              </button>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              {/* Bouton pour ouvrir le sélecteur de variantes */}
              <button 
                onClick={() => setIsDesignModalOpen(true)}
                className="w-full py-4 bg-primary text-white rounded-xl font-black hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-3 group mb-2"
              >
                <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Explorer les Variantes</span>
              </button>

              <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={templateSearch}
          onChange={(e) => setTemplateSearch(e.target.value)}
          placeholder="Rechercher des modèles..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      </div>

      {(isAdmin || isManager) && (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center space-x-2 hover:border-primary hover:text-primary transition-all group font-bold text-sm shadow-sm"
        >
          <LayoutGrid className="w-4 h-4 text-gray-400 group-hover:text-primary" />
          <span>Importer modèle SVG</span>
        </button>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleSvgUpload} 
        className="hidden" 
        accept=".svg" 
      />
      
      {/* Categories Pills */}
      <div className="flex overflow-x-auto custom-scrollbar pb-1 space-x-2">
        <button
          onClick={() => setTemplateCategory('')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
            !templateCategory ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        {STUDIO_CATEGORIES.map(c => (
          <button
            key={c.name}
            onClick={() => setTemplateCategory(c.name)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              templateCategory === c.name ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {currentProductContext && (
        <div className="px-1 py-1 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Variantes pour {currentProductContext}
          </h3>
          <button 
            onClick={() => setCurrentProductContext(null)}
            className="text-[9px] font-bold text-gray-400 hover:text-primary transition-colors uppercase"
          >
            Voir tout
          </button>
        </div>
      )}

      {/* Template Grid (Masonry Style) */}
      <div className="columns-2 gap-2 space-y-2">
        {[...TEMPLATES, ...(dbTemplates || [])]
          .filter((t: any) => !templateCategory || t.category === templateCategory)
          .filter((t: any) => !currentProductContext || t.subCategory === currentProductContext)
          .filter((t: any) => !templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase()))
          .map((t: any) => {
            const { elements: tElements, bgColor: tBgColor } = getTemplateData(t);
            return (
              <div key={t.id} className="relative group cursor-pointer break-inside-avoid mb-2" onClick={() => { loadTemplate(t.design || t); setIsMobileSidebarOpen(false); }}>
                <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-primary transition-all relative shadow-sm">
                  <div className="aspect-[4/3] w-full relative">
                    {t.preview ? (
                      <img src={t.preview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0">
                        <MiniPreview 
                          elements={tElements} 
                          bgColor={tBgColor}
                          profile={profile}
                          contextElements={elements}
                        />
                      </div>
                    )}
                    {TEMPLATES.some(ot => ot.id === t.id) && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/90 text-white text-[10px] font-bold rounded-full shadow-sm backdrop-blur-sm z-10">
                        Officiel
                      </div>
                    )}
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-[10px] font-bold text-white truncate drop-shadow-md">{t.name}</p>
                    {t.category && (
                      <p className="text-[8px] text-white/80 font-medium">{t.category}</p>
                    )}
                  </div>
                </div>
                {(isAdmin || isManager) && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(t.id, e);
                    }} 
                    className="absolute top-1 right-1 p-1.5 bg-white/90 rounded-full text-gray-500 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
          )}
          
          {activeTab === 'elements' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Éléments</h3>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => {
                    setIsSvgModalOpen(true);
                    setIsMobileSidebarOpen(false);
                  }} 
                  className="aspect-square bg-gray-50 rounded-xl flex flex-col items-center justify-center hover:bg-primary/5 transition-colors"
                >
                  <Shapes className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[10px] font-bold">SVG</span>
                </button>
                <button className="aspect-square bg-gray-50 rounded-xl flex flex-col items-center justify-center hover:bg-primary/5 transition-colors">
                  <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[10px] font-bold">Photos</span>
                </button>
                <button className="aspect-square bg-gray-50 rounded-xl flex flex-col items-center justify-center hover:bg-primary/5 transition-colors">
                  <StickyNote className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[10px] font-bold">Stickers</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Texte</h3>
              <button 
                onClick={handleAddText}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter une zone de texte</span>
              </button>
              <div className="grid grid-cols-1 gap-2 pt-4">
                <button onClick={handleAddText} className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors">
                  <p className="text-xl font-black">Ajouter un titre</p>
                </button>
                <button onClick={handleAddText} className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors">
                  <p className="text-lg font-bold">Ajouter un sous-titre</p>
                </button>
                <button onClick={handleAddText} className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors">
                  <p className="text-sm">Ajouter un corps de texte</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Importer</h3>
              <label className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary mb-2" />
                <span className="text-sm font-bold text-gray-500 group-hover:text-primary">Importer des fichiers</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          )}

          {activeTab === 'background' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900">Arrière-plan</h3>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Couleur de fond</h4>
                <div className="grid grid-cols-5 gap-2">
                  {['#ffffff', '#000000', '#f3f4f6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setBgColor(color);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${bgColor === color ? 'border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-600">Couleur personnalisée</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'brand' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900">Ma Marque</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Logos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200 hover:border-primary transition-all">
                      <Plus className="w-6 h-6 text-gray-300" />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Couleurs</h4>
                  <div className="flex flex-wrap gap-2">
                    {['#7c3aed', '#000000', '#ffffff', '#f3f4f6'].map(c => (
                      <button 
                        key={c} 
                        onClick={() => {
                          setBgColor(c);
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" 
                        style={{ backgroundColor: c }} 
                      />
                    ))}
                    <button className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Outils</h3>
              <div className="grid grid-cols-1 gap-2">
                <button className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Amélioration Magique</p>
                    <p className="text-[10px] text-gray-500">Optimisez votre design avec l'IA</p>
                  </div>
                </button>
                <button className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Nettoyage d'image</p>
                    <p className="text-[10px] text-gray-500">Supprimez les arrière-plans</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Projets</h3>
              <div className="grid grid-cols-1 gap-3">
                {/* User Designs */}
                {userDesigns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mes Créations</h4>
                    {userDesigns.map((t: any) => {
                      const { elements: tElements, bgColor: tBgColor } = getTemplateData(t);
                      return (
                        <div
                          key={t.id}
                          onClick={() => loadTemplate(t)}
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary transition-all flex items-center space-x-3 cursor-pointer group"
                        >
                          <div className="w-12 h-8 rounded bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <MiniPreview 
                              elements={tElements} 
                              bgColor={tBgColor} 
                              profile={profile}
                              contextElements={elements}
                            />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{t.name}</p>
                            <p className="text-[9px] text-gray-400">Design personnel</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(t.id, e, 'designs');
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Templates */}
                {dbTemplates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modèles & Variantes</h4>
                    {dbTemplates.map((t: any) => {
                      const { elements: tElements, bgColor: tBgColor } = getTemplateData(t);
                      return (
                        <div
                          key={t.id}
                          onClick={() => loadTemplate(t)}
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary transition-all flex items-center space-x-3 cursor-pointer group"
                        >
                          <div className="w-12 h-8 rounded bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <MiniPreview 
                              elements={tElements} 
                              bgColor={tBgColor} 
                              profile={profile}
                              contextElements={elements}
                            />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{t.name}</p>
                            <p className="text-[9px] text-primary font-medium truncate">{t.category || 'Carte de visite'}</p>
                          </div>
                          {(isAdmin || isManager || t.userId === user?.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTemplate(t.id, e, 'design_templates');
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {userDesigns.length === 0 && dbTemplates.length === 0 && (
                  <div className="py-12 text-center">
                    <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-gray-400">Aucun projet enregistré</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'effects' && selectedElement && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Effets</h3>
                <button onClick={() => setActiveTab('templates')} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Ombre</h4>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-2xl">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">Intensité</span>
                        <span className="text-xs font-mono text-gray-400">{selectedElement.shadowBlur || 0}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        value={selectedElement.shadowBlur || 0}
                        onChange={(e) => updateSelectedElement({ 
                          shadowBlur: parseInt(e.target.value),
                          shadowColor: '#000000',
                          shadowOpacity: 0.3,
                          shadowOffsetX: 4,
                          shadowOffsetY: 4
                        })}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">Décalage X</span>
                        <span className="text-xs font-mono text-gray-400">{selectedElement.shadowOffsetX || 0}</span>
                      </div>
                      <input 
                        type="range" 
                        min="-20" 
                        max="20" 
                        value={selectedElement.shadowOffsetX || 0}
                        onChange={(e) => updateSelectedElement({ shadowOffsetX: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">Décalage Y</span>
                        <span className="text-xs font-mono text-gray-400">{selectedElement.shadowOffsetY || 0}</span>
                      </div>
                      <input 
                        type="range" 
                        min="-20" 
                        max="20" 
                        value={selectedElement.shadowOffsetY || 0}
                        onChange={(e) => updateSelectedElement({ shadowOffsetY: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <button 
                      onClick={() => updateSelectedElement({ shadowBlur: 0, shadowOpacity: 0, shadowOffsetX: 0, shadowOffsetY: 0 })}
                      className="w-full py-2 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                    >
                      Réinitialiser l'ombre
                    </button>
                  </div>
                </div>

                {/* Opacity */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Transparence</h4>
                  <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Opacité</span>
                      <span className="text-xs font-mono text-gray-400">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={selectedElement.opacity ?? 1}
                      onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'position' && selectedElement && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Position</h3>
                <button onClick={() => setActiveTab('templates')} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Calques</h4>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={bringToFront}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold">Avancer au premier plan</span>
                    </div>
                  </button>
                  <button 
                    onClick={sendToBack}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                        <Minus className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold">Reculer à l'arrière-plan</span>
                    </div>
                  </button>
                </div>

                <div className="pt-4 space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Aligner sur la page</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => updateSelectedElement({ x: 0 })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Gauche
                    </button>
                    <button 
                      onClick={() => updateSelectedElement({ x: (600 - (selectedElement.width || 100)) / 2 })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Centre
                    </button>
                    <button 
                      onClick={() => updateSelectedElement({ x: 600 - (selectedElement.width || 100) })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Droite
                    </button>
                    <button 
                      onClick={() => updateSelectedElement({ y: 0 })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Haut
                    </button>
                    <button 
                      onClick={() => updateSelectedElement({ y: (350 - (selectedElement.height || 50)) / 2 })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Milieu
                    </button>
                    <button 
                      onClick={() => updateSelectedElement({ y: 350 - (selectedElement.height || 50) })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Bas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spacing' && selectedElement && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Espacement</h3>
                <button onClick={() => setActiveTab('templates')} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="space-y-6 bg-gray-50 p-4 rounded-2xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">Espacement des lettres</span>
                    <span className="text-xs font-mono text-gray-400">{selectedElement.letterSpacing || 0}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-10" 
                    max="50" 
                    value={selectedElement.letterSpacing || 0}
                    onChange={(e) => updateSelectedElement({ letterSpacing: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">Interligne</span>
                    <span className="text-xs font-mono text-gray-400">{(selectedElement.lineHeight || 1).toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.1"
                    value={selectedElement.lineHeight || 1}
                    onChange={(e) => updateSelectedElement({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'background' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Arrière-plan</h3>
                <button onClick={() => setActiveTab('templates')} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Couleur personnalisée</h4>
                  <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-2xl">
                    <div className="relative w-12 h-12 rounded-xl border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                      <input 
                        type="color" 
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={bgColor.toUpperCase()}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm font-mono font-bold text-gray-600 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Couleurs suggérées</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {['#ffffff', '#000000', '#f3f4f6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899'].map(color => (
                      <button
                        key={color}
                        onClick={() => setBgColor(color)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${bgColor === color ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] relative overflow-hidden">
        {/* Floating Formatting Toolbar (Canva Style) */}
        <div className="h-14 flex items-center justify-center px-4 md:px-6 z-30 overflow-visible relative mt-2">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-screen-2xl bg-white rounded-xl shadow-2xl border border-gray-100 h-12 flex items-center px-4 overflow-visible justify-between"
          >
            <div className="flex items-center space-x-2 mr-4">
              <button 
                onClick={undo} 
                disabled={historyIndex === 0} 
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                title="Annuler"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button 
                onClick={redo} 
                disabled={historyIndex === history.length - 1} 
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                title="Rétablir"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-2 -mb-2 w-full justify-start lg:justify-center">
              {/* Contextual Tools */}
              {selectedElement ? (
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {/* General Color Picker */}
                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded-lg flex flex-col items-center">
                      <span className="text-xs font-black leading-none">C</span>
                      <div className="w-4 h-1 mt-0.5 rounded-full" style={{ backgroundColor: selectedElement.fill || '#000000' }} />
                      <input 
                        type="color" 
                        value={selectedElement.fill || '#000000'}
                        onChange={(e) => updateSelectedElement({ fill: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </button>
                  </div>
                  <div className="h-6 w-px bg-gray-200" />

                  {selectedElement?.type === 'text' && (
                    <>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                      {/* Font Family */}
                      <div className="relative">
                        <select 
                          value={selectedElement.fontFamily || 'Inter'}
                          onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                          className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold pr-6 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer w-24 truncate"
                        >
                          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Font Size */}
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-1">
                        <button 
                          onClick={() => updateSelectedElement({ fontSize: Math.max(1, (selectedElement.fontSize || 16) - 1) })}
                          className="p-1 hover:bg-gray-200 rounded text-gray-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input 
                          type="number" 
                          value={Math.round(selectedElement.fontSize || 16)}
                          onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) || 1 })}
                          className="w-8 bg-transparent text-center text-xs font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button 
                          onClick={() => updateSelectedElement({ fontSize: (selectedElement.fontSize || 16) + 1 })}
                          className="p-1 hover:bg-gray-200 rounded text-gray-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="h-6 w-px bg-gray-200" />

                      {/* Style Toggles */}
                      <div className="flex items-center bg-gray-50 rounded-lg p-0.5 space-x-0.5">
                        <button 
                          onClick={() => {
                            const isBold = selectedElement.fontStyle?.includes('bold');
                            const newStyle = isBold 
                              ? selectedElement.fontStyle?.replace('bold', '').trim() || 'normal'
                              : `${selectedElement.fontStyle || ''} bold`.trim();
                            updateSelectedElement({ fontStyle: newStyle });
                          }}
                          className={`p-1.5 rounded-md transition-all ${selectedElement.fontStyle?.includes('bold') ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const isItalic = selectedElement.fontStyle?.includes('italic');
                            const newStyle = isItalic 
                              ? selectedElement.fontStyle?.replace('italic', '').trim() || 'normal'
                              : `${selectedElement.fontStyle || ''} italic`.trim();
                            updateSelectedElement({ fontStyle: newStyle });
                          }}
                          className={`p-1.5 rounded-md transition-all ${selectedElement.fontStyle?.includes('italic') ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const isUnderline = selectedElement.textDecoration === 'underline';
                            updateSelectedElement({ textDecoration: isUnderline ? 'none' : 'underline' });
                          }}
                          className={`p-1.5 rounded-md transition-all ${selectedElement.textDecoration === 'underline' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Alignment */}
                      <div className="flex items-center bg-gray-50 rounded-lg p-0.5 space-x-0.5">
                        <button 
                          onClick={() => updateSelectedElement({ align: 'left' })}
                          className={`p-1.5 rounded-md transition-all ${selectedElement.align === 'left' || !selectedElement.align ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          title="Aligner à gauche"
                        >
                          <AlignLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => updateSelectedElement({ align: 'center' })}
                          className={`p-1.5 rounded-md transition-all ${selectedElement.align === 'center' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          title="Aligner au centre"
                        >
                          <AlignCenter className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => updateSelectedElement({ align: 'right' })}
                          className={`p-1.5 rounded-md transition-all ${selectedElement.align === 'right' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          title="Aligner à droite"
                        >
                          <AlignRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Uppercase Toggle */}
                      <button 
                        onClick={() => {
                          const isUpper = selectedElement.text === selectedElement.text?.toUpperCase();
                          updateSelectedElement({ text: isUpper ? selectedElement.text?.toLowerCase() : selectedElement.text?.toUpperCase() });
                        }}
                        className={`p-2 rounded-lg transition-all ${selectedElement.text === selectedElement.text?.toUpperCase() ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'}`}
                        title="Majuscules/Minuscules"
                      >
                        <CaseSensitive className="w-5 h-5" />
                      </button>

                      {/* Spacing Toggle */}
                      <button 
                        onClick={() => {
                          setActiveTab(activeTab === 'spacing' ? 'templates' : 'spacing');
                          setIsMobileSidebarOpen(true);
                        }}
                        className={`p-2 rounded-lg transition-all ${activeTab === 'spacing' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'}`}
                        title="Espacement"
                      >
                        <ArrowUpDown className="w-5 h-5" />
                      </button>

                      {/* List */}
                      <button 
                        onClick={() => {
                          if (selectedElement.text) {
                            const lines = selectedElement.text.split('\n');
                            const isList = lines.every(line => line.trim().startsWith('•'));
                            const newText = isList 
                              ? lines.map(line => line.replace(/^•\s*/, '')).join('\n')
                              : lines.map(line => line.trim().startsWith('•') ? line : `• ${line}`).join('\n');
                            updateSelectedElement({ text: newText });
                          }
                        }}
                        className={`p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0 ${selectedElement.text?.includes('•') ? 'text-primary bg-primary/5' : 'text-gray-500'}`}
                        title="Liste à puces"
                      >
                        <List className="w-5 h-5" />
                      </button>
                      </div>
                    </>
                  )}

                  {/* Effects */}
                  <button 
                    onClick={() => {
                      setActiveTab(activeTab === 'effects' ? 'templates' : 'effects');
                      setIsMobileSidebarOpen(true);
                    }}
                    className={`px-3 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all flex-shrink-0 ${activeTab === 'effects' ? 'bg-gray-100 text-primary' : 'text-gray-600'}`}
                    title="Effets"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden lg:inline">Effets</span>
                  </button>
                  
                  <div className="h-6 w-px bg-gray-200 flex-shrink-0" />

                  {/* Position */}
                  <button 
                    onClick={() => {
                      setActiveTab(activeTab === 'position' ? 'templates' : 'position');
                      setIsMobileSidebarOpen(true);
                    }}
                    className={`px-3 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all flex-shrink-0 ${activeTab === 'position' ? 'bg-gray-100 text-primary' : 'text-gray-600'}`}
                    title="Position"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="hidden lg:inline">Position</span>
                  </button>

                  <div className="h-6 w-px bg-gray-200 flex-shrink-0" />

                  {/* Copy Style */}
                  <button 
                    onClick={() => {
                      if (selectedElement) {
                        setCopiedStyle({
                          fontFamily: selectedElement.fontFamily,
                          fontSize: selectedElement.fontSize,
                          fontStyle: selectedElement.fontStyle,
                          textDecoration: selectedElement.textDecoration,
                          fill: selectedElement.fill,
                          align: selectedElement.align,
                          opacity: selectedElement.opacity
                        });
                        toast.success("Style copié");
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 flex-shrink-0"
                    title="Copier le style"
                  >
                    <PaintRoller className="w-5 h-5" />
                  </button>
                  
                  {copiedStyle && (
                    <button 
                      onClick={() => updateSelectedElement(copiedStyle)}
                      className="p-2 hover:bg-primary/10 rounded-lg text-primary flex-shrink-0"
                      title="Coller le style"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button 
                  onClick={() => setActiveTab('background')}
                  className="flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <div className="w-4 h-4 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: bgColor }} />
                  <span className="text-xs font-bold text-gray-600">Arrière-plan</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-gray-100 bg-white rounded-r-2xl relative z-10">
            {selectedElement && (
              <>
                <button onClick={handleRemoveSelected} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>

        {/* Canvas Stage */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-auto custom-scrollbar">
          <div 
            className="relative shadow-2xl bg-white transition-transform duration-200 ease-out"
            style={{ 
              width: 600 * stageScale, 
              height: 350 * stageScale,
              minWidth: 600 * stageScale,
              minHeight: 350 * stageScale
            }}
          >
            <div style={{ transform: `scale(${stageScale})`, transformOrigin: 'top left' }}>
              <Stage
                width={600}
                height={350}
                pixelRatio={4}
                ref={stageRef}
                onMouseDown={(e) => {
                  const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
                  if (clickedOnEmpty) {
                    setSelectedIds([]);
                    setEditingTextId(null);
                    
                    const pos = e.target.getStage().getPointerPosition();
                    if (pos) {
                      setSelectionRect({
                        x1: pos.x,
                        y1: pos.y,
                        x2: pos.x,
                        y2: pos.y,
                        visible: true
                      });
                    }
                  }
                }}
                onMouseMove={(e) => {
                  if (!selectionRect.visible) return;
                  const pos = e.target.getStage().getPointerPosition();
                  if (pos) {
                    setSelectionRect(prev => ({
                      ...prev,
                      x2: pos.x,
                      y2: pos.y
                    }));
                  }
                }}
                onMouseUp={(e) => {
                  if (!selectionRect.visible) return;
                  
                  const box = {
                    x1: Math.min(selectionRect.x1, selectionRect.x2),
                    y1: Math.min(selectionRect.y1, selectionRect.y2),
                    x2: Math.max(selectionRect.x1, selectionRect.x2),
                    y2: Math.max(selectionRect.y1, selectionRect.y2)
                  };
                  
                  // Only select if the box has some size
                  if (Math.abs(selectionRect.x1 - selectionRect.x2) > 5 || Math.abs(selectionRect.y1 - selectionRect.y2) > 5) {
                    const selected = elements.filter(el => {
                      const elWidth = el.width || (el.type === 'circle' ? (el.radius || 0) * 2 : 50);
                      const elHeight = el.height || (el.type === 'circle' ? (el.radius || 0) * 2 : 50);
                      
                      return (
                        el.x >= box.x1 &&
                        el.y >= box.y1 &&
                        el.x + elWidth <= box.x2 &&
                        el.y + elHeight <= box.y2
                      );
                    }).map(el => el.id);

                    if (selected.length > 0) {
                      setSelectedIds(selected);
                    }
                  }
                  
                  setSelectionRect(prev => ({ ...prev, visible: false }));
                }}
              >
                <Layer>
                  {showGrid && (
                    <>
                      {[...Array(20)].map((_, i) => (
                        <Line key={`v-${i}`} points={[i * 30, 0, i * 30, 350]} stroke="#e5e7eb" strokeWidth={1} />
                      ))}
                      {[...Array(12)].map((_, i) => (
                        <Line key={`h-${i}`} points={[0, i * 30, 600, i * 30]} stroke="#e5e7eb" strokeWidth={1} />
                      ))}
                    </>
                  )}
                  <Rect name="background" width={600} height={350} fill={bgColor} />
                  {elements.map((el) => {
                    if (el.type === 'text') {
                      return (
                        <EditableText
                          key={el.id}
                          element={el}
                          isSelected={selectedIds.includes(el.id)}
                          onSelect={() => setSelectedIds([el.id])}
                          onChange={(newAttrs) => {
                            setElements(elements.map(item => item.id === el.id ? { ...item, ...newAttrs } : item));
                          }}
                          onDoubleClick={(e) => handleTextDoubleClick(e, el.id)}
                        />
                      );
                    }
                    if (el.type === 'image') {
                      return (
                        <URLImage
                          key={el.id}
                          element={el}
                          isSelected={selectedIds.includes(el.id)}
                          onSelect={() => setSelectedIds([el.id])}
                          onChange={(newAttrs) => {
                            setElements(elements.map(item => item.id === el.id ? { ...item, ...newAttrs } : item));
                          }}
                        />
                      );
                    }
                    if (el.type === 'shape') {
                      return (
                        <Rect
                          key={el.id}
                          id={el.id}
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          height={el.height}
                          cornerRadius={el.cornerRadius}
                          fill={el.fill}
                          stroke={el.stroke}
                          strokeWidth={el.strokeWidth}
                          fillLinearGradientStartPoint={el.fillLinearGradientStartPoint}
                          fillLinearGradientEndPoint={el.fillLinearGradientEndPoint}
                          fillLinearGradientColorStops={el.fillLinearGradientColorStops}
                          opacity={el.opacity}
                          shadowColor={el.shadowColor}
                          shadowBlur={el.shadowBlur}
                          shadowOffsetX={el.shadowOffsetX}
                          shadowOffsetY={el.shadowOffsetY}
                          shadowOpacity={el.shadowOpacity}
                          draggable
                          onClick={() => setSelectedIds([el.id])}
                          onTap={() => setSelectedIds([el.id])}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item));
                          }}
                        />
                      );
                    }
                    if (el.type === 'path') {
                      return (
                        <Path
                          key={el.id}
                          id={el.id}
                          x={el.x}
                          y={el.y}
                          data={el.data || ''}
                          scaleX={el.scaleX}
                          scaleY={el.scaleY}
                          fill={el.fill}
                          stroke={el.stroke}
                          strokeWidth={el.strokeWidth}
                          fillLinearGradientStartPoint={el.fillLinearGradientStartPoint}
                          fillLinearGradientEndPoint={el.fillLinearGradientEndPoint}
                          fillLinearGradientColorStops={el.fillLinearGradientColorStops}
                          opacity={el.opacity}
                          shadowColor={el.shadowColor}
                          shadowBlur={el.shadowBlur}
                          shadowOffsetX={el.shadowOffsetX}
                          shadowOffsetY={el.shadowOffsetY}
                          shadowOpacity={el.shadowOpacity}
                          draggable
                          onClick={() => setSelectedIds([el.id])}
                          onTap={() => setSelectedIds([el.id])}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item));
                          }}
                        />
                      );
                    }
                    if (el.type === 'circle') {
                      return (
                        <Circle
                          key={el.id}
                          id={el.id}
                          x={el.x}
                          y={el.y}
                          radius={el.radius || 0}
                          fill={el.fill}
                          stroke={el.stroke}
                          strokeWidth={el.strokeWidth}
                          fillLinearGradientStartPoint={el.fillLinearGradientStartPoint}
                          fillLinearGradientEndPoint={el.fillLinearGradientEndPoint}
                          fillLinearGradientColorStops={el.fillLinearGradientColorStops}
                          opacity={el.opacity}
                          shadowColor={el.shadowColor}
                          shadowBlur={el.shadowBlur}
                          shadowOffsetX={el.shadowOffsetX}
                          shadowOffsetY={el.shadowOffsetY}
                          shadowOpacity={el.shadowOpacity}
                          draggable
                          onClick={() => setSelectedIds([el.id])}
                          onTap={() => setSelectedIds([el.id])}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item));
                          }}
                        />
                      );
                    }
                    if (el.type === 'ellipse') {
                      return (
                        <Ellipse
                          key={el.id}
                          id={el.id}
                          x={el.x}
                          y={el.y}
                          radiusX={el.radiusX || 0}
                          radiusY={el.radiusY || 0}
                          fill={el.fill}
                          stroke={el.stroke}
                          strokeWidth={el.strokeWidth}
                          fillLinearGradientStartPoint={el.fillLinearGradientStartPoint}
                          fillLinearGradientEndPoint={el.fillLinearGradientEndPoint}
                          fillLinearGradientColorStops={el.fillLinearGradientColorStops}
                          opacity={el.opacity}
                          shadowColor={el.shadowColor}
                          shadowBlur={el.shadowBlur}
                          shadowOffsetX={el.shadowOffsetX}
                          shadowOffsetY={el.shadowOffsetY}
                          shadowOpacity={el.shadowOpacity}
                          draggable
                          onClick={() => setSelectedIds([el.id])}
                          onTap={() => setSelectedIds([el.id])}
                          onDragEnd={(e) => {
                            setElements(elements.map(item => item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item));
                          }}
                        />
                      );
                    }
                    return null;
                  })}

                  {selectedIds.length > 0 && (
                    <Transformer
                      ref={trRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                    />
                  )}

                  {selectionRect.visible && (
                    <Rect
                      x={Math.min(selectionRect.x1, selectionRect.x2)}
                      y={Math.min(selectionRect.y1, selectionRect.y2)}
                      width={Math.abs(selectionRect.x1 - selectionRect.x2)}
                      height={Math.abs(selectionRect.y1 - selectionRect.y2)}
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="#3b82f6"
                      strokeWidth={1}
                    />
                  )}
                </Layer>
              </Stage>
            </div>

            {/* Text Editing Overlay */}
            {editingTextId && (
              <textarea
                value={elements.find(el => el.id === editingTextId)?.text || ''}
                onChange={handleTextChange}
                onBlur={() => setEditingTextId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    setEditingTextId(null);
                  }
                }}
                autoFocus
                style={{
                  position: 'fixed',
                  top: textAreaPos.y,
                  left: textAreaPos.x,
                  width: textAreaPos.width * stageScale,
                  background: 'white',
                  border: '1px solid #3b82f6',
                  padding: '0px',
                  margin: '0px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'sans-serif',
                  fontSize: `${(elements.find(el => el.id === editingTextId)?.fontSize || 16) * stageScale}px`,
                  color: elements.find(el => el.id === editingTextId)?.fill,
                  zIndex: 1000,
                }}
              />
            )}
          </div>
        </div>

        {/* Bottom Bar - Page Navigation & Zoom */}
        <div className="bg-white border-t border-gray-100 px-2 md:px-6 py-2 flex items-center justify-between z-20">
          <div className="flex items-center space-x-1 md:space-x-4 overflow-x-auto custom-scrollbar">
            <div className="flex items-center space-x-1">
              {pages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentPageIndex(index);
                    setSelectedIds([]);
                  }}
                  className={`relative group transition-all ${currentPageIndex === index ? 'ring-2 ring-primary ring-offset-1 rounded-md' : ''}`}
                >
                  <div className="w-10 h-8 md:w-16 md:h-10 bg-white border border-gray-200 rounded-md overflow-hidden flex items-center justify-center text-[8px] text-gray-400 font-bold shadow-sm">
                    <div className="absolute top-0.5 left-0.5 bg-gray-800 text-white text-[6px] px-0.5 rounded">{index + 1}</div>
                    <span className="hidden md:inline">Page {index + 1}</span>
                  </div>
                </button>
              ))}
              <button 
                onClick={() => {
                  setPages(prev => [...prev, { elements: [], bgColor: '#ffffff' }]);
                  setCurrentPageIndex(pages.length);
                  setSelectedIds([]);
                }}
                className="w-8 h-8 md:w-8 md:h-10 bg-gray-50 border border-dashed border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-100 transition-all"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Timer className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] font-bold text-gray-500 w-10">{Math.round(zoom * 100)}%</span>
            </div>
            
            <div className="flex items-center space-x-2 border-l border-gray-100 pl-6">
              <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-all">
                <Grid3X3 className="w-4 h-4" />
                <span className="text-[10px] font-bold">Pages</span>
              </button>
              <span className="text-[10px] font-bold text-gray-400">1/1</span>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-all">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center overflow-x-auto custom-scrollbar z-50">
        {sidebarTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'templates') {
                setIsDesignModalOpen(true);
              }
              setActiveTab(tab.id as any);
              setIsMobileSidebarOpen(true);
            }}
            className={`flex flex-col items-center justify-center min-w-[72px] h-full flex-shrink-0 ${
              activeTab === tab.id && isMobileSidebarOpen
                ? 'text-primary' 
                : 'text-gray-400'
            }`}
          >
            <tab.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold truncate px-1 w-full text-center">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>

      {/* Modals */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Design Envoyé !</h3>
              <p className="text-gray-500 mb-8">
                Votre personnalisation a été transmise à notre équipe technique. Nous reviendrons vers vous très prochainement pour la validation finale et le tirage.
              </p>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full p-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
              >
                Fermer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-2">Vos Coordonnées</h3>
              <p className="text-gray-500 mb-6">
                Veuillez nous indiquer comment vous contacter pour le suivi de votre commande de tirage.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nom Complet</label>
                  <input
                    type="text"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Jean Dupont"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="votre@email.com"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ex: +221 77 000 00 00"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="flex-1 p-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitForPrinting}
                  disabled={!contactInfo.name || !contactInfo.email || isSubmitting}
                  className="flex-1 p-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Envoi..." : "Confirmer l'envoi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-2xl font-black text-gray-900">Enregistrer le modèle</h3>
                <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-8">
                {/* Section 1: Informations générales */}
                <section>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <StickyNote className="w-4 h-4" /> Informations générales
                  </h4>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nom du modèle <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Ex: Carte de visite moderne"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                    />
                  </div>
                </section>

                {/* Section 2: Classification */}
                <section>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Classification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
                      <input
                        list="categories-list"
                        value={templateCategory}
                        onChange={(e) => {
                          setTemplateCategory(e.target.value);
                          // Auto-select first subcategory if available
                          const matchedCat = STUDIO_CATEGORIES.find(c => c.name === e.target.value);
                          if (matchedCat && matchedCat.subs.length > 0) {
                            setTemplateSubCategory(matchedCat.subs[0]);
                          } else {
                            setTemplateSubCategory('');
                          }
                        }}
                        placeholder="Ex: Fondations de Marque"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                      />
                      <datalist id="categories-list">
                        {STUDIO_CATEGORIES.map(c => (
                          <option key={c.name} value={c.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Sous catégorie</label>
                      <input
                        list="subcategories-list"
                        value={templateSubCategory}
                        onChange={(e) => setTemplateSubCategory(e.target.value)}
                        placeholder="Ex: Logo Principal"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                      />
                      <datalist id="subcategories-list">
                        {(STUDIO_CATEGORIES.find(c => c.name === templateCategory)?.subs || STUDIO_CATEGORIES.flatMap(c => c.subs)).map(sub => (
                          <option key={sub} value={sub} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </section>

                {/* Section 3: Tarification */}
                <section>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Crown className="w-4 h-4" /> Tarification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Prix (€)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={templatePrice}
                        onChange={(e) => setTemplatePrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="pt-8">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={templatePromotion}
                          onChange={(e) => setTemplatePromotion(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary relative"></div>
                        <span className="ml-3 text-sm font-bold text-gray-700">Promotion</span>
                      </label>
                    </div>
                    {templatePromotion && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Réduction (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={templatePromotionPercentage}
                          onChange={(e) => setTemplatePromotionPercentage(e.target.value)}
                          placeholder="Ex: 20"
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                        />
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={saveAsTemplate}
                  className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Enregistrer le modèle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setItemToDelete(null)}
            className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mb-8">
                Voulez-vous vraiment supprimer ce design ? Cette action est irréversible.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isSvgModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black mb-2">Importer un SVG</h3>
              <p className="text-sm text-gray-500 mb-6">Collez le code source de votre fichier SVG ci-dessous.</p>
              
              <textarea
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                placeholder="<svg ...> ... </svg>"
                className="w-full h-48 p-4 bg-gray-50 rounded-2xl border border-gray-100 font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none mb-6"
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSvgModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => parseSVG(svgInput)}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                >
                  Charger le modèle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <DesignSelectorModal 
        isOpen={isDesignModalOpen} 
        onClose={() => setIsDesignModalOpen(false)} 
        onSelect={(item) => {
          loadTemplate(item);
          setIsDesignModalOpen(false);
        }}
        initialDisplayMode="variants"
        initialViewStep={currentProductContext ? 'products' : 'categories'}
        initialSearchQuery={currentProductContext || ''}
      />
    </div>
  );
};
