import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Image, Transformer, Group, Path, Circle, Line, Ellipse } from 'react-konva';
import { FabricCanvas } from './FabricCanvas';
import Konva from 'konva';
import useImage from 'use-image';
import { 
  Upload, Type, Palette, Download, Trash2, Plus, Minus, Move, MousePointer2, 
  Layers, Copy, Save, Send, CheckCircle2, LayoutGrid, Shapes, Crown, 
  Wrench, FolderOpen, Sparkles, Mic, Image as ImageIcon, StickyNote, 
  Timer, Maximize2, Grid3X3, ChevronDown, ChevronLeft, Search, X, ArrowLeft, Home, Cloud,
  FileText, Music, Clapperboard, Table, ChevronRight, File, Maximize, Monitor,
  Smartphone, ExternalLink, Settings, Layout, MousePointer, MessageCircle,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, PaintRoller, CaseSensitive, ArrowUpDown, Scaling, Undo, Redo, Share2,
  Eye, Lock, Unlock, ChevronUp, ArrowUpToLine, ArrowRightToLine, ArrowDownToLine, GripHorizontal, GripVertical, Check,
  ShoppingBag, CreditCard, Wallet, Truck, Info, Phone, Printer, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useFirestoreData } from '../../hooks/useFirestoreData';
import { generateDesign } from '../../lib/gemini';
import { firestoreService } from '../../services/firestoreService';
import { dbService } from '../../services/dbService';
import { SERVICES } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../hooks/usePresence';
import { geminiService } from '../../services/geminiService';
import { bus } from '../../lib/events/EventBus';
import '../../lib/events/SyncEngine'; // Initialize SyncEngine
import { trackUsage } from '../../lib/billing/usageTracker';
import { AssetLibrary } from './AssetLibrary';
import DesignSelectorModal, { CATEGORIES } from './DesignSelectorModal';
import { OptimizedImage } from '../OptimizedImage';
import { CanvasElement, Design, Template, DesignBlock } from '../../types';

