import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, ShoppingCart, Check, Info, 
  Maximize2, Palette, Layers, Box, Hash, PenTool
} from 'lucide-react';
import { Product, Variant } from '../../constants/studioAcom';
import { OptimizedImage } from '../OptimizedImage';
import { getImageUrl } from '../../lib/imageUtils';

interface ProductConfiguratorProps {
  product: Product;
  variant: Variant;
  onBack: () => void;
  onAddToCart?: (config: any) => void;
  onPersonalize?: (variant: Variant) => void;
}

const ProductConfigurator: React.FC<ProductConfiguratorProps> = ({ 
  product, 
  variant, 
  onBack, 
  onAddToCart,
  onPersonalize
}) => {
  const [quantity, setQuantity] = useState(100);

  const totalPriceNum = useMemo(() => {
    const minQty = variant.minQuantity || 1;
    const unitPrice = variant.price / minQty;
    return Math.round(unitPrice * quantity);
  }, [quantity, variant]);
  
  const totalPrice = totalPriceNum.toLocaleString();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <button 
          onClick={onBack}
          className="flex items-center space-x-1 md:space-x-2 text-gray-500 hover:text-gray-900 transition-colors font-bold text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden md:inline">Retour au catalogue</span>
        </button>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="text-right">
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Prix Total</p>
            <p className="text-lg md:text-2xl font-black text-primary">{totalPrice} FCFA</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onAddToCart && (
              <button 
                onClick={() => onAddToCart({ 
                  productId: product.id,
                  variantId: variant.id,
                  quantity, 
                  totalPrice 
                })}
                className="p-3 md:px-8 md:py-4 bg-primary text-white rounded-xl md:rounded-2xl font-black flex items-center shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                <ShoppingCart className="w-5 h-5 md:mr-3" />
                <span className="hidden md:inline">Ajouter au panier</span>
              </button>
            )}
            {onPersonalize && (
              <button 
                onClick={() => onPersonalize(variant)}
                className="p-3 md:px-8 md:py-4 bg-gray-900 text-white rounded-xl md:rounded-2xl font-black flex items-center shadow-xl shadow-gray-900/20 hover:scale-105 transition-transform"
              >
                <PenTool className="w-5 h-5 md:mr-3" />
                <span className="hidden md:inline">Personnaliser</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Preview */}
          <div className="space-y-8">
            <div className="aspect-[4/3] bg-gray-50 rounded-[3rem] overflow-hidden border border-gray-100 relative group shadow-inner">
              {getImageUrl(variant) ? (
                <OptimizedImage 
                  src={getImageUrl(variant)} 
                  alt={variant.name} 
                  width={800}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Box className="w-20 h-20 opacity-20" />
                </div>
              )}
              
              <div className="absolute bottom-6 left-6 right-6 flex justify-center space-x-2">
                <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest text-gray-900 border border-white/20">
                  Aperçu en direct
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Description du produit
              </h3>
              <p className="text-gray-600 font-bold leading-relaxed">
                {product.description || "Un produit de haute qualité conçu pour répondre à vos besoins professionnels. Personnalisez chaque détail pour un résultat unique."}
              </p>
            </div>
          </div>

          {/* Right: Configurator */}
          <div className="space-y-10">
            <div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">{variant.name}</h1>
              <p className="text-xl font-bold text-gray-400">{product.name}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dimensions</h4>
                <p className="text-lg font-black text-gray-900">{variant.size}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Finition</h4>
                <p className="text-lg font-black text-gray-900">{variant.finish}</p>
              </div>
            </div>

            {/* Quantities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Quantité
                </label>
                <span className="text-xs font-bold text-primary">{quantity} exemplaires</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map(q => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`py-3 rounded-xl text-xs font-black transition-all border-2 flex flex-col items-center ${
                      quantity === q 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    <span>{q}</span>
                    <span className="text-[9px] opacity-60">{(variant.price * q).toFixed(0)} FCFA</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductConfigurator;
