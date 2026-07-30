import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Palette, Check, Pipette, Sparkles, Sliders, RotateCcw, Copy, Eye } from 'lucide-react';
import { EmbroideryLayer } from '../services/embroideryServices';

export const MADEIRA_POLYNEON_THREADS = [
  { code: '1800', name: 'Noir Ink', hex: '#111827' },
  { code: '1801', name: 'Blanc Neige', hex: '#FFFFFF' },
  { code: '1824', name: 'Or Impérial', hex: '#FFD700' },
  { code: '1838', name: 'Bleu Royal', hex: '#1E3A8A' },
  { code: '1839', name: 'Rouge Cramoisi', hex: '#DC2626' },
  { code: '1851', name: 'Vert Émeraude', hex: '#059669' },
  { code: '1880', name: 'Violet Évêque', hex: '#7C3AED' },
  { code: '1911', name: 'Rose Soie', hex: '#F43F5E' },
  { code: '1842', name: 'Orange Solaire', hex: '#F97316' },
  { code: '1845', name: 'Cyan Lagon', hex: '#06B6D4' },
  { code: '1920', name: 'Bronze Antique', hex: '#B45309' },
  { code: '1930', name: 'Gris Platine', hex: '#9CA3AF' },
];

// --- Color Conversion Helpers ---

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 6) {
    return { r: 168, g: 85, b: 247 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const hex = ((clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).padStart(6, '0');
  return `#${hex.toUpperCase()}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = (h % 360 + 360) % 360 / 60;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
  else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
  else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
  else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
  else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
  else if (h >= 5 && h < 6) { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/**
  Generate 7 shades and tints around a base hex color
 */
export function generateShadesAndTints(hex: string): { label: string; hex: string }[] {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  const steps = [
    { label: 'Très clair', l: Math.min(95, l + 35) },
    { label: 'Clair', l: Math.min(85, l + 22) },
    { label: 'Nuance +', l: Math.min(75, l + 10) },
    { label: 'Couleur', l },
    { label: 'Nuance -', l: Math.max(15, l - 10) },
    { label: 'Foncé', l: Math.max(10, l - 22) },
    { label: 'Très foncé', l: Math.max(5, l - 35) }
  ];

  return steps.map(step => {
    const rgb = hslToRgb(h, s, step.l);
    return {
      label: step.label,
      hex: rgbToHex(rgb.r, rgb.g, rgb.b)
    };
  });
}

export function findMatchingThreadName(hex: string): string {
  const normHex = hex.toUpperCase();
  const exact = MADEIRA_POLYNEON_THREADS.find(t => t.hex.toUpperCase() === normHex);
  if (exact) return `${exact.name} (#${exact.code})`;

  // Calculate nearest color distance
  const targetRgb = hexToRgb(normHex);
  let minDistance = Infinity;
  let bestMatch = '';

  MADEIRA_POLYNEON_THREADS.forEach(t => {
    const tRgb = hexToRgb(t.hex);
    const dist = Math.hypot(targetRgb.r - tRgb.r, targetRgb.g - tRgb.g, targetRgb.b - tRgb.b);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = `${t.name} (#${t.code})`;
    }
  });

  return minDistance < 40 ? bestMatch : 'Couleur Personnalisée';
}

interface ProfessionalColorPaletteProps {
  layers: EmbroideryLayer[];
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  applyColorToSelectedLayers: (colorHex: string, colorName?: string) => void;
}

export const ProfessionalColorPalette: React.FC<ProfessionalColorPaletteProps> = ({
  layers,
  selectedLayerId,
  selectedLayerIds,
  applyColorToSelectedLayers
}) => {
  // Find currently active layer or first selected
  const activeLayer = useMemo(() => {
    if (selectedLayerIds.length > 0) {
      return layers.find(l => selectedLayerIds.includes(l.id)) || null;
    }
    return layers.find(l => l.id === selectedLayerId) || null;
  }, [layers, selectedLayerId, selectedLayerIds]);

  const activeColorHex = activeLayer?.color || '#A855F7';

  // Local color state for smooth editing
  const [currentHex, setCurrentHex] = useState<string>(activeColorHex);
  const [rgbInput, setRgbInput] = useState<{ r: string; g: string; b: string }>({ r: '168', g: '85', b: '247' });
  const [hslInput, setHslInput] = useState<{ h: string; s: string; l: string }>({ h: '270', s: '91', l: '65' });
  const [recentColors, setRecentColors] = useState<string[]>([
    '#111827', '#FFFFFF', '#FFD700', '#1E3A8A', '#DC2626', '#059669', '#7C3AED', '#F43F5E'
  ]);
  const [activeTab, setActiveTab] = useState<'picker' | 'polyneon' | 'project'>('picker');
  const [copiedHex, setCopiedHex] = useState<boolean>(false);

  // Sync inputs when active color changes externally
  useEffect(() => {
    setCurrentHex(activeColorHex);
    const rgb = hexToRgb(activeColorHex);
    setRgbInput({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setHslInput({ h: String(hsl.h), s: String(hsl.s), l: String(hsl.l) });
  }, [activeColorHex]);

  // Apply color handler with recent colors history tracking
  const handleApplyColor = useCallback((hex: string, threadName?: string) => {
    const formattedHex = hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
    setCurrentHex(formattedHex);

    const rgb = hexToRgb(formattedHex);
    setRgbInput({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setHslInput({ h: String(hsl.h), s: String(hsl.s), l: String(hsl.l) });

    // Track recent colors
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toUpperCase() !== formattedHex);
      return [formattedHex, ...filtered].slice(0, 10);
    });

    applyColorToSelectedLayers(formattedHex, threadName || findMatchingThreadName(formattedHex));
  }, [applyColorToSelectedLayers]);

  // 2D Saturation / Brightness Canvas Picker
  const pickerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hsvRef = useRef<{ h: number; s: number; v: number }>(rgbToHsv(168, 85, 247));
  const isDraggingPicker = useRef<boolean>(false);

  useEffect(() => {
    const rgb = hexToRgb(currentHex);
    hsvRef.current = rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [currentHex]);

  // Draw 2D HSV Canvas
  const drawPickerCanvas = useCallback(() => {
    const canvas = pickerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Fill hue base color
    const hueRgb = hsvToRgb(hsvRef.current.h, 100, 100);
    ctx.fillStyle = `rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b})`;
    ctx.fillRect(0, 0, width, height);

    // Horizontal White Gradient (Saturation 0 -> 100)
    const gradWhite = ctx.createLinearGradient(0, 0, width, 0);
    gradWhite.addColorStop(0, 'rgba(255,255,255,1)');
    gradWhite.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradWhite;
    ctx.fillRect(0, 0, width, height);

    // Vertical Black Gradient (Value 100 -> 0)
    const gradBlack = ctx.createLinearGradient(0, 0, 0, height);
    gradBlack.addColorStop(0, 'rgba(0,0,0,0)');
    gradBlack.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gradBlack;
    ctx.fillRect(0, 0, width, height);

    // Draw handle cursor
    const handleX = (hsvRef.current.s / 100) * width;
    const handleY = (1 - hsvRef.current.v / 100) * height;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(handleX, handleY, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(handleX, handleY, 7, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  useEffect(() => {
    drawPickerCanvas();
  }, [drawPickerCanvas, currentHex]);

  const updatePickerFromMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = pickerCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    hsvRef.current.s = s;
    hsvRef.current.v = v;

    const rgb = hsvToRgb(hsvRef.current.h, s, v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    handleApplyColor(hex);
  };

  // Generate Shades and Tints
  const shadesAndTints = useMemo(() => {
    return generateShadesAndTints(currentHex);
  }, [currentHex]);

  // Extract Project Colors (Couleurs du motif actuel)
  const projectColors = useMemo(() => {
    const colorMap = new Map<string, { count: number; name: string }>();
    layers.forEach(l => {
      const hex = l.color ? l.color.toUpperCase() : '#FFFFFF';
      const existing = colorMap.get(hex);
      if (existing) {
        existing.count += 1;
      } else {
        colorMap.set(hex, {
          count: 1,
          name: l.colorName || findMatchingThreadName(hex)
        });
      }
    });
    return Array.from(colorMap.entries()).map(([hex, info]) => ({
      hex,
      count: info.count,
      name: info.name
    }));
  }, [layers]);

  // Handle Copy Hex
  const handleCopyHex = () => {
    navigator.clipboard.writeText(currentHex);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 1500);
  };

  const selectedCount = selectedLayerIds.length;
  const selectionLabel =
    selectedCount > 1
      ? `${selectedCount} calques sélectionnés`
      : activeLayer
      ? activeLayer.name
      : 'Aucun calque sélectionné';

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3.5 shadow-2xl text-slate-100">
      {/* Header with Selection Info */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-xs font-bold text-violet-300">Nuancier & Sélecteur Couleur</span>
        </div>
        <span className="text-[10px] font-bold text-violet-200 bg-violet-950/80 border border-violet-800/60 px-2.5 py-0.5 rounded-full truncate max-w-[170px]" title={selectionLabel}>
          {selectionLabel}
        </span>
      </div>

      {/* 1. COULEUR ACTIVE - Grand Aperçu & Données Éditables */}
      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-3">
          {/* Active Color Preview Patch */}
          <div className="relative group shrink-0">
            <div
              className="w-14 h-14 rounded-2xl border-2 border-slate-700 shadow-inner transition-transform group-hover:scale-105"
              style={{ backgroundColor: currentHex }}
            />
            <label
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-2xl cursor-pointer transition-opacity"
              title="Pipette / Couleur système"
            >
              <Pipette className="w-5 h-5 text-white filter drop-shadow" />
              <input
                type="color"
                value={currentHex}
                onChange={(e) => handleApplyColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Couleur Active</span>
              <button
                onClick={handleCopyHex}
                className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                title="Copier le code HEX"
              >
                {copiedHex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHex ? 'Copié' : currentHex}</span>
              </button>
            </div>
            <p className="text-xs font-bold text-white truncate">{findMatchingThreadName(currentHex)}</p>

            {/* HEX Input */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-mono text-slate-400">HEX:</span>
              <input
                type="text"
                value={currentHex}
                onChange={(e) => {
                  const val = e.target.value;
                  setCurrentHex(val);
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    handleApplyColor(val);
                  }
                }}
                className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-violet-500 font-semibold"
                placeholder="#HEX..."
              />
            </div>
          </div>
        </div>

        {/* RGB & HSL Editable Inputs Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
          {/* RGB */}
          <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-850">
            <span className="font-bold text-slate-400">RGB:</span>
            <input
              type="number"
              min="0"
              max="255"
              value={rgbInput.r}
              onChange={(e) => {
                const r = e.target.value;
                setRgbInput(prev => ({ ...prev, r }));
                const newHex = rgbToHex(Number(r) || 0, Number(rgbInput.g) || 0, Number(rgbInput.b) || 0);
                handleApplyColor(newHex);
              }}
              className="w-8 bg-transparent text-center font-mono font-bold text-red-400 focus:outline-none"
              title="Rouge (0-255)"
            />
            <span className="text-slate-600">,</span>
            <input
              type="number"
              min="0"
              max="255"
              value={rgbInput.g}
              onChange={(e) => {
                const g = e.target.value;
                setRgbInput(prev => ({ ...prev, g }));
                const newHex = rgbToHex(Number(rgbInput.r) || 0, Number(g) || 0, Number(rgbInput.b) || 0);
                handleApplyColor(newHex);
              }}
              className="w-8 bg-transparent text-center font-mono font-bold text-emerald-400 focus:outline-none"
              title="Vert (0-255)"
            />
            <span className="text-slate-600">,</span>
            <input
              type="number"
              min="0"
              max="255"
              value={rgbInput.b}
              onChange={(e) => {
                const b = e.target.value;
                setRgbInput(prev => ({ ...prev, b }));
                const newHex = rgbToHex(Number(rgbInput.r) || 0, Number(rgbInput.g) || 0, Number(b) || 0);
                handleApplyColor(newHex);
              }}
              className="w-8 bg-transparent text-center font-mono font-bold text-blue-400 focus:outline-none"
              title="Bleu (0-255)"
            />
          </div>

          {/* HSL */}
          <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-850">
            <span className="font-bold text-slate-400">HSL:</span>
            <span className="font-mono text-violet-300 font-bold">{hslInput.h}°</span>
            <span className="text-slate-600">,</span>
            <span className="font-mono text-violet-300 font-bold">{hslInput.s}%</span>
            <span className="text-slate-600">,</span>
            <span className="font-mono text-violet-300 font-bold">{hslInput.l}%</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('picker')}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'picker' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Sélecteur 2D
        </button>
        <button
          onClick={() => setActiveTab('polyneon')}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'polyneon' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Madeira Polyneon
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${activeTab === 'project' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <span>Couleurs Motif</span>
          <span className="text-[9px] bg-slate-950/60 px-1.5 py-0.2 rounded-full font-mono">{projectColors.length}</span>
        </button>
      </div>

      {/* TAB CONTENT 1: SÉLECTEUR VISUEL INTERACTIF 2D */}
      {activeTab === 'picker' && (
        <div className="space-y-3">
          {/* 2D Canvas Color Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Saturation / Luminosité (2D)</span>
              <span>Glisser pour ajuster</span>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-md">
              <canvas
                ref={pickerCanvasRef}
                width={260}
                height={120}
                onMouseDown={(e) => {
                  isDraggingPicker.current = true;
                  updatePickerFromMouse(e);
                }}
                onMouseMove={(e) => {
                  if (isDraggingPicker.current) {
                    updatePickerFromMouse(e);
                  }
                }}
                onMouseUp={() => { isDraggingPicker.current = false; }}
                onMouseLeave={() => { isDraggingPicker.current = false; }}
                className="w-full h-[120px] cursor-crosshair block"
              />
            </div>
          </div>

          {/* Hue Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Teinte (Hue)</span>
              <span className="font-mono text-violet-400 font-bold">{hsvRef.current.h}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={hsvRef.current.h}
              onChange={(e) => {
                const newHue = Number(e.target.value);
                hsvRef.current.h = newHue;
                const rgb = hsvToRgb(newHue, hsvRef.current.s, hsvRef.current.v);
                handleApplyColor(rgbToHex(rgb.r, rgb.g, rgb.b));
              }}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer border border-slate-800"
              style={{
                background: 'linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)'
              }}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: MADEIRA POLYNEON NUANCIER */}
      {activeTab === 'polyneon' && (
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold">Fils Madeira Polyneon Officiels:</span>
          <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {MADEIRA_POLYNEON_THREADS.map((thread) => {
              const isSelected = currentHex.toUpperCase() === thread.hex.toUpperCase();
              return (
                <button
                  key={thread.code}
                  onClick={() => handleApplyColor(thread.hex, `${thread.name} (#${thread.code})`)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-violet-600/30 border-violet-500 ring-1 ring-violet-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 border border-slate-700 shadow-sm relative flex items-center justify-center"
                    style={{ backgroundColor: thread.hex }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white filter drop-shadow invert" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate">{thread.name}</p>
                    <p className="text-[9px] font-mono text-slate-400">#{thread.code} • {thread.hex}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: COULEURS DU MOTIF (PROJECT PALETTE) */}
      {activeTab === 'project' && (
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold">Couleurs utilisées dans le projet actuel:</span>
          {projectColors.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic p-2 text-center">Aucune couleur dans ce motif</p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {projectColors.map((item) => {
                const isSelected = currentHex.toUpperCase() === item.hex.toUpperCase();
                return (
                  <button
                    key={item.hex}
                    onClick={() => handleApplyColor(item.hex, item.name)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/30 border-violet-500 ring-1 ring-violet-500'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-5 h-5 rounded-full shrink-0 border border-slate-700 shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: item.hex }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white filter drop-shadow invert" />}
                      </span>
                      <div className="min-w-0 flex flex-col text-left">
                        <span className="text-xs font-bold text-white truncate">{item.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">{item.hex}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-violet-300 bg-violet-950/80 border border-violet-800/40 px-2 py-0.5 rounded-full">
                      {item.count} calque{item.count > 1 ? 's' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. NUANCES AUTOMATIQUES (Tints & Shades) */}
      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span>Nuances automatiques</span>
          <span className="text-[9px] text-slate-500 font-normal">Clair → Foncé</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {shadesAndTints.map((shade, idx) => {
            const isCurrent = shade.hex.toUpperCase() === currentHex.toUpperCase();
            return (
              <button
                key={idx}
                onClick={() => handleApplyColor(shade.hex)}
                className={`h-7 rounded-lg border transition-transform cursor-pointer relative flex items-center justify-center ${
                  isCurrent ? 'border-white ring-2 ring-violet-500 scale-105 z-10' : 'border-slate-800 hover:scale-105'
                }`}
                style={{ backgroundColor: shade.hex }}
                title={`${shade.label} (${shade.hex})`}
              >
                {isCurrent && <Check className="w-3.5 h-3.5 text-white filter drop-shadow invert" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. COULEURS RÉCENTES */}
      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span>Couleurs récentes</span>
          <button
            onClick={() => setRecentColors([])}
            className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            Effacer
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {recentColors.map((hex, idx) => {
            const isSelected = currentHex.toUpperCase() === hex.toUpperCase();
            return (
              <button
                key={idx}
                onClick={() => handleApplyColor(hex)}
                className={`w-6 h-6 rounded-full border shrink-0 transition-transform cursor-pointer relative flex items-center justify-center ${
                  isSelected ? 'border-white scale-110 ring-2 ring-violet-500' : 'border-slate-800 hover:scale-105'
                }`}
                style={{ backgroundColor: hex }}
                title={`Récente: ${hex}`}
              >
                {isSelected && <Check className="w-3 h-3 text-white filter drop-shadow invert" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