interface CardEditorProps {
  initialTemplate?: any; // SVG string, URL, or design object
  templateId?: string;
  onExport?: (dataUrl: string) => void;
  autoOpenSelector?: boolean;
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
const MiniPreview = ({ elements, bgColor, profile, contextElements, width = 1050, height = 600 }: { 
  elements: CanvasElement[], 
  bgColor: string,
  profile?: any,
  contextElements?: CanvasElement[],
  width?: number,
  height?: number
}) => {
  return (
    <div 
      className="relative w-full h-full overflow-hidden pointer-events-none" 
      style={{ backgroundColor: bgColor, containerType: 'inline-size' }}
    >
      {elements.filter(el => !el.hidden).map((el) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${(el.x / width) * 100}%`,
          top: `${(el.y / height) * 100}%`,
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
          style.fontSize = `${((el.fontSize || 16) / width) * 100}cqi`;
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
          style.width = el.width ? `${(el.width / width) * 100}%` : (el.radius ? `${(el.radius * 2 / width) * 100}%` : '10%');
          style.height = el.height ? `${(el.height / height) * 100}%` : (el.radius ? `${(el.radius * 2 / height) * 100}%` : '2%');
          if (el.type === 'circle') style.borderRadius = '50%';
          if (el.stroke) {
            style.border = `${(el.strokeWidth || 1) * 0.1}px solid ${el.stroke}`;
          }
        } else if (el.type === 'image') {
          style.width = `${(el.width || 100) / width * 100}%`;
          style.height = `${(el.height || 100) / height * 100}%`;
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
              <OptimizedImage src={hydratedSrc} alt="Preview" width={1200} className="w-full h-full object-contain" />
            )}
            {(el.type === 'path' || el.type === 'ellipse') && (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
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
const URLImage = ({ element, isSelected, onSelect, onChange, lockedBy, lockColor, onDragMove, onDragEnd }: { 
  element: CanvasElement; 
  isSelected: boolean; 
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
  lockedBy?: string | null;
  lockColor?: string;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any, onChange: (attrs: any) => void) => void;
}) => {
  const [img] = useImage(element.src || '');
  const shapeRef = useRef<any>(null);

  useEffect(() => {
    if (img && shapeRef.current) {
      if (element.filters && Object.keys(element.filters).length > 0) {
        shapeRef.current.cache();
      } else {
        shapeRef.current.clearCache();
      }
    }
  }, [img, element.filters]);

  const activeFilters = useMemo(() => {
    if (!element.filters) return [];
    const f = [];
    if (element.filters.brightness !== undefined) f.push(Konva.Filters.Brighten);
    if (element.filters.contrast !== undefined) f.push(Konva.Filters.Contrast);
    if (element.filters.blur !== undefined) f.push(Konva.Filters.Blur);
    if (element.filters.grayscale) f.push(Konva.Filters.Grayscale);
    if (element.filters.sepia) f.push(Konva.Filters.Sepia);
    return f;
  }, [element.filters]);

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
        filters={activeFilters.length > 0 ? activeFilters : undefined}
        brightness={element.filters?.brightness || 0}
        contrast={element.filters?.contrast || 0}
        blurRadius={element.filters?.blur || 0}
        draggable={!lockedBy}
        onClick={onSelect}
        onTap={onSelect}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          if (onDragEnd) {
            onDragEnd(e, onChange);
          } else {
            onChange({
              x: e.target.x(),
              y: e.target.y(),
            });
          }
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
      {lockedBy && (
        <Rect
          x={element.x - 2}
          y={element.y - 2}
          width={(element.width || 100) + 4}
          height={(element.height || 100) + 4}
          stroke={lockColor || '#ef4444'}
          strokeWidth={2}
          dash={[4, 2]}
        />
      )}
    </>
  );
};

// --- Helper for Text Element ---
const EditableText = ({ element, isSelected, onSelect, onChange, onDoubleClick, lockedBy, lockColor, onDragMove, onDragEnd }: { 
  element: CanvasElement; 
  isSelected: boolean; 
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
  onDoubleClick: (e: any) => void;
  lockedBy?: string | null;
  lockColor?: string;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any, onChange: (attrs: any) => void) => void;
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
        draggable={!lockedBy}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={lockedBy ? undefined : onDoubleClick}
        onDblTap={lockedBy ? undefined : onDoubleClick}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          if (onDragEnd) {
            onDragEnd(e, onChange);
          } else {
            onChange({
              x: e.target.x(),
              y: e.target.y(),
            });
          }
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
      {lockedBy && (
        <Rect
          x={element.x - 2}
          y={element.y - 2}
          width={(shapeRef.current?.width() || 100) + 4}
          height={(shapeRef.current?.height() || 20) + 4}
          stroke={lockColor || '#ef4444'}
          strokeWidth={2}
          dash={[4, 2]}
        />
      )}
    </>
  );
};

// --- Templates ---
const TEMPLATES: any[] = [];

const FONTS = [
  'Inter', 'Cormorant Garamond', 'Montserrat', 'Playfair Display', 'Roboto', 'Open Sans', 'Lato',
  'Oswald', 'Raleway', 'Poppins', 'Nunito', 'Ubuntu', 'Merriweather', 'PT Serif', 'Lora', 'Rubik', 'Work Sans',
  'Dancing Script', 'Space Grotesk', 'Anton', 'JetBrains Mono'
];

export const CardEditor: React.FC<CardEditorProps> = ({ initialTemplate, templateId, onExport, autoOpenSelector }) => {
  const { isAdmin, isManager, profile, user } = useAuth();
  const navigate = useNavigate();
  const stageRef = useRef<any>(null);

  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('business-cards');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(100);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    // Dynamically load Google Fonts
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?${FONTS.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      if (link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, []);
  const { others, updateMyPresence } = usePresence(templateId || null);
  const { data: dbTemplates, loading: loadingTemplates, refresh: refreshTemplates } = useFirestoreData<any>({
    tableName: 'design_templates',
    order: { column: 'createdAt', direction: 'desc' },
    realtime: false,
    limit: 50
  });

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [designTitle, setDesignTitle] = useState('Design sans titre');
  const [designId, setDesignId] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1050, height: 600 });

  const { data: userDesigns, refresh: refreshUserDesigns } = useFirestoreData<any>({
    tableName: 'designs',
    filter: { column: 'ownerId', value: user?.uid },
    skip: !user,
    realtime: true,
    limit: 50
  });

  const { data: blocks, loading: loadingBlocks, mutate: mutateBlocks } = useFirestoreData<DesignBlock>({
    tableName: `designs/${designId}/blocks` as any,
    skip: !designId,
    realtime: true
  });

  // Sync blocks to pages when they change from other sources
  useEffect(() => {
    if (blocks && blocks.length > 0 && designId) {
      setPages(prevPages => {
        const nextPages = [...prevPages];
        blocks.forEach(block => {
          const pageIdx = block.pageIndex;
          if (pageIdx >= nextPages.length) {
            // Add missing pages if necessary
            for (let i = nextPages.length; i <= pageIdx; i++) {
              nextPages.push({ elements: [], bgColor: '#ffffff' });
            }
          }
          
          const element: CanvasElement = {
            ...block.content,
            id: block.id,
            type: block.type,
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
            rotation: block.rotation
          };

          const existingIdx = nextPages[pageIdx].elements.findIndex(el => el.id === element.id);
          if (existingIdx > -1) {
            // Only update if changed to avoid loops
            const existing = nextPages[pageIdx].elements[existingIdx];
            if (JSON.stringify(existing) !== JSON.stringify(element)) {
              nextPages[pageIdx].elements[existingIdx] = element;
            }
          } else {
            nextPages[pageIdx].elements.push(element);
          }
        });
        
        // Sort elements by zIndex if available in block
        nextPages.forEach(p => {
          p.elements.sort((a, b) => {
            const blockA = blocks.find(bl => bl.id === a.id);
            const blockB = blocks.find(bl => bl.id === b.id);
            return (blockA?.zIndex || 0) - (blockB?.zIndex || 0);
          });
        });

        return nextPages;
      });
    }
  }, [blocks, designId]);

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
      await firestoreService.delete(collectionName, id);
      
      // Give Firestore a moment to propagate the deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (collectionName === 'design_templates') {
        await refreshTemplates(); // Force refresh from server, bypassing cache
      } else {
        await refreshUserDesigns(); // Force refresh for user designs too
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
    { 
      elements: (TEMPLATES[0]?.elements || []) as CanvasElement[], 
      bgColor: TEMPLATES[0]?.bgColor || '#ffffff' 
    },
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

  const [isSaving, setIsSaving] = useState(false);
  const [isImprovingLayout, setIsImprovingLayout] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    visible: false
  });

  const prevSelectedIds = useRef<string[]>([]);

  const lockBlock = async (blockId: string) => {
    if (!designId || !user) return;
    await firestoreService.update(`designs/${designId}/blocks`, blockId, {
      lockedBy: user.uid,
      lockedAt: new Date()
    });
  };

  const unlockBlock = async (blockId: string) => {
    if (!designId || !user) return;
    await firestoreService.update(`designs/${designId}/blocks`, blockId, {
      lockedBy: null,
      lockedAt: null
    });
  };

  // Handle block locking
  useEffect(() => {
    if (!designId || !user || !blocks) return;

    const currentSelected = selectedIds;
    const previouslySelected = prevSelectedIds.current;

    // Unlock blocks that were deselected
    const deselected = previouslySelected.filter(id => !currentSelected.includes(id));
    deselected.forEach(id => {
      const block = blocks.find(b => b.id === id);
      if (block && block.lockedBy === user.uid) {
        unlockBlock(id);
      }
    });

    // Lock blocks that were newly selected
    const newlySelected = currentSelected.filter(id => !previouslySelected.includes(id));
    newlySelected.forEach(id => {
      const block = blocks.find(b => b.id === id);
      // Only lock if it's not already locked by someone else
      if (block && (!block.lockedBy || block.lockedBy === user.uid)) {
        lockBlock(id);
      }
    });

    prevSelectedIds.current = currentSelected;
  }, [selectedIds, designId, user, blocks]);

  // Unlock all blocks on unmount
  useEffect(() => {
    return () => {
      if (prevSelectedIds.current.length > 0 && designId && user) {
        prevSelectedIds.current.forEach(id => {
          // We use a firestore update directly here to ensure it's sent
          unlockBlock(id);
        });
      }
    };
  }, [designId, user]);
  const [showGrid, setShowGrid] = useState(false);
  const [guides, setGuides] = useState<{ type: 'vertical' | 'horizontal', position: number }[]>([]);

  // Snapping logic
  const getLineGuideStops = (skipShapeId?: string) => {
    const vertical = [0, canvasDimensions.width / 2, canvasDimensions.width]; // Canvas edges and center
    const horizontal = [0, canvasDimensions.height / 2, canvasDimensions.height];

    elements.forEach((el) => {
      if (el.id === skipShapeId || el.hidden) return;
      const w = el.width || (el.type === 'circle' ? (el.radius || 0) * 2 : 100);
      const h = el.height || (el.type === 'circle' ? (el.radius || 0) * 2 : 100);
      
      vertical.push(el.x, el.x + w / 2, el.x + w);
      horizontal.push(el.y, el.y + h / 2, el.y + h);
    });

    return { vertical, horizontal };
  };

  const getObjectSnappingEdges = (node: any) => {
    const box = node.getClientRect();
    return {
      vertical: [
        { guide: Math.round(box.x), offset: Math.round(node.x() - box.x), snap: 'start' },
        { guide: Math.round(box.x + box.width / 2), offset: Math.round(node.x() - box.x - box.width / 2), snap: 'center' },
        { guide: Math.round(box.x + box.width), offset: Math.round(node.x() - box.x - box.width), snap: 'end' },
      ],
      horizontal: [
        { guide: Math.round(box.y), offset: Math.round(node.y() - box.y), snap: 'start' },
        { guide: Math.round(box.y + box.height / 2), offset: Math.round(node.y() - box.y - box.height / 2), snap: 'center' },
        { guide: Math.round(box.y + box.height), offset: Math.round(node.y() - box.y - box.height), snap: 'end' },
      ],
    };
  };

  const getGuides = (lineGuideStops: any, itemBounds: any) => {
    const resultV: any[] = [];
    const resultH: any[] = [];
    const GUIDELINE_OFFSET = 5;

    lineGuideStops.vertical.forEach((lineGuide: number) => {
      itemBounds.vertical.forEach((itemBound: any) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({ lineGuide, diff, snap: itemBound.snap, offset: itemBound.offset });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide: number) => {
      itemBounds.horizontal.forEach((itemBound: any) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({ lineGuide, diff, snap: itemBound.snap, offset: itemBound.offset });
        }
      });
    });

    const guides = [];
    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

    if (minV) guides.push({ type: 'vertical', position: minV.lineGuide, offset: minV.offset });
    if (minH) guides.push({ type: 'horizontal', position: minH.lineGuide, offset: minH.offset });

    return guides;
  };

  const handleDragMove = (e: any, id: string) => {
    const node = e.target;
    const lineGuideStops = getLineGuideStops(id);
    const itemBounds = getObjectSnappingEdges(node);
    const newGuides = getGuides(lineGuideStops, itemBounds) as { type: 'vertical' | 'horizontal', position: number, offset: number }[];

    if (!newGuides.length) {
      setGuides([]);
      return;
    }

    setGuides(newGuides.map(g => ({ type: g.type, position: g.position })));

    newGuides.forEach((lg) => {
      if (lg.type === 'vertical') {
        node.x(lg.position + lg.offset);
      } else if (lg.type === 'horizontal') {
        node.y(lg.position + lg.offset);
      }
    });
  };

  const handleDragEnd = (e: any, id: string, onChange: (attrs: any) => void) => {
    setGuides([]);
    onChange({ x: e.target.x(), y: e.target.y() });
  };
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

  const handleImproveLayout = async () => {
    if (elements.length === 0) {
      toast.error("Ajoutez des éléments d'abord !");
      return;
    }

    setIsImprovingLayout(true);
    const loadingToast = toast.loading("L'IA analyse votre design...");
    
    try {
      const suggestions = await geminiService.improveLayout(elements, canvasDimensions.width, canvasDimensions.height);
      
      if (suggestions && suggestions.length > 0) {
        // Apply suggestions optimistically
        const nextElements = elements.map(el => {
          const suggestion = suggestions.find(s => s.id === el.id);
          if (suggestion) {
            return { ...el, ...suggestion };
          }
          return el;
        });

        setElements(nextElements);
        toast.success("Mise en page améliorée par l'IA !", { id: loadingToast });
        
        // Trigger save for each modified block
        if (designId) {
          suggestions.forEach(s => {
            const block = blocks?.find(b => b.id === s.id);
            if (block) {
              mutateBlocks(prev => prev?.map(b => b.id === s.id ? { ...b, ...s } : b) || null);
              firestoreService.update(`designs/${designId}/blocks`, s.id, {
                ...s,
                updatedAt: new Date()
              });
            }
          });
        }
      } else {
        toast.error("L'IA n'a pas pu suggérer d'améliorations.", { id: loadingToast });
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      toast.error("Erreur lors de l'appel à l'IA.", { id: loadingToast });
    } finally {
      setIsImprovingLayout(false);
    }
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

  // Auto-sync blocks to Firestore when elements change using EventBus
  useEffect(() => {
    if (!designId || !user || loadingBlocks) return;

    const timer = setTimeout(() => {
      // Find elements that are different from blocks
      const currentElements = pages.flatMap((p, pi) => p.elements.map(el => ({ ...el, pageIndex: pi })));
      
      // Optimistic update for blocks (local state)
      mutateBlocks(prev => {
        return currentElements.map(el => {
          const existing = prev.find(b => b.id === el.id);
          return {
            id: el.id,
            designId: designId!,
            pageIndex: (el as any).pageIndex,
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width || 0,
            height: el.height || 0,
            rotation: el.rotation || 0,
            content: { ...el },
            zIndex: pages[(el as any).pageIndex].elements.indexOf(el as any),
            updatedAt: new Date().toISOString(),
            ...existing
          } as DesignBlock;
        });
      });

      // Emit events for creates/updates
      for (const el of currentElements) {
        const block = blocks?.find(b => b.id === el.id);
        
        if (!block || JSON.stringify(block.content) !== JSON.stringify(el)) {
          bus.emit('block_event', {
            type: block ? 'block_update' : 'block_create',
            designId,
            pageIndex: (el as any).pageIndex,
            blockId: el.id,
            changes: { ...el },
            data: {
              type: el.type,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              rotation: el.rotation || 0,
              content: { ...el },
              zIndex: pages[(el as any).pageIndex].elements.indexOf(el as any)
            },
            userId: user.uid,
            timestamp: Date.now()
          });
        }
      }

      // Emit events for deletions
      if (blocks) {
        for (const block of blocks) {
          if (!currentElements.find(el => el.id === block.id)) {
            bus.emit('block_event', {
              type: 'block_delete',
              designId,
              pageIndex: block.pageIndex,
              blockId: block.id,
              userId: user.uid,
              timestamp: Date.now()
            });
          }
        }
      }
    }, 1000); // Reduced debounce since queue handles batching

    return () => clearTimeout(timer);
  }, [pages, designId, user, blocks]);

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
        user_id: user.uid,
        bg_color: bgColor,
        width: canvasDimensions.width,
        height: canvasDimensions.height,
        updated_at: new Date().toISOString(),
      };

      let currentDesignId = designId;

      if (currentDesignId) {
        await firestoreService.update('designs', currentDesignId, designData);
      } else {
        currentDesignId = await firestoreService.add('designs', designData);
        setDesignId(currentDesignId);
      }

      // Save blocks (elements)
      if (currentDesignId) {
        const savePromises = pages.flatMap((page, pageIndex) => 
          page.elements.map((el, zIndex) => {
            const blockData = {
              id: el.id,
              designId: currentDesignId,
              pageIndex,
              type: el.type,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              rotation: el.rotation || 0,
              content: { ...el }, // Store all properties in content for now
              zIndex,
              updatedAt: new Date()
            };
            // Use element ID as block ID for consistency
            return firestoreService.save(`designs/${currentDesignId}/blocks`, blockData);
          })
        );
        await Promise.all(savePromises);
      }

      toast.success("Design enregistré avec succès !", { id: toastId });
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
  const trRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCursorUpdateRef = useRef<number>(0);
  const [stageSize, setStageSize] = useState({ width: 1050, height: 600 });
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
      const { elements: newElements } = await parseSvgToElements(svgText);
      setElements([...elements, ...newElements]);
    };
    reader.readAsText(file);
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const stageScale = useMemo(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 40;
      const containerHeight = containerRef.current.offsetHeight - 40;
      const scaleX = containerWidth / canvasDimensions.width;
      const scaleY = containerHeight / canvasDimensions.height;
      const baseScale = Math.min(scaleX, scaleY, 1);
      return baseScale * zoom;
    }
    return zoom;
  }, [zoom, canvasDimensions.width, canvasDimensions.height, isMobileSidebarOpen]);

  const loadTemplate = async (template: any) => {
    // Check if this is a variant pointing to a hardcoded template
    if (template.templateId) {
      const hardcoded = TEMPLATES.find(t => t.id === template.templateId);
      if (hardcoded) {
        // Use the hardcoded template but keep the name/subcategory from the variant if needed
        template = { ...hardcoded, name: template.name || hardcoded.name, subCategory: template.subCategory || hardcoded.subCategory };
      }
    }

    // Set dimensions if present in template or determined by category
    const foundCategory = TEMPLATE_CATEGORIES.find(c => c.name === template.subCategory || c.name === template.category);
    if (template.width && template.height) {
      setCanvasDimensions({ width: Number(template.width), height: Number(template.height) });
    } else if (foundCategory) {
      setCanvasDimensions({ width: foundCategory.width, height: foundCategory.height });
    } else {
      // Default to business card if unknown
      setCanvasDimensions({ width: 1050, height: 600 });
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
        
        let svgStrings: string[] = [];
        try {
          const parsed = JSON.parse(template.templateSvg);
          if (Array.isArray(parsed) && parsed.length > 0) {
            svgStrings = parsed;
          } else {
            svgStrings = [template.templateSvg];
          }
        } catch (e) {
          // If JSON parse fails, assume it's a raw SVG string
          svgStrings = [template.templateSvg];
        }

        const newPages = [];
        let firstWidth = 1050;
        let firstHeight = 600;

        for (let i = 0; i < svgStrings.length; i++) {
          const { elements: newElements, width, height } = await parseSvgToElements(svgStrings[i]);
          if (i === 0) {
            firstWidth = width;
            firstHeight = height;
          }
          newPages.push({
            elements: hydrateElements(newElements),
            bgColor: template.bgColor || template.bg_color || '#ffffff'
          });
        }
        
        // Update canvas dimensions based on SVG parsing instead of defaults
        setCanvasDimensions({ width: Math.round(firstWidth), height: Math.round(firstHeight) });

        setPages(newPages);
        if (template.name) setDesignTitle(template.name);
        if (template.subCategory) setCurrentProductContext(template.subCategory);

        // Try to match with a service to pre-select it in the order modal
        console.log("Matching template full object:", JSON.stringify(template));
        console.log("Matching template productId:", template.productId);
        console.log("Matching template subCategory:", template.subCategory);
        const pid = template.productId?.toLowerCase() || '';
        const matchingService = SERVICES.find(s => 
          s.isPrintProduct && 
          (s.id === pid || 
           s.id === template.serviceId || 
           s.id === template.productId ||
           s.templateId === template.id ||
           s.templateId === template.templateId ||
           s.name.toLowerCase() === (template.subCategory?.toLowerCase() || ''))
        );
        console.log("Matching service found:", matchingService);

        if (matchingService) {
          setSelectedServiceId(matchingService.id);
          if (matchingService.quantityTiers && matchingService.quantityTiers.length > 0) {
            setSelectedQuantity(matchingService.quantityTiers[0].quantity);
          }
        } else {
          // Fallback: If not found, try to keep current but ensure it's a valid print product
          console.warn("No matching service found for template, keeping default if it's a print product");
        }
      } catch (error) {
        console.error("Error parsing variant SVG:", error);
      }
    } else if (template.pages) {
      if (template.subCategory) setCurrentProductContext(template.subCategory);
      
      // Try to match with a service to pre-select it in the order modal
      const pid = template.productId?.toLowerCase() || '';
      const mS = SERVICES.find(s => 
        s.isPrintProduct && 
        (s.id === pid ||
         s.id === template.serviceId || 
         s.id === template.productId ||
         s.templateId === template.id ||
         s.templateId === template.templateId ||
         s.name.toLowerCase() === (template.subCategory?.toLowerCase() || ''))
      );
      if (mS) {
        setSelectedServiceId(mS.id);
        if (mS.quantityTiers && mS.quantityTiers.length > 0) {
          setSelectedQuantity(mS.quantityTiers[0].quantity);
        }
      }

      setPages(template.pages.map((p: any) => ({
        ...p,
        elements: hydrateElements(p.elements),
        bgColor: p.bgColor || p.bg_color || '#ffffff'
      })));
    } else if (template.sides) {
      if (template.subCategory) setCurrentProductContext(template.subCategory);

      // Try to match with a service to pre-select it in the order modal
      const pid = template.productId?.toLowerCase() || '';
      const mS = SERVICES.find(s => 
        s.isPrintProduct && 
        (s.id === pid ||
         s.id === template.serviceId || 
         s.id === template.productId ||
         s.templateId === template.id ||
         s.templateId === template.templateId ||
         s.name.toLowerCase() === (template.subCategory?.toLowerCase() || ''))
      );
      if (mS) {
        setSelectedServiceId(mS.id);
        if (mS.quantityTiers && mS.quantityTiers.length > 0) {
          setSelectedQuantity(mS.quantityTiers[0].quantity);
        }
      }

      setPages([
        { 
          elements: hydrateElements(template.sides.front.elements), 
          bgColor: template.sides.front.bgColor || template.sides.front.bg_color || '#ffffff'
        },
        { 
          elements: hydrateElements(template.sides.back.elements), 
          bgColor: template.sides.back.bgColor || template.sides.back.bg_color || '#ffffff'
        }
      ]);
    } else {
      if (template.subCategory) setCurrentProductContext(template.subCategory);

      // Try to match with a service to pre-select it in the order modal
      const mS = SERVICES.find(s => 
        s.isPrintProduct && 
        (s.id === template.serviceId || 
         s.id === template.productId ||
         s.templateId === template.id ||
         s.templateId === template.templateId ||
         s.name.toLowerCase() === (template.subCategory || '').toLowerCase() ||
         (template.subCategory || '').toLowerCase().includes(s.name.toLowerCase()))
      );
      if (mS) {
        setSelectedServiceId(mS.id);
        if (mS.quantityTiers && mS.quantityTiers.length > 0) {
          setSelectedQuantity(mS.quantityTiers[0].quantity);
        }
      }

      const elements = template.elements || [];
      const bgColor = template.bgColor || template.bg_color || '#ffffff';
      
      setPages([
        { 
          elements: hydrateElements(elements as CanvasElement[]), 
          bgColor: bgColor 
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
          
          let svgStrings: string[] = [];
          try {
            const parsed = JSON.parse(initialTemplate);
            if (Array.isArray(parsed) && parsed.length > 0) {
              svgStrings = parsed;
            } else {
              svgStrings = [initialTemplate];
            }
          } catch (e) {
            svgStrings = [initialTemplate];
          }

          const newPages = [];
          let firstWidth = 1050;
          let firstHeight = 600;
          let hasElements = false;

          for (let i = 0; i < svgStrings.length; i++) {
            const { elements: newElements, width, height } = await parseSvgToElements(svgStrings[i]);
            if (i === 0) {
              firstWidth = width;
              firstHeight = height;
            }
            if (newElements.length > 0) hasElements = true;
            newPages.push({
              elements: newElements,
              bgColor: '#ffffff'
            });
          }

          if (hasElements) {
            setCanvasDimensions({ width: Math.round(firstWidth), height: Math.round(firstHeight) });
            setPages(newPages);
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
    
    if (!loadingTemplates || !templateId) {
      loadInitial();
    }
  }, [initialTemplate, templateId, dbTemplates, loadingTemplates]);

  const [isSvgModalOpen, setIsSvgModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Fondations de Marque');
  const [templateSubCategory, setTemplateSubCategory] = useState('Logo Principal');
  const [templateSearch, setTemplateSearch] = useState('');
  const [currentProductContext, setCurrentProductContext] = useState<string | null>(null);
  const [templatePrice, setTemplatePrice] = useState('');
  const [templatePromotion, setTemplatePromotion] = useState(false);
  const [templatePromotionPercentage, setTemplatePromotionPercentage] = useState('');
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(autoOpenSelector || false);
  const [activeTab, setActiveTab] = useState<'templates' | 'elements' | 'text' | 'brand' | 'upload' | 'tools' | 'projects' | 'effects' | 'position' | 'spacing' | 'background' | 'options' | 'ai' | 'assets' | 'layers' | 'color'>('templates');
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(true);
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

  const alignSelected = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.length < 2) return;
    
    setElements(prev => {
      const selected = prev.filter(el => selectedIds.includes(el.id));
      if (selected.length === 0) return prev;

      let targetValue = 0;
      
      switch (alignment) {
        case 'left':
          targetValue = Math.min(...selected.map(el => el.x));
          break;
        case 'center':
          const minX = Math.min(...selected.map(el => el.x));
          const maxX = Math.max(...selected.map(el => el.x + (el.width || 0)));
          targetValue = minX + (maxX - minX) / 2;
          break;
        case 'right':
          targetValue = Math.max(...selected.map(el => el.x + (el.width || 0)));
          break;
        case 'top':
          targetValue = Math.min(...selected.map(el => el.y));
          break;
        case 'middle':
          const minY = Math.min(...selected.map(el => el.y));
          const maxY = Math.max(...selected.map(el => el.y + (el.height || 0)));
          targetValue = minY + (maxY - minY) / 2;
          break;
        case 'bottom':
          targetValue = Math.max(...selected.map(el => el.y + (el.height || 0)));
          break;
      }

      return prev.map(el => {
        if (!selectedIds.includes(el.id)) return el;
        
        switch (alignment) {
          case 'left': return { ...el, x: targetValue };
          case 'center': return { ...el, x: targetValue - (el.width || 0) / 2 };
          case 'right': return { ...el, x: targetValue - (el.width || 0) };
          case 'top': return { ...el, y: targetValue };
          case 'middle': return { ...el, y: targetValue - (el.height || 0) / 2 };
          case 'bottom': return { ...el, y: targetValue - (el.height || 0) };
          default: return el;
        }
      });
    });
  };

  const distributeSelected = (axis: 'horizontal' | 'vertical') => {
    if (selectedIds.length < 3) return;

    setElements(prev => {
      const selected = prev.filter(el => selectedIds.includes(el.id));
      if (selected.length < 3) return prev;

      const sorted = [...selected].sort((a, b) => axis === 'horizontal' ? a.x - b.x : a.y - b.y);
      
      if (axis === 'horizontal') {
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpace = (last.x) - (first.x + (first.width || 0));
        let sumWidths = 0;
        for (let i = 1; i < sorted.length - 1; i++) sumWidths += (sorted[i].width || 0);
        
        const gap = (totalSpace - sumWidths) / (sorted.length - 1);
        
        let currentX = first.x + (first.width || 0) + gap;
        return prev.map(el => {
          if (!selectedIds.includes(el.id) || el.id === first.id || el.id === last.id) return el;
          const newEl = { ...el, x: currentX };
          currentX += (el.width || 0) + gap;
          return newEl;
        });
      } else {
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpace = (last.y) - (first.y + (first.height || 0));
        let sumHeights = 0;
        for (let i = 1; i < sorted.length - 1; i++) sumHeights += (sorted[i].height || 0);
        
        const gap = (totalSpace - sumHeights) / (sorted.length - 1);
        
        let currentY = first.y + (first.height || 0) + gap;
        return prev.map(el => {
          if (!selectedIds.includes(el.id) || el.id === first.id || el.id === last.id) return el;
          const newEl = { ...el, y: currentY };
          currentY += (el.height || 0) + gap;
          return newEl;
        });
      }
    });
  };

  const [isPositionMenuOpen, setIsPositionMenuOpen] = useState(false);
  const [isEffectsMenuOpen, setIsEffectsMenuOpen] = useState(false);
  const [isSpacingMenuOpen, setIsSpacingMenuOpen] = useState(false);

  const sidebarTabs = [
    { id: 'templates', label: 'Modèles', icon: LayoutGrid },
    { id: 'layers', label: 'Calques', icon: Layers },
    { id: 'ai', label: 'Assistant IA', icon: Sparkles },
    { id: 'elements', label: 'Éléments', icon: Shapes },
    { id: 'text', label: 'Texte', icon: Type },
    { id: 'background', label: 'Fond', icon: Palette },
    { id: 'brand', label: 'Marque', icon: Crown },
    { id: 'assets', label: 'Assets', icon: ImageIcon },
    { id: 'upload', label: 'Importer', icon: Upload },
    { id: 'tools', label: 'Outils', icon: Wrench },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
    { id: 'options', label: 'Options', icon: Settings },
  ];

  const [svgInput, setSvgInput] = useState('');

  const TEMPLATE_CATEGORIES = [
    { name: 'Logo Principal', width: 500, height: 500, categoryId: 'brand' },
    { name: 'Variante de Logo', width: 400, height: 150, categoryId: 'brand' },
    { name: 'Favicon', width: 128, height: 128, categoryId: 'brand' },
    { name: 'Carte de Visite', width: 1050, height: 600, categoryId: 'print' },
    { name: 'Papier En-tête A4', width: 2480, height: 3508, categoryId: 'print' },
    { name: 'Enveloppe DL', width: 2200, height: 1100, categoryId: 'print' },
    { name: 'Flyer A5', width: 1748, height: 2480, categoryId: 'marketing' },
    { name: 'Dépliant 3 volets', width: 3508, height: 2480, categoryId: 'marketing' },
    { name: 'Affiche événementielle', width: 4724, height: 7087, categoryId: 'marketing' },
    { name: 'Roll-up de salon', width: 2550, height: 6000, categoryId: 'goodies' },
    { name: 'Habillage de mug', width: 2362, height: 1122, categoryId: 'goodies' },
    { name: 'Design T-Shirt', width: 2400, height: 3200, categoryId: 'goodies' },
    { name: 'Étiquette de produit', width: 600, height: 400, categoryId: 'goodies' },
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
      
      await firestoreService.add('design_templates', {
        name: templateName,
        category: templateCategory,
        subCategory: templateSubCategory,
        price: templatePrice ? Number(templatePrice) : 0,
        promotion: templatePromotion,
        promotionPercentage: templatePromotion && templatePromotionPercentage ? Number(templatePromotionPercentage) : 0,
        categoryId: selectedCategory?.categoryId || 'print',
        pages: sanitizedPages,
        isPublic: true,
        user_id: user?.uid || 'anonymous'
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

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour passer une commande.');
      setIsSaveModalOpen(false);
      navigate('/login', { state: { from: '/design-editor', templateId } });
      return;
    }

    setIsPlacingOrder(true);
    const toastId = toast.loading("Préparation de votre commande...");
    
    try {
      // 1. Capture design thumbnail
      if (!stageRef.current) throw new Error("Canvas non initialisé");
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      
      // 2. Save design to Firestore
      const designDocId = await firestoreService.add('designs', {
        name: templateName || `Commande - ${new Date().toLocaleDateString()}`,
        ownerId: user.uid,
        pages: JSON.parse(JSON.stringify(pages)),
        thumbnail: dataUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        isTemplate: false
      });

      // 3. Find selected service info
      const service = SERVICES.find(s => s.id === selectedServiceId);
      if (!service) throw new Error("Service non trouvé");

      // 4. Calculate prices
      let basePrice = service.price;
      if (service.isPrintProduct && service.quantityTiers) {
        const tier = service.quantityTiers.find(t => t.quantity === selectedQuantity);
        if (tier) basePrice = tier.price / selectedQuantity;
      }

      let optionsModifier = 0;
      Object.entries(selectedOptions).forEach(([optId, value]) => {
        const optGroup = service.printOptions?.find(g => g.id === optId);
        const opt = optGroup?.options.find(o => o.label === value);
        if (opt) optionsModifier += opt.priceModifier;
      });

      const total = (basePrice * selectedQuantity) + optionsModifier;

      // 5. Create real order
      const orderId = await dbService.orders.save({
        userId: user.uid,
        serviceId: service.id,
        serviceName: service.name,
        serviceImage: service.image,
        clientName: profile?.displayName || user.displayName || 'Client',
        clientEmail: user.email,
        status: 'pending',
        totalPrice: total,
        originalPrice: total,
        designId: designDocId,
        details: {
          quantity: selectedQuantity,
          customOptions: selectedOptions,
          designThumbnail: dataUrl,
          description: `Commande directe via Acom Studio - Modèle: ${templateName || 'Standard'}`
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success("Commande créée avec succès !", { id: toastId });
      setIsSaveModalOpen(false);
      navigate(`/order-details/${orderId}`);
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Erreur lors de la création de la commande.", { id: toastId });
    } finally {
      setIsPlacingOrder(false);
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
      
      await firestoreService.add('design_requests', {
        user_id: user?.uid || null,
        user_email: user?.email || contactInfo.email,
        user_name: profile?.displayName || contactInfo.name || 'Client',
        user_phone: contactInfo.phone || null,
        pages: pages,
        preview_url: dataUrl,
        status: 'pending'
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
        vWidth = canvasDimensions.width;
        vHeight = canvasDimensions.height;
      }

      const scaleX = canvasDimensions.width / vWidth;
      const scaleY = canvasDimensions.height / vHeight;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (canvasDimensions.width - vWidth * scale) / 2;
      const offsetY = (canvasDimensions.height - vHeight * scale) / 2;

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
            width: 1050,
            height: 600,
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
        const ratio = canvasDimensions.height / canvasDimensions.width;
        const newWidth = Math.min(containerWidth - 40, canvasDimensions.width);
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
      x: canvasDimensions.width / 2 - 50,
      y: canvasDimensions.height / 2,
      text: 'Nouveau texte',
      fontSize: 18,
      fill: '#000000'
    };
    setElements(prev => [...prev, newElement]);
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
        x: canvasDimensions.width / 2 - 50,
        y: canvasDimensions.height / 2 - 50,
        width: Math.min(200, canvasDimensions.width / 2),
        height: Math.min(200, canvasDimensions.height / 2),
        src: event.target?.result as string
      };
      setElements([...elements, newElement]);
      setSelectedIds([newId]);
      setIsMobileSidebarOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageFromUrl = (url: string) => {
    const newId = `img-${Date.now()}`;
    const newElement: CanvasElement = {
      id: newId,
      type: 'image',
      x: canvasDimensions.width / 2 - 50,
      y: canvasDimensions.height / 2 - 50,
      width: Math.min(200, canvasDimensions.width / 2),
      height: Math.min(200, canvasDimensions.height / 2),
      src: url
    };
    setElements([...elements, newElement]);
    setSelectedIds([newId]);
    setIsMobileSidebarOpen(false);
  };

  const handleShare = () => {
    if (!designId) {
      toast.error("Veuillez d'abord sauvegarder le design pour le partager.");
      return;
    }
    
    // Create the invitation link
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/design-editor?template_id=${designId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Lien d'invitation copié ! Envoyez-le à vos collaborateurs.");
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      toast.error("Impossible de copier le lien.");
    });
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

  const editingTextIdRef = useRef<string | null>(null);
  const isEditingTextRef = useRef(false);

  const handleTextDoubleClick = useCallback((e: any, id: string) => {
    // Prevent duplicate editors
    if ((window as any).__textEditorOpen) return;
    
    // Remove any existing editors
    document.querySelectorAll('.fabric-text-editor').forEach(el => el.remove());

    if (isEditingTextRef.current) return;
    isEditingTextRef.current = true;
    (window as any).__textEditorOpen = true;
    
    console.log('handleTextDoubleClick called', { e, id });
    const textNode = e.target;
    if (!textNode || !textNode.canvas) {
      console.log('No text node or canvas found');
      isEditingTextRef.current = false;
      (window as any).__textEditorOpen = false;
      return;
    }

    const boundingRect = textNode.getBoundingRect();
    const canvasElement = textNode.canvas.getElement();
    const canvasBox = canvasElement.getBoundingClientRect();
    
    console.log('Setting editingTextId', id);
    setEditingTextId(id);
    setTextAreaPos({
      x: canvasBox.left + boundingRect.left,
      y: canvasBox.top + boundingRect.top,
      width: boundingRect.width,
    });
  }, [setEditingTextId, setTextAreaPos, elements]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingTextId) {
      setElements(elements.map(el => 
        el.id === editingTextId ? { ...el, text: e.target.value } : el
      ));
    }
  };

  useEffect(() => {
    if (!editingTextId) {
      isEditingTextRef.current = false;
      (window as any).__textEditorOpen = false;
    }
  }, [editingTextId]);

  const handleAiRewrite = async (action: 'improve' | 'professional' | 'translate') => {
    if (selectedIds.length !== 1) return;
    const selectedElement = elements.find(el => el.id === selectedIds[0]);
    if (!selectedElement || selectedElement.type !== 'text' || !selectedElement.text) return;

    setIsAiWriting(true);
    try {
      let prompt = '';
      if (action === 'improve') {
        prompt = `Améliore ce texte pour le rendre plus percutant et engageant, tout en gardant le même sens. Ne renvoie que le texte amélioré, sans guillemets ni commentaires : "${selectedElement.text}"`;
      } else if (action === 'professional') {
        prompt = `Réécris ce texte de manière très professionnelle et formelle. Ne renvoie que le texte réécrit, sans guillemets ni commentaires : "${selectedElement.text}"`;
      } else if (action === 'translate') {
        prompt = `Traduis ce texte en anglais (ou en français s'il est déjà en anglais). Ne renvoie que la traduction, sans guillemets ni commentaires : "${selectedElement.text}"`;
      }

      // Use the geminiService directly for text generation
      const result = await geminiService.generateText(prompt);
      
      if (result) {
        setElements(elements.map(el => 
          el.id === selectedElement.id ? { ...el, text: result.trim() } : el
        ));
        
        if (user) {
          trackUsage(user.uid, 'ai_generations');
        }
        toast.success('Texte réécrit avec succès !');
      }
    } catch (error) {
      console.error("Error rewriting text:", error);
      toast.error("Erreur lors de la réécriture du texte.");
    } finally {
      setIsAiWriting(false);
    }
  };

  const handleRemoveSelected = () => {
    if (selectedIds.length > 0) {
      setElements(elements.filter(el => !selectedIds.includes(el.id)));
      setSelectedIds([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f9f9] overflow-hidden relative font-sans">
      {/* Top Header Bar */}
      <div className="h-16 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-6 z-50 flex-shrink-0 shadow-xl text-white">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
            title="Retour à l'accueil"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={undo} 
              disabled={historyIndex <= 0} 
              className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-20 transition-all text-white/70 hover:text-white"
              title="Annuler (Ctrl+Z)"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1} 
              className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-20 transition-all text-white/70 hover:text-white"
              title="Rétablir (Ctrl+Y)"
            >
              <Redo className="w-5 h-5" />
            </button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />
          
          <div className="flex flex-col">
            <input 
              type="text" 
              value={designTitle}
              onChange={(e) => setDesignTitle(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-black text-white focus:ring-0 p-0 leading-tight"
              placeholder="Sans titre"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Right Header Options */}
          <div className="flex items-center bg-white/5 rounded-xl px-2 py-1 space-x-2 border border-white/5">
            <button 
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} 
              className="p-1 hover:bg-white/10 rounded-lg text-white/70"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(Math.min(3, zoom + 0.1))} 
              className="p-1 hover:bg-white/10 rounded-lg text-white/70"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* AI Assistant Button */}
          <button 
            onClick={() => {
              setActiveTab('ai');
              setIsMobileSidebarOpen(true);
            }}
            className="flex items-center h-10 px-5 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-xl font-black transition-all text-sm shadow-lg shadow-purple-500/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            IA Assistant
          </button>

          <button className="flex items-center h-10 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all text-sm border border-white/5">
            <MessageCircle className="w-4 h-4 mr-2" />
            Session invité
          </button>

          <button 
            onClick={() => handleExport()}
            className="flex items-center h-10 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all text-sm border border-white/5"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>

          {(isAdmin || isManager) && (
            <button 
              onClick={() => {
                setIsOrdering(false);
                setIsSaveModalOpen(true);
              }}
              className="flex items-center h-10 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all text-sm border border-white/5"
            >
              <Copy className="w-4 h-4 mr-2" />
              Créer un Modèle
            </button>
          )}
          
          <button 
            onClick={() => {
              setIsOrdering(true);
              setIsSaveModalOpen(true);
            }}
            className="flex items-center h-10 px-6 bg-white text-black rounded-xl font-black hover:bg-gray-100 transition-all text-sm shadow-xl"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Commander
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative bg-[#f3f4f6]">
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

        {/* Left Sidebar (Narrow) */}
        <aside className="w-[72px] bg-white border-r border-gray-100 flex flex-col items-center py-4 z-50 flex-shrink-0 shadow-lg overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              className={`w-full py-3 flex flex-col items-center justify-center transition-all ${
                activeTab === tab.id 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-primary/10' : ''}`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold mt-1 text-center leading-tight px-1">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Detail Panel */}
        <div 
          className={`w-80 bg-white border-r border-gray-100 flex flex-col z-40 transition-all duration-300 ${
            activeTab ? 'translate-x-0' : '-translate-x-full absolute overflow-hidden'
          }`}
        >
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto h-full custom-scrollbar">
              {activeTab === 'options' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-black text-gray-900">Options du Design</h2>
                  
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Plan de Travail</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {TEMPLATE_CATEGORIES.map(cat => (
                        <button
                          key={cat.name}
                          onClick={() => {
                            setCanvasDimensions({ width: cat.width, height: cat.height });
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            canvasDimensions.width === cat.width && canvasDimensions.height === cat.height
                              ? 'bg-primary/5 border-primary text-primary shadow-sm'
                              : 'bg-gray-50 border-transparent hover:border-gray-200 text-gray-700'
                          }`}
                        >
                          <div className="text-left font-bold">
                            <p className="text-sm">{cat.name}</p>
                            <p className="text-[10px] opacity-70">{cat.width} x {cat.height} px</p>
                          </div>
                          {canvasDimensions.width === cat.width && canvasDimensions.height === cat.height && (
                            <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center scale-90">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Affichage</h4>
                    <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                      <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-all">
                        <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
                        <span className="text-sm font-bold text-gray-700">Afficher la Grille</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-all">
                        <input type="checkbox" checked={showRulers} onChange={(e) => setShowRulers(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
                        <span className="text-sm font-bold text-gray-700">Afficher les Règles</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-all">
                        <input type="checkbox" checked={showMargins} onChange={(e) => setShowMargins(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
                        <span className="text-sm font-bold text-gray-700">Marges d'impression</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-all">
                        <input type="checkbox" checked={showBleed} onChange={(e) => setShowBleed(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4" />
                        <span className="text-sm font-bold text-gray-700">Fond perdu (Bleed)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'layers' && (
                <div className="space-y-4">
                  <h3 className="font-black text-lg text-gray-900">Calques</h3>
                  <div className="space-y-2">
                    {[...elements].reverse().map((el, index) => {
                      const isSelected = selectedIds.includes(el.id);
                      let Icon = Shapes;
                      if (el.type === 'text') Icon = Type;
                      if (el.type === 'image') Icon = ImageIcon;
                      
                      return (
                        <div 
                          key={el.id}
                          onClick={() => setSelectedIds([el.id])}
                          className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'bg-gray-50 border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className={`p-2 rounded-xl shadow-sm ${isSelected ? 'bg-white text-primary' : 'bg-white text-gray-500'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 truncate max-w-[120px]">
                              {el.type === 'text' ? el.text : el.type === 'image' ? 'Image' : 'Forme'}
                            </span>
                          </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setElements(elements.map(item => item.id === el.id ? { ...item, hidden: !item.hidden } : item));
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${el.hidden ? 'text-gray-400 hover:bg-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                          <Eye className={`w-4 h-4 ${el.hidden ? 'opacity-50' : ''}`} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setElements(elements.map(item => item.id === el.id ? { ...item, locked: !item.locked } : item));
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${el.locked ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                          {el.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <div className="flex flex-col">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const actualIndex = elements.length - 1 - index;
                              if (actualIndex < elements.length - 1) {
                                const newElements = [...elements];
                                const temp = newElements[actualIndex];
                                newElements[actualIndex] = newElements[actualIndex + 1];
                                newElements[actualIndex + 1] = temp;
                                setElements(newElements);
                              }
                            }}
                            className="p-0.5 text-gray-400 hover:text-gray-700"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const actualIndex = elements.length - 1 - index;
                              if (actualIndex > 0) {
                                const newElements = [...elements];
                                const temp = newElements[actualIndex];
                                newElements[actualIndex] = newElements[actualIndex - 1];
                                newElements[actualIndex - 1] = temp;
                                setElements(newElements);
                              }
                            }}
                            className="p-0.5 text-gray-400 hover:text-gray-700"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {elements.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucun calque
                  </div>
                )}
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
                    
                    // Track AI usage for the current user's tenant
                    if (user) {
                      // In a real SaaS, you'd get the actual tenantId from the user's context
                      // For now, we use the user's UID as their personal tenant ID
                      trackUsage(user.uid, 'ai_generations');
                    }
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

          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Assets</h3>
                <button onClick={() => setActiveTab('templates')} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <AssetLibrary onInsert={(url) => handleAddImageFromUrl(url)} />
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
                      <OptimizedImage src={t.preview} alt={t.name} width={200} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0">
                        <MiniPreview 
                          elements={tElements} 
                          bgColor={tBgColor}
                          profile={profile}
                          contextElements={elements}
                          width={t.design?.width || t.width || 1050}
                          height={t.design?.height || t.height || 600}
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

          {activeTab === 'assets' && (
            <AssetLibrary onInsert={(url) => {
              const newElement: CanvasElement = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'image',
                x: 100,
                y: 100,
                width: 100,
                height: 100,
                src: url
              };
              setElements(prev => [...prev, newElement]);
              toast.success("Asset ajouté au canevas !");
            }} />
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
                          {(isAdmin || isManager || t.userId === user?.uid) && (
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

                {/* Image Filters */}
                {selectedElement.type === 'image' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Filtres Photo</h4>
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600">Luminosité</span>
                          <span className="text-xs font-mono text-gray-400">{Math.round((selectedElement.filters?.brightness || 0) * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="-1" 
                          max="1" 
                          step="0.05" 
                          value={selectedElement.filters?.brightness || 0}
                          onChange={(e) => updateSelectedElement({ filters: { ...selectedElement.filters, brightness: parseFloat(e.target.value) } })}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600">Contraste</span>
                          <span className="text-xs font-mono text-gray-400">{Math.round((selectedElement.filters?.contrast || 0) * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="-100" 
                          max="100" 
                          step="1" 
                          value={selectedElement.filters?.contrast || 0}
                          onChange={(e) => updateSelectedElement({ filters: { ...selectedElement.filters, contrast: parseFloat(e.target.value) } })}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600">Flou</span>
                          <span className="text-xs font-mono text-gray-400">{selectedElement.filters?.blur || 0}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="40" 
                          step="1" 
                          value={selectedElement.filters?.blur || 0}
                          onChange={(e) => updateSelectedElement({ filters: { ...selectedElement.filters, blur: parseFloat(e.target.value) } })}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedElement.filters?.grayscale || false}
                            onChange={(e) => updateSelectedElement({ filters: { ...selectedElement.filters, grayscale: e.target.checked } })}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-gray-600">Noir & Blanc</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedElement.filters?.sepia || false}
                            onChange={(e) => updateSelectedElement({ filters: { ...selectedElement.filters, sepia: e.target.checked } })}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-gray-600">Sépia</span>
                        </label>
                      </div>

                      <button 
                        onClick={() => updateSelectedElement({ filters: {} })}
                        className="w-full py-2 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors mt-2"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </div>
                )}
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
                      onClick={() => updateSelectedElement({ x: (1050 - (selectedElement.width || 100)) / 2 })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Centre
                    </button>
                    <button 
                      onClick={() => updateSelectedElement({ x: 1050 - (selectedElement.width || 100) })}
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
                      onClick={() => updateSelectedElement({ y: (600 - (selectedElement.height || 50)) / 2 })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Milieu
                    </button>
                    <button 
                      onClick={() => updateSelectedElement({ y: 600 - (selectedElement.height || 50) })}
                      className="p-3 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Bas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'color' && selectedElement && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Couleur</h3>
                <button onClick={() => setActiveTab('options')} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Couleur personnalisée</h4>
                  <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-2xl">
                    <div className="relative w-12 h-12 rounded-xl border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                      <input 
                        type="color" 
                        value={selectedElement.fill && selectedElement.fill !== 'transparent' ? selectedElement.fill : '#000000'}
                        onChange={(e) => updateSelectedElement({ fill: e.target.value })}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={(selectedElement.fill || '').toUpperCase()}
                        onChange={(e) => updateSelectedElement({ fill: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-sm font-mono font-bold text-gray-600 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Couleurs du document</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {['#ffffff', '#000000', '#f3f4f6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', bgColor].filter((v, i, a) => a.indexOf(v) === i).map(color => (
                      <button
                        key={color}
                        onClick={() => updateSelectedElement({ fill: color })}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${selectedElement.fill === color ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
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
    </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] relative overflow-hidden">
        {/* Floating Contextual Toolbar */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center bg-white rounded-full shadow-2xl border border-gray-100 py-1.5 px-3 space-x-1 min-h-[48px]">
          <div className="flex items-center space-x-1 pr-2 border-r border-gray-100">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30"><Undo className="w-4 h-4" /></button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30"><Redo className="w-4 h-4" /></button>
          </div>

          {selectedIds.length > 0 && elements.find(el => el.id === selectedIds[0])?.type === 'text' && (
            <div className="flex items-center space-x-1 px-2 border-r border-gray-100">
              <button className="flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700">
                <span>{elements.find(el => el.id === selectedIds[0])?.fontFamily || 'Inter'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="h-4 w-px bg-gray-100 mx-1" />
              <div className="flex items-center space-x-1">
                <button onClick={() => updateSelectedElement({ fontSize: Math.max(1, (elements.find(el => el.id === selectedIds[0])?.fontSize || 16) - 1) })} className="p-1 hover:bg-gray-100 rounded"><Minus className="w-3 h-3" /></button>
                <input 
                  type="number" 
                  value={elements.find(el => el.id === selectedIds[0])?.fontSize || 16}
                  onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                  className="w-10 bg-transparent text-center text-xs font-bold border-none outline-none focus:ring-0"
                />
                <button onClick={() => updateSelectedElement({ fontSize: (elements.find(el => el.id === selectedIds[0])?.fontSize || 16) + 1 })} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-3 h-3" /></button>
              </div>
              <div className="h-4 w-px bg-gray-100 mx-1" />
              <button 
                onClick={() => updateSelectedElement({ fontWeight: (elements.find(el => el.id === selectedIds[0])?.fontWeight === 'bold' ? 'normal' : 'bold') })}
                className={`p-2 rounded-lg transition-all ${elements.find(el => el.id === selectedIds[0])?.fontWeight === 'bold' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button 
                onClick={() => updateSelectedElement({ fontStyle: (elements.find(el => el.id === selectedIds[0])?.fontStyle === 'italic' ? 'normal' : 'italic') })}
                className={`p-2 rounded-lg transition-all ${elements.find(el => el.id === selectedIds[0])?.fontStyle === 'italic' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Underline className="w-4 h-4" /></button>
              <button 
                onClick={() => setActiveTab('color')}
                className="p-1.5 hover:bg-gray-100 rounded-lg flex flex-col items-center"
              >
                <span className="text-sm font-black text-[#a855f7]">A</span>
                <div 
                  className="w-full h-1 rounded-full -mt-0.5" 
                  style={{ backgroundColor: elements.find(el => el.id === selectedIds[0])?.fill || '#000000' }}
                />
              </button>
            </div>
          )}

          {selectedIds.length > 0 && !['text', 'image'].includes(elements.find(el => el.id === selectedIds[0])?.type || '') && (
            <div className="flex items-center space-x-1 px-2 border-r border-gray-100">
              <button 
                onClick={() => setActiveTab('color')}
                className="w-6 h-6 rounded-md border border-gray-200 shadow-sm hover:scale-105 transition-transform"
                style={{ backgroundColor: elements.find(el => el.id === selectedIds[0])?.fill || elements.find(el => el.id === selectedIds[0])?.stroke || '#000000' }}
                title="Couleur"
              />
            </div>
          )}

          <div className="flex items-center space-x-1 pl-1">
            <button onClick={() => setActiveTab('ai')} className="p-2 hover:bg-purple-50 rounded-lg text-purple-600" title="IA Magic"><Sparkles className="w-4 h-4" /></button>
            <button onClick={() => setActiveTab('spacing')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><AlignJustify className="w-4 h-4 rotate-90" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><PaintRoller className="w-4 h-4" /></button>
            <button onClick={() => setActiveTab('position')} className="flex items-center space-x-1 px-3 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700">
              <Layers className="w-3.5 h-3.5" />
              <span>Position</span>
            </button>
            {selectedIds.length > 0 && (
              <button onClick={handleRemoveSelected} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Canvas Stage */}
        <div 
          ref={containerRef} 
          className="flex-1 overflow-auto custom-scrollbar flex p-6 pt-24 md:p-12 md:pt-28"
          onMouseMove={(e) => {
            if (!containerRef.current) return;
            
            // Throttle presence updates to every 100ms
            const now = Date.now();
            if (now - lastCursorUpdateRef.current > 100) {
              const rect = containerRef.current.getBoundingClientRect();
              const x = (e.clientX - rect.left) / stageScale;
              const y = (e.clientY - rect.top) / stageScale;
              updateMyPresence(x, y);
              lastCursorUpdateRef.current = now;
            }
          }}
        >
          <div 
            className="m-auto relative bg-transparent"
            style={{ 
              width: canvasDimensions.width * stageScale, 
              height: canvasDimensions.height * stageScale,
              flexShrink: 0
            }}
          >
            <div 
              className="absolute top-0 left-0 shadow-2xl transition-transform duration-200 ease-out"
              style={{ 
                width: canvasDimensions.width,
                height: canvasDimensions.height,
                transform: `scale(${stageScale})`,
                transformOrigin: 'top left',
                overflow: 'hidden',
                borderRadius: '8px',
                backgroundColor: bgColor
              }}
            >
            <div style={{ 
              width: canvasDimensions.width,
              height: canvasDimensions.height,
              overflow: 'hidden',
              backgroundColor: bgColor,
              position: 'relative'
            }}>
              <FabricCanvas
                ref={stageRef}
                elements={elements}
                setElements={setElements}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                bgColor={bgColor}
                stageScale={stageScale}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                showGrid={showGrid}
                guides={guides}
                blocks={blocks}
                user={user}
                others={others}
                onTextDoubleClick={handleTextDoubleClick}
              />
            </div>

            {/* Text Editing Overlay */}
            {editingTextId && (
              <textarea
                className="fabric-text-editor"
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
                  position: 'absolute',
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
        </div>

        {/* Bottom Bar Controls */}
        <div className="h-16 bg-white border-t border-gray-100 flex items-center justify-between px-6 z-40">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              {pages.map((p, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentPageIndex(index)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    currentPageIndex === index 
                      ? 'bg-white shadow-sm text-gray-900 border border-gray-100' 
                      : 'hover:bg-white text-gray-400'
                  }`}
                >
                  Page {index + 1}
                </button>
              ))}
              <button 
                onClick={() => {
                  setPages(prev => [...prev, { elements: [], bgColor: '#ffffff' }]);
                  setCurrentPageIndex(pages.length);
                }}
                className="p-1.5 hover:bg-white rounded-lg text-gray-400 transition-all border border-dashed border-gray-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <Timer className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-3 group">
                <div className="relative w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary/30 w-full" 
                    style={{ clipPath: `inset(0 ${100 - (zoom * 100 / 2)}% 0 0)` }} 
                  />
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary rounded-full shadow-md z-0 pointer-events-none transition-transform group-hover:scale-125"
                    style={{ left: `${(zoom - 0.1) / 1.9 * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-gray-500 w-8">{Math.round(zoom * 100)}%</span>
              </div>
            </div>

            <div className="flex items-center bg-[#00cba9] text-white px-3 py-1.5 rounded-full space-x-2 shadow-lg shadow-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-black tracking-wider uppercase">En Ligne</span>
              <Sparkles className="w-3 h-3" />
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
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              {isOrdering ? (
                <>
                  {/* Left Side: Preview & Settings */}
                  <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-3xl font-black text-ink">Finaliser ma commande</h3>
                        <p className="text-gray-500 font-medium tracking-tight">
                          {SERVICES.find(s => s.id === selectedServiceId)?.name || 'Produit'} - Configuration Impression
                        </p>
                      </div>
                      <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                      </button>
                    </div>

                    <div className="space-y-8">
                      {/* Service Selection */}
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Produit d'impression</label>
                        <div className="grid grid-cols-2 gap-3">
                          {SERVICES.filter(s => s.isPrintProduct).map(s => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSelectedServiceId(s.id);
                                if (s.quantityTiers && s.quantityTiers.length > 0) {
                                  setSelectedQuantity(s.quantityTiers[0].quantity);
                                }
                                setSelectedOptions({});
                              }}
                              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                selectedServiceId === s.id 
                                  ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                                  : 'border-gray-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                                  <Printer className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-black text-sm">{s.name}</p>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-tight">{s.subCategory}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quantity Selection */}
                      {selectedServiceId && (
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Quantité souhaitée</label>
                          <div className="flex flex-wrap gap-2">
                            {SERVICES.find(s => s.id === selectedServiceId)?.quantityTiers?.map(tier => (
                              <button
                                key={tier.quantity}
                                onClick={() => setSelectedQuantity(tier.quantity)}
                                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                  selectedQuantity === tier.quantity 
                                    ? 'bg-primary text-white shadow-lg' 
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {tier.quantity} ex.
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 italic">* Prix dégressifs appliqués selon la quantité</p>
                        </div>
                      )}

                      {/* Options Selection */}
                      {selectedServiceId && SERVICES.find(s => s.id === selectedServiceId)?.printOptions?.map(optGroup => (
                        <div key={optGroup.id}>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{optGroup.label}</label>
                          <div className="flex flex-wrap gap-2">
                            {optGroup.options.map(opt => (
                              <button
                                key={opt.label}
                                onClick={() => setSelectedOptions(prev => ({ ...prev, [optGroup.id]: opt.label }))}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  selectedOptions[optGroup.id] === opt.label 
                                    ? 'bg-ink text-white shadow-md' 
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                                }`}
                              >
                                {opt.label}
                                {opt.priceModifier > 0 && (
                                  <span className="ml-1 text-[8px] opacity-70">+{opt.priceModifier} FCFA</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Recap & Payment */}
                  <div className="w-full md:w-80 bg-gray-50 border-l border-gray-100 p-8 flex flex-col">
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">Récapitulatif</h4>
                      
                      <div className="aspect-[3/2] bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6 shadow-sm p-4 ring-1 ring-black/5">
                         <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 relative group">
                            <MiniPreview 
                              elements={pages[currentPageIndex].elements} 
                              bgColor={pages[currentPageIndex].bgColor} 
                              width={canvasDimensions.width}
                              height={canvasDimensions.height}
                            />
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[8px] bg-white/90 px-2 py-1 rounded-full font-bold text-gray-600 shadow-sm border border-gray-100 tracking-tighter shadow-black/5">Aperçu du Design</span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400 font-bold uppercase tracking-wider">Prix de base</span>
                          <span className="font-mono font-bold text-gray-900">
                            {(() => {
                               const s = SERVICES.find(s => s.id === selectedServiceId);
                               const tier = s?.quantityTiers?.find(t => t.quantity === selectedQuantity);
                               return (tier?.price || 0).toLocaleString();
                            })()} FCFA
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400 font-bold uppercase tracking-wider">Options</span>
                          <span className="font-mono font-bold text-gray-900">
                            {(() => {
                              const s = SERVICES.find(s => s.id === selectedServiceId);
                              let mod = 0;
                              Object.entries(selectedOptions).forEach(([id, val]) => {
                                const g = s?.printOptions?.find(g => g.id === id);
                                const o = g?.options.find(o => o.label === val);
                                if (o) mod += o.priceModifier;
                              });
                              return mod.toLocaleString();
                            })()} FCFA
                          </span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-ink uppercase tracking-wider">Total Final</span>
                            <span className="text-2xl font-black text-primary">
                              {(() => {
                                const s = SERVICES.find(s => s.id === selectedServiceId);
                                const tier = s?.quantityTiers?.find(t => t.quantity === selectedQuantity);
                                let mod = 0;
                                Object.entries(selectedOptions).forEach(([id, val]) => {
                                  const g = s?.printOptions?.find(g => g.id === id);
                                  const o = g?.options.find(o => o.label === val);
                                  if (o) mod += o.priceModifier;
                                });
                                return ((tier?.price || 0) + mod).toLocaleString();
                              })()} FCFA
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Truck className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-900 uppercase">Livraison incluse</p>
                            <p className="text-[9px] text-gray-400">Délai estimé : 48h - 72h</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center gap-3 opacity-60">
                           <Smartphone className="w-4 h-4 text-gray-400" />
                           <span className="text-[9px] font-bold text-gray-400 uppercase">Paiement Mobile & Carte sécurisé</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      <button
                        disabled={isPlacingOrder}
                        onClick={handlePlaceOrder}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isPlacingOrder ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Création...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Confirmer & Payer
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => setIsSaveModalOpen(false)}
                        className="w-full py-3 text-[10px] font-black text-gray-400 uppercase hover:text-gray-600 transition-colors"
                      >
                        Annuler et retourner
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 w-full">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900">Enregistrer le modèle</h3>
                      <p className="text-gray-500 font-medium italic">Réservé à l'administration - Acom Studio Internal</p>
                    </div>
                    <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section className="space-y-6">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <StickyNote className="w-4 h-4" /> Informations générales
                        </h4>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Nom du modèle <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Ex: Carte de visite moderne"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
                            <input
                              list="categories-list"
                              value={templateCategory}
                              onChange={(e) => {
                                setTemplateCategory(e.target.value);
                                const matchedCat = STUDIO_CATEGORIES.find(c => c.name === e.target.value);
                                if (matchedCat && matchedCat.subs.length > 0) {
                                  setTemplateSubCategory(matchedCat.subs[0]);
                                } else {
                                  setTemplateSubCategory('');
                                }
                              }}
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
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
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                            />
                            <datalist id="subcategories-list">
                              {(STUDIO_CATEGORIES.find(c => c.name === templateCategory)?.subs || STUDIO_CATEGORIES.flatMap(c => c.subs)).map(sub => (
                                <option key={sub} value={sub} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-6">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Crown className="w-4 h-4" /> Tarification & Visibilité
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Prix (FCFA / Unit)</label>
                            <input
                              type="number"
                              min="0"
                              value={templatePrice}
                              onChange={(e) => setTemplatePrice(e.target.value)}
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                            />
                          </div>
                          <div className="flex items-center pt-8">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={templatePromotion}
                                onChange={(e) => setTemplatePromotion(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary relative"></div>
                              <span className="ml-3 text-sm font-bold text-gray-700">En promotion</span>
                            </label>
                          </div>
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
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                            />
                          </div>
                        )}

                        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                          <button
                            onClick={() => setIsSaveModalOpen(false)}
                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all font-mono uppercase tracking-widest text-[10px]"
                          >
                            Abandonner
                          </button>
                          <button
                            onClick={saveAsTemplate}
                            className="px-8 py-4 bg-ink text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center gap-2 uppercase tracking-widest text-[10px]"
                          >
                            <Save className="w-4 h-4" />
                            Publier le modèle
                          </button>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}
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
