import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ZoomIn, ZoomOut, RotateCw, RefreshCw, 
  ChevronLeft, ChevronRight, Info, Download, 
  Maximize2, Minimize2, MessageSquare, ShoppingCart, Tag, Store
} from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  initialIndex: number;
  merchant?: any; // Fallback merchant details
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex,
  merchant
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      resetTransform();
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, zoom, rotation]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[activeIndex];
  if (!currentItem) return null;

  // Extract variables
  const isVehicle = currentItem.pubType === 'vehicle';
  const title = currentItem.name || currentItem.model || "Produit sans nom";
  const image = currentItem.image || (isVehicle ? 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800' : 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800');
  const description = currentItem.description || "Aucune description détaillée n'est disponible.";
  const price = currentItem.price || 0;
  const category = currentItem.category || "Général";
  const itemMerchant = currentItem.page || merchant || currentItem.merchant;
  const merchantName = itemMerchant?.name || "Établissement";
  const merchantLogo = itemMerchant?.logo;
  const currency = itemMerchant?.currency || "FCFA";

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => {
    setZoom(prev => {
      const next = prev - 0.5;
      if (next <= 1) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
      resetTransform();
    } else {
      // Loop to end
      setActiveIndex(items.length - 1);
      resetTransform();
    }
  };

  const handleNext = () => {
    if (activeIndex < items.length - 1) {
      setActiveIndex(prev => prev + 1);
      resetTransform();
    } else {
      // Loop to start
      setActiveIndex(0);
      resetTransform();
    }
  };

  const handleImageDoubleClick = () => {
    if (zoom > 1) {
      resetTransform();
    } else {
      setZoom(2.5);
    }
  };

  // Drag and pan handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Download Image helper
  const handleDownload = async () => {
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_acomzone.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback
      window.open(image, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl overflow-hidden select-none">
        
        {/* Progress indicator top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-55">
          <div 
            className="h-full bg-violet-500 transition-all duration-300" 
            style={{ width: `${((activeIndex + 1) / items.length) * 100}%` }}
          />
        </div>

        {/* Close and Action Bar at Top */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-55 pointer-events-none">
          {/* Item Counter */}
          <div className="bg-black/55 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 text-xs font-black font-mono tracking-wider flex items-center gap-2 pointer-events-auto">
            <span className="text-violet-400">{activeIndex + 1}</span>
            <span className="text-white/30">/</span>
            <span>{items.length}</span>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Toggle details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              title={showDetails ? "Masquer les détails" : "Afficher les détails"}
              className={`p-2.5 rounded-full border transition-all text-white hover:scale-105 active:scale-95 cursor-pointer ${
                showDetails ? 'bg-violet-600 border-violet-500' : 'bg-black/50 border-white/10 hover:bg-white/10'
              }`}
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Rotation */}
            <button
              onClick={handleRotate}
              title="Pivoter"
              className="p-2.5 bg-black/50 border border-white/10 rounded-full text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              title="Zoom arrière (-)"
              className="p-2.5 bg-black/50 border border-white/10 rounded-full text-white hover:bg-white/10 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              title="Zoom avant (+)"
              className="p-2.5 bg-black/50 border border-white/10 rounded-full text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={resetTransform}
              title="Réinitialiser l'affichage"
              className="p-2.5 bg-black/50 border border-white/10 rounded-full text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              title="Télécharger l'image"
              className="p-2.5 bg-black/50 border border-white/10 rounded-full text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-6 bg-white/20 mx-1" />

            {/* Close */}
            <button
              onClick={onClose}
              title="Fermer (Échap)"
              className="p-2.5 bg-rose-600/90 hover:bg-rose-600 border border-rose-500/50 rounded-full text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="w-full h-full flex flex-col md:flex-row items-stretch justify-between pt-16">
          
          {/* Left Canvas Panel: Image View Area */}
          <div 
            className="flex-1 relative flex items-center justify-center p-4 md:p-8 h-full"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Left navigation arrow */}
            <button
              onClick={handlePrev}
              className="absolute left-4 md:left-8 z-40 p-4 bg-black/60 hover:bg-black/85 border border-white/10 rounded-full text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Main Interactive Image Frame */}
            <div 
              className={`relative overflow-hidden w-full h-full flex items-center justify-center transition-all ${
                isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in'
              }`}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleImageDoubleClick}
            >
              <motion.img
                ref={imageRef}
                src={image}
                alt={title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[80vh] md:max-h-[85vh] object-contain select-none pointer-events-none rounded-2xl shadow-2xl"
                animate={{
                  scale: zoom,
                  rotate: rotation,
                  x: pan.x,
                  y: pan.y
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  x: { type: 'tween' },
                  y: { type: 'tween' }
                }}
              />
            </div>

            {/* Right navigation arrow */}
            <button
              onClick={handleNext}
              className="absolute right-4 md:right-8 z-40 p-4 bg-black/60 hover:bg-black/85 border border-white/10 rounded-full text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Right Panel: Side Details View */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, x: 100, width: 0 }}
                animate={{ opacity: 1, x: 0, width: '100%', maxWidth: '380px' }}
                exit={{ opacity: 0, x: 100, width: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="bg-zinc-950/95 border-l border-white/10 h-full w-full flex flex-col justify-between overflow-y-auto text-left z-40"
              >
                {/* Details top half */}
                <div className="p-6 md:p-8 space-y-6 flex-1">
                  
                  {/* Category Badge & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-violet-950/50 border border-violet-800/50 text-violet-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg">
                      {category}
                    </span>
                    {currentItem.stockQuantity !== undefined && currentItem.stockQuantity <= 0 ? (
                      <span className="bg-rose-950/50 border border-rose-800/50 text-rose-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg">
                        Rupture
                      </span>
                    ) : (
                      <span className="bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg">
                        Disponible
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                      {title}
                    </h2>
                    {currentItem.sku && (
                      <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                        Réf / SKU: {currentItem.sku}
                      </p>
                    )}
                  </div>

                  {/* Price Block */}
                  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Tag className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Prix de l'offre</span>
                    </div>
                    <span className="text-xl font-black text-violet-400 font-mono">
                      {price.toLocaleString()} {currency}
                    </span>
                  </div>

                  {/* Description Box */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description détaillée</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed max-h-[150px] overflow-y-auto font-medium pr-2">
                      {description}
                    </p>
                  </div>

                  {/* Merchant card details */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-violet-400" /> Proposé par l'établissement
                    </h4>
                    
                    <div className="flex items-center gap-3 bg-zinc-900/40 border border-white/5 p-3 rounded-2xl">
                      {merchantLogo ? (
                        <img 
                          src={merchantLogo} 
                          alt={merchantName} 
                          className="w-10 h-10 rounded-full object-cover border border-white/10" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500/20 flex items-center justify-center text-white font-extrabold text-sm">
                          {merchantName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-black text-white">{merchantName}</h4>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Partenaire agréé</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Footer / CTA */}
                <div className="p-6 md:p-8 bg-zinc-950/80 border-t border-white/5 space-y-3 shrink-0">
                  <div className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
                    Canal public sécurisé • AcomZone
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AnimatePresence>
  );
};
