import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Upload, ArrowRight, Layers, Sliders, CheckCircle2, 
  RefreshCw, ZoomIn, ZoomOut, Download, FileCode, Play, Cpu, 
  ShieldCheck, AlertTriangle, Eye, EyeOff, Scissors, Palette, MoveHorizontal, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiUpscalerService, UpscaleOptions, UpscaleResult } from '../services/AiUpscalerService';
import { VectorizationPipelineService, VectorizationOptions, VectorizationResult } from '../services/VectorizationPipelineService';
import { EmbroideryLayer } from '../services/embroideryServices';
import { PsdImportService, PsdParseResult, PsdLayerItem } from '../services/PsdImportService';
import { PsdImportModal } from './PsdImportModal';

interface ImageUpscaleVectorizerPanelProps {
  onInjectLayersIntoAEE?: (layers: EmbroideryLayer[], upscaledDataUrl: string) => void;
  onClose?: () => void;
}

export const ImageUpscaleVectorizerPanel: React.FC<ImageUpscaleVectorizerPanelProps> = ({
  onInjectLayersIntoAEE,
  onClose
}) => {
  // State 1: Image Source
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; width: number; height: number; sizeKb: number } | null>(null);

  // State 2: Step 1 Upscaling Controls
  const [upscaleOptions, setUpscaleOptions] = useState<UpscaleOptions>({
    scaleFactor: 8,
    denoiseLevel: 15,
    sharpness: 90,
    contrastBoost: 15,
    preserveColors: true,
    useAiVisionRefinement: true
  });
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleResult, setUpscaleResult] = useState<UpscaleResult | null>(null);

  // State 3: Step 2 Vectorization Controls
  const [vectorOptions, setVectorOptions] = useState<VectorizationOptions>({
    numberofcolors: 6,
    colorsampling: 2,
    curveFittingSmoothness: 1.5,
    minPathAreaPixels: 15,
    strokeWidth: 1.5,
    stitchTypeStrategy: 'auto',
    ignoreBackground: true
  });
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [vectorResult, setVectorResult] = useState<VectorizationResult | null>(null);

  // State 4: UI Active View Mode (split, original, upscaled, svg)
  const [activeTab, setActiveTab] = useState<'step1_upscale' | 'step2_vectorize' | 'comparison'>('step1_upscale');
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [injectedSuccess, setInjectedSuccess] = useState(false);
  const [showWhiteBg, setShowWhiteBg] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // PSD Modal state
  const [psdModalData, setPsdModalData] = useState<PsdParseResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Initialisation avec une image exemple par défaut (logo basse résolution)
  useEffect(() => {
    loadDefaultSampleLogo();
  }, []);

  const loadDefaultSampleLogo = () => {
    // Canvas exemple 64x64px très basse résolution
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fond blanc
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 64, 64);
      // Cercle bleu
      ctx.fillStyle = '#1E40AF';
      ctx.beginPath();
      ctx.arc(32, 32, 22, 0, Math.PI * 2);
      ctx.fill();
      // Motif étoile dorée
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(32, 32, 10, 0, Math.PI * 2);
      ctx.fill();
      // Texte broderie miniature
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('AEE', 22, 35);

      const dataUrl = canvas.toDataURL('image/png');
      setSelectedImage(dataUrl);
      setImageMeta({
        name: 'logo_basse_def_64x64.png',
        width: 64,
        height: 64,
        sizeKb: 3.2
      });
    }
  };

  const processFile = (file: File) => {
    if (file.name.toLowerCase().endsWith('.psd')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          try {
            const parsedPsd = await PsdImportService.parsePsd(event.target.result, file.name);
            setPsdModalData(parsedPsd);
          } catch (err: any) {
            alert(err.message || "Erreur de lecture du fichier PSD");
          }
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || img.width || 1024;
        const h = img.naturalHeight || img.height || 1024;
        setSelectedImage(dataUrl);
        setImageMeta({
          name: file.name,
          width: w,
          height: h,
          sizeKb: Math.round(file.size / 1024)
        });
        setUpscaleResult(null);
        setVectorResult(null);
        setInjectedSuccess(false);
      };
      img.onerror = () => {
        setSelectedImage(dataUrl);
        setImageMeta({
          name: file.name,
          width: 1024,
          height: 1024,
          sizeKb: Math.round(file.size / 1024)
        });
        setUpscaleResult(null);
        setVectorResult(null);
        setInjectedSuccess(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Exécution de l'Étape 1 (Upscaling IA)
  const runUpscalePipeline = async () => {
    if (!selectedImage) return;
    setIsUpscaling(true);
    try {
      const res = await AiUpscalerService.upscaleImage(selectedImage, upscaleOptions);
      setUpscaleResult(res);
      setActiveTab('step1_upscale');

      // Automatiquement enchaîner la vectorisation
      await runVectorizationPipeline(res.upscaledCanvas);
    } catch (err) {
      console.error("[Upscale Pipeline] Error:", err);
    } finally {
      setIsUpscaling(false);
    }
  };

  // Exécution de l'Étape 2 (Vectorisation SVG)
  const runVectorizationPipeline = async (targetCanvas?: HTMLCanvasElement) => {
    const canvasToVectorize = targetCanvas || upscaleResult?.upscaledCanvas || selectedImage;
    if (!canvasToVectorize) return;

    setIsVectorizing(true);
    // Garder l'onglet actif de l'utilisateur au lieu de basculer violemment sur step2_vectorize
    try {
      const res = await VectorizationPipelineService.vectorizeUpscaledImage(
        canvasToVectorize,
        vectorOptions
      );
      setVectorResult(res);
    } catch (err) {
      console.error("[Vectorization Pipeline] Error:", err);
    } finally {
      setIsVectorizing(false);
    }
  };

  // Injection dans AEE Studio
  const handleInjectToAEE = () => {
    if (!vectorResult || !onInjectLayersIntoAEE) return;
    const dataUrl = upscaleResult?.upscaledDataUrl || selectedImage || '';
    onInjectLayersIntoAEE(vectorResult.layers, dataUrl);
    setInjectedSuccess(true);
    setTimeout(() => setInjectedSuccess(false), 4000);
  };

  // Gestion du curseur de comparaison split Before / After
  const handleMouseMoveSplit = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!splitContainerRef.current || !isDraggingSplit) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPosition(pct);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-slate-950 text-slate-100 rounded-2xl border transition-all shadow-2xl overflow-hidden flex flex-col max-w-7xl mx-auto my-4 min-h-[720px] ${
        isDraggingOver ? 'border-cyan-400 ring-4 ring-cyan-500/20' : 'border-slate-800'
      }`}
    >
      {/* Visual Dropzone Overlay when file is dragged over */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-cyan-400 rounded-2xl animate-in fade-in duration-150">
          <div className="p-5 bg-cyan-500/20 text-cyan-400 rounded-3xl border border-cyan-500/40 mb-3 shadow-2xl">
            <Upload className="w-12 h-12 animate-bounce" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Déposez votre fichier Photoshop (PSD) ou Image ici</h3>
          <p className="text-xs text-cyan-300 mt-1 font-medium">Analyse instantanée des calques & vectorisation AEE</p>
        </div>
      )}
      {/* Header Panel */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Pipeline d'Upscaling IA & Vectorisation SVG
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                AEE Engine v2.4
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Restauration des logos basse résolution pour numérisation et piquage de broderie parfait.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.svg,.psd,image/vnd.adobe.photoshop"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium border border-slate-700 flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            Charger une Image
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
        
        {/* Left Column: Pipeline Controls (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 p-5 border-r border-slate-800 flex flex-col justify-between gap-6 overflow-y-auto max-h-[780px]">
          <div className="space-y-6">

            {/* Step 1: Upscaling IA Section */}
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  Étape 1: Upscaling IA & Dénoyage
                </span>
                {upscaleResult && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 font-mono">
                    x{upscaleResult.scaleRatio} HD Ready
                  </span>
                )}
              </div>

              {/* Facteur d'agrandissement */}
              <div className="space-y-2 mb-4">
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Facteur de Réhésolution (Scale Ratio)</span>
                  <span className="text-indigo-400 font-mono font-bold">
                    x{upscaleOptions.scaleFactor === 100 ? '100 (HD Mode)' : upscaleOptions.scaleFactor}
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 4, 8, 16, 100].map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setUpscaleOptions({ ...upscaleOptions, scaleFactor: sc as any })}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        upscaleOptions.scaleFactor === sc
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {sc === 100 ? '100x' : `x${sc}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders Denoise & Sharpness */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Dénoyage (Noise Reduction)</span>
                    <span className="text-slate-200 font-mono">{upscaleOptions.denoiseLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={upscaleOptions.denoiseLevel}
                    onChange={(e) => setUpscaleOptions({ ...upscaleOptions, denoiseLevel: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Netteté des Contours (Sharpness)</span>
                    <span className="text-slate-200 font-mono">{upscaleOptions.sharpness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={upscaleOptions.sharpness}
                    onChange={(e) => setUpscaleOptions({ ...upscaleOptions, sharpness: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={runUpscalePipeline}
                disabled={isUpscaling || !selectedImage}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
              >
                {isUpscaling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Calcul du Super-Sampling IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Lancer l'Upscaling IA x{upscaleOptions.scaleFactor}
                  </>
                )}
              </button>
            </div>

            {/* Step 2: Vectorisation SVG Section */}
            <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/20 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  Étape 2: Vectorisation (Raster vers SVG)
                </span>
                {vectorResult && (
                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-mono">
                    {vectorResult.pathCount} contours SVG
                  </span>
                )}
              </div>

              {/* Nombre de Couleurs Fil */}
              <div className="space-y-2 mb-3">
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Palette de Fils (Couleurs de Broderie)</span>
                  <span className="text-purple-400 font-mono font-bold">{vectorOptions.numberofcolors} couleurs</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="16"
                  value={vectorOptions.numberofcolors}
                  onChange={(e) => setVectorOptions({ ...vectorOptions, numberofcolors: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Smoothness et Noise Threshold */}
              <div className="space-y-3 mb-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Lissage des Courbes Bézier</span>
                    <span className="text-slate-200 font-mono">{vectorOptions.curveFittingSmoothness}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={vectorOptions.curveFittingSmoothness}
                    onChange={(e) => setVectorOptions({ ...vectorOptions, curveFittingSmoothness: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Filtrage du bruit (Surface min en px²)</span>
                    <span className="text-slate-200 font-mono">{vectorOptions.minPathAreaPixels} px²</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={vectorOptions.minPathAreaPixels}
                    onChange={(e) => setVectorOptions({ ...vectorOptions, minPathAreaPixels: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>

              {/* Ignorer le fond / arrière-plan (Recommandé) */}
              <div 
                className="flex items-center justify-between p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 mb-3 cursor-pointer hover:border-slate-700 transition"
                onClick={() => setVectorOptions({ ...vectorOptions, ignoreBackground: !(vectorOptions.ignoreBackground ?? true) })}
              >
                <div className="space-y-0.5 text-left pr-2">
                  <div className="text-xs font-semibold text-slate-200">Ignorer le fond / cadre extérieur</div>
                  <div className="text-[10px] text-slate-400">Exclut le grand rectangle de fond pour ne broder que le logo</div>
                </div>
                <input
                  type="checkbox"
                  checked={vectorOptions.ignoreBackground ?? true}
                  onChange={(e) => setVectorOptions({ ...vectorOptions, ignoreBackground: e.target.checked })}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer accent-purple-500"
                />
              </div>

              <button
                onClick={() => runVectorizationPipeline()}
                disabled={isVectorizing || (!selectedImage && !upscaleResult)}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition disabled:opacity-50"
              >
                {isVectorizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Vectorisation en cours...
                  </>
                ) : (
                  <>
                    <FileCode className="w-4 h-4" />
                    Générer les Contours Vectoriels SVG
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Bottom Action: Inject to AEE Studio */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={handleInjectToAEE}
              disabled={!vectorResult}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-xl ${
                injectedSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 disabled:opacity-40'
              }`}
            >
              {injectedSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Couches Vectorielles Injectées dans AEE !
                </>
              ) : (
                <>
                  <Layers className="w-5 h-5" />
                  Injecter dans le Générateur de Points AEE Studio
                </>
              )}
            </button>

            {vectorResult && (
              <div className="flex gap-2">
                <a
                  href={vectorResult.svgDataUrl}
                  download="logo_vectorise_aee.svg"
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs text-center font-medium border border-slate-700 flex items-center justify-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger SVG
                </a>
                {upscaleResult && (
                  <a
                    href={upscaleResult.upscaledDataUrl}
                    download="logo_upscaled_hd.png"
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs text-center font-medium border border-slate-700 flex items-center justify-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PNG HD ({upscaleResult.newWidth}px)
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Preview Canvas & Metrics (8 Cols) */}
        <div className="lg:col-span-8 p-6 bg-slate-950 flex flex-col justify-between space-y-4">
          
          {/* Top Bar Preview Selector */}
          <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('step1_upscale')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'step1_upscale'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Aperçu Upscaling IA
              </button>
              <button
                onClick={() => {
                  setActiveTab('step2_vectorize');
                  if (!vectorResult && !isVectorizing) {
                    runVectorizationPipeline();
                  }
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'step2_vectorize'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Rendu SVG Vectorisé
                {vectorResult && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-purple-900 text-purple-200 rounded-full font-mono font-bold">
                    {vectorResult.pathCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'comparison'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Comparateur Av./Apr. (Split Slider)
              </button>
            </div>

            {/* Metrics Chips */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {imageMeta && (
                <span className="font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                  Origine: {imageMeta.width}×{imageMeta.height}px
                </span>
              )}
              {upscaleResult && (
                <span className="font-mono bg-indigo-950/80 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-800/50 font-bold">
                  HD: {upscaleResult.newWidth}×{upscaleResult.newHeight}px
                </span>
              )}
            </div>
          </div>

          {/* Interactive Canvas Viewer Area */}
          <div className="relative flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center min-h-[420px]">
            
            {/* Tab 1: Upscaling Split / Full View */}
            {activeTab === 'step1_upscale' && (
              <div className="w-full h-full flex items-center justify-center p-4">
                {upscaleResult ? (
                  <div className="relative max-w-full max-h-[450px] shadow-2xl rounded-xl overflow-hidden border border-slate-700 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                    <img
                      src={upscaleResult.upscaledDataUrl}
                      alt="Upscaled AI"
                      className="max-h-[420px] object-contain mx-auto"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-indigo-900/90 text-indigo-200 text-xs font-mono font-bold rounded-lg border border-indigo-500/30 backdrop-blur-md">
                      Upscaling IA x{upscaleResult.scaleRatio} ({upscaleResult.newWidth}×{upscaleResult.newHeight}px)
                    </div>
                  </div>
                ) : selectedImage ? (
                  <div className="relative max-w-full max-h-[450px]">
                    <img
                      src={selectedImage}
                      alt="Original"
                      className="max-h-[380px] object-contain image-rendering-pixelated mx-auto rounded-xl border border-slate-700"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-amber-900/90 text-amber-200 text-xs font-mono font-bold rounded-lg border border-amber-500/30 backdrop-blur-md">
                      Image d'origine (Basse Définition)
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Tab 2: SVG Vectorization Render */}
            {activeTab === 'step2_vectorize' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                {isVectorizing ? (
                  <div className="text-center text-purple-400 space-y-3 py-12">
                    <RefreshCw className="w-10 h-10 mx-auto animate-spin text-purple-500" />
                    <p className="text-sm font-semibold">Calcul de la Vectorisation (Raster vers SVG Bézier)...</p>
                    <p className="text-xs text-slate-400">Extraction des contours de broderie et palette de fils AEE</p>
                  </div>
                ) : vectorResult ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    {/* Toggle Mode Fond */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                      <button
                        onClick={() => setShowWhiteBg(!showWhiteBg)}
                        className="px-3 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md flex items-center gap-2 shadow-md transition cursor-pointer"
                        title="Basculer le fond du rendu vectoriel"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${showWhiteBg ? 'bg-white border border-slate-400' : 'bg-purple-400'}`} />
                        {showWhiteBg ? 'Fond Blanc Standard' : 'Fond Grille Transparent CAO'}
                      </button>
                    </div>

                    <div
                      className={`max-h-[420px] w-full overflow-hidden rounded-xl p-4 border border-purple-500/30 flex items-center justify-center [&>svg]:max-h-[380px] [&>svg]:max-w-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:mx-auto [&>svg]:my-auto ${
                        showWhiteBg
                          ? 'bg-white'
                          : 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: showWhiteBg
                          ? vectorResult.svgString.replace(/data-bg="true"\s*fill="none"/g, 'data-bg="true" fill="#ffffff"')
                          : vectorResult.svgString
                      }}
                    />

                    <div className="absolute top-3 left-3 px-3 py-1 bg-purple-900/90 text-purple-200 text-xs font-mono font-bold rounded-lg border border-purple-500/30 backdrop-blur-md flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5" />
                      Vecteurs SVG Mathématiques ({vectorResult.pathCount} chemins)
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 space-y-3">
                    <FileCode className="w-12 h-12 mx-auto text-purple-500 animate-pulse" />
                    <p className="text-sm">Aucun rendu vectoriel calculé.</p>
                    <button
                      onClick={() => runVectorizationPipeline()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition"
                    >
                      Lancer la Vectorisation SVG
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Interactive Split Slider (Original vs Upscaled) */}
            {activeTab === 'comparison' && (
              <div
                ref={splitContainerRef}
                onMouseDown={() => setIsDraggingSplit(true)}
                onMouseUp={() => setIsDraggingSplit(false)}
                onMouseLeave={() => setIsDraggingSplit(false)}
                onMouseMove={handleMouseMoveSplit}
                className="relative w-full h-full min-h-[420px] select-none cursor-ew-resize overflow-hidden bg-slate-900 flex items-center justify-center"
              >
                {/* Image 2 (Upscaled HD) en arrière plan */}
                {upscaleResult && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={upscaleResult.upscaledDataUrl}
                      alt="Upscaled"
                      className="max-h-[400px] object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-indigo-600/90 text-white text-xs font-bold px-3 py-1 rounded-lg shadow">
                      Après: Upscaling IA x{upscaleResult.scaleRatio} (HD)
                    </div>
                  </div>
                )}

                {/* Image 1 (Original Low Res) découpée par le slider */}
                {selectedImage && (
                  <div
                    className="absolute inset-y-0 left-0 overflow-hidden flex items-center justify-center bg-slate-950 border-r-2 border-white shadow-2xl"
                    style={{ width: `${splitPosition}%` }}
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={selectedImage}
                        alt="Original"
                        className="max-h-[400px] object-contain image-rendering-pixelated"
                      />
                      <div className="absolute top-4 left-4 bg-slate-800/90 text-amber-400 text-xs font-bold px-3 py-1 rounded-lg border border-amber-500/30">
                        Avant: Basse Résolution
                      </div>
                    </div>
                  </div>
                )}

                {/* Vertical Divider Bar handle */}
                <div
                  className="absolute inset-y-0 w-1 bg-white shadow-2xl flex items-center justify-center pointer-events-none"
                  style={{ left: `${splitPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center justify-center shadow-lg border-2 border-slate-900">
                    <MoveHorizontal className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Info Banner & Palette Breakdown */}
          {vectorResult && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Palette Fils Détectée ({vectorResult.colorsUsed.length}):</span>
                <div className="flex items-center gap-2">
                  {vectorResult.colorsUsed.map((col, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
                      title={col.threadCode}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-inner" style={{ backgroundColor: col.hex }} />
                      <span className="text-[10px] font-mono text-slate-300 font-bold">{col.hex}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Score Qualité Vectorielle: <strong>{vectorResult.vectorQualityScore}/100</strong></span>
                </div>
                {upscaleResult && (
                  <div className="text-slate-400 font-mono">
                    Gain Netteté: +{upscaleResult.metrics.sharpnessGain}% | Dénoyage: {upscaleResult.metrics.noiseReductionDb}dB
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {psdModalData && (
        <PsdImportModal
          psdData={psdModalData}
          onClose={() => setPsdModalData(null)}
          onImportComposite={(compositeUrl, fileName) => {
            setSelectedImage(compositeUrl);
            setImageMeta({
              name: fileName,
              width: psdModalData.width,
              height: psdModalData.height,
              sizeKb: psdModalData.fileSizeKb
            });
            setUpscaleResult(null);
            setVectorResult(null);
            setInjectedSuccess(false);
            setPsdModalData(null);
          }}
          onImportSelectedLayers={(selectedLayers) => {
            if (selectedLayers.length > 0) {
              const mainLayer = selectedLayers[0];
              setSelectedImage(mainLayer.dataUrl);
              setImageMeta({
                name: `${psdModalData.fileName} (${mainLayer.name})`,
                width: mainLayer.width,
                height: mainLayer.height,
                sizeKb: psdModalData.fileSizeKb
              });
              setUpscaleResult(null);
              setVectorResult(null);
              setInjectedSuccess(false);
            }
            setPsdModalData(null);
          }}
        />
      )}
    </div>
  );
};
