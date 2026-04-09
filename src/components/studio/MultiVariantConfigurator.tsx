import React, { useState, useMemo } from 'react';
import { Product, Variant } from '../../constants/studioAcom';
import { ChevronRight, Box, ShoppingCart, Hash, Info, PenTool } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';

interface MultiVariantConfiguratorProps {
  product: Product;
  initialVariantId?: string;
  onAddToCart?: (config: any) => void;
  onPersonalize?: (variant: Variant) => void;
}

const MultiVariantConfigurator: React.FC<MultiVariantConfiguratorProps> = ({ product, initialVariantId, onAddToCart, onPersonalize }) => {
  const [activeVariantId, setActiveVariantId] = useState<string>(initialVariantId || (product.variants && product.variants.length > 0 ? product.variants[0].id : ''));
  
  // Update activeVariantId if initialVariantId changes or if variants load
  React.useEffect(() => {
    if (initialVariantId) {
      setActiveVariantId(initialVariantId);
    } else if (!activeVariantId && product.variants && product.variants.length > 0) {
      setActiveVariantId(product.variants[0].id);
    }
  }, [initialVariantId, product.variants, activeVariantId]);
  
  // Store config per variant: { quantity: number, customizations: { paperType: string, [key: string]: any } }
  const [configs, setConfigs] = useState<Record<string, { quantity: number, customizations: { paperType: string } }>>({});

  const activeVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find(v => v.id === activeVariantId) || product.variants[0];
  }, [product.variants, activeVariantId]);

  if (!activeVariant) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Get current config for active variant, default to quantity 100, paperType 'Standard'
  const currentConfig = configs[activeVariantId] || { quantity: 100, customizations: { paperType: 'Standard' } };

  const updateConfig = (variantId: string, newConfig: Partial<{ quantity: number, customizations: { paperType: string } }>) => {
    // Logic for "Options liées": If paperType changes, sync to all variants
    if (newConfig.customizations?.paperType) {
      const newPaperType = newConfig.customizations.paperType;
      const updatedConfigs = { ...configs };
      product.variants.forEach(v => {
        updatedConfigs[v.id] = {
          ...(updatedConfigs[v.id] || { quantity: 100, customizations: { paperType: 'Standard' } }),
          customizations: { ...updatedConfigs[v.id]?.customizations, paperType: newPaperType }
        };
      });
      setConfigs(updatedConfigs);
    } else {
      setConfigs(prev => ({ 
        ...prev, 
        [variantId]: { ...(prev[variantId] || { quantity: 100, customizations: { paperType: 'Standard' } }), ...newConfig } 
      }));
    }
  };

  const totalPrice = useMemo(() => {
    // Logic for "Prix dégressif": Calculate total quantity and apply discount
    const totalQty = Object.values(configs).reduce((acc, c) => acc + c.quantity, 0);
    let discount = 0;
    if (totalQty >= 500) discount = 0.20; // 20% off for 500+
    else if (totalQty >= 250) discount = 0.10; // 10% off for 250+
    
    const basePrice = Object.values(configs).reduce((acc, c) => {
      const variant = product.variants.find(v => v.id === activeVariantId) || product.variants[0];
      return acc + (variant.price * c.quantity / 100);
    }, 0);
    
    return (basePrice * (1 - discount)).toFixed(2);
  }, [configs, product.variants, activeVariantId]);

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-screen bg-white">
      {/* Sidebar de sélection */}
      <div className="w-full lg:w-72 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100 p-4 lg:p-8 flex flex-col">
        <h2 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-4 lg:mb-8">Variantes du produit</h2>
        <div className="flex lg:flex-col gap-2 lg:gap-3 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 snap-x snap-mandatory scrollbar-thin">
          {product.variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveVariantId(v.id)}
              className={`whitespace-nowrap lg:whitespace-normal text-left px-4 lg:px-5 py-3 lg:py-4 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold transition-all flex items-center justify-between shrink-0 lg:shrink snap-start ${
                activeVariantId === v.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {v.name}
              <ChevronRight className={`w-3 h-3 lg:w-4 lg:h-4 ml-2 lg:ml-0 ${activeVariantId === v.id ? 'block' : 'hidden lg:block opacity-0'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 lg:p-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 lg:mb-12 gap-4">
            <div>
              <h1 className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-1 lg:mb-2">{activeVariant.name}</h1>
              <p className="text-base lg:text-xl font-bold text-gray-400">{product.name}</p>
            </div>
            <div className="md:text-right bg-primary/5 p-4 rounded-2xl md:bg-transparent md:p-0">
              <p className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest">Prix Total</p>
              <p className="text-2xl lg:text-3xl font-black text-primary">{totalPrice} €</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Preview */}
            <div className="space-y-6 lg:space-y-8">
              <div className="aspect-[4/3] bg-gray-50 rounded-2xl lg:rounded-[3rem] overflow-hidden border border-gray-100 relative shadow-inner">
                {activeVariant.previewImage ? (
                  <OptimizedImage 
                    src={activeVariant.previewImage} 
                    alt={activeVariant.name} 
                    width={800}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Box className="w-20 h-20 opacity-20" /></div>
                )}
              </div>
            </div>

            {/* Config */}
            <div className="space-y-8 lg:space-y-10">
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <div className="p-4 lg:p-6 bg-gray-50 rounded-xl lg:rounded-2xl border border-gray-100">
                  <h4 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 lg:mb-2">Dimensions</h4>
                  <p className="text-base lg:text-lg font-black text-gray-900">{activeVariant.size}</p>
                </div>
                <div className="p-4 lg:p-6 bg-gray-50 rounded-xl lg:rounded-2xl border border-gray-100">
                  <h4 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 lg:mb-2">Finition</h4>
                  <p className="text-base lg:text-lg font-black text-gray-900">{activeVariant.finish}</p>
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <label className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Type de papier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Standard', 'Premium', 'Recyclé'].map(type => (
                    <button
                      key={type}
                      onClick={() => updateConfig(activeVariantId, { customizations: { ...currentConfig.customizations, paperType: type } })}
                      className={`py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-black transition-all border-2 ${
                        currentConfig.customizations.paperType === type 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <label className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Quantité
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map(q => (
                    <button
                      key={q}
                      onClick={() => updateConfig(activeVariantId, { quantity: q })}
                      className={`py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-black transition-all border-2 ${
                        currentConfig.quantity === q ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-600'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-4 lg:pt-6">
                {onAddToCart && (
                  <button 
                    onClick={() => onAddToCart({ productId: product.id, variantId: activeVariantId, ...currentConfig })}
                    className="flex-1 py-3.5 lg:py-4 bg-primary text-white rounded-xl font-black flex items-center justify-center shadow-xl shadow-primary/20 text-sm lg:text-base"
                  >
                    <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" /> Ajouter au panier
                  </button>
                )}
                {onPersonalize && (
                  <button 
                    onClick={() => onPersonalize(activeVariant)}
                    className="flex-1 py-3.5 lg:py-4 bg-gray-900 text-white rounded-xl font-black flex items-center justify-center text-sm lg:text-base"
                  >
                    <PenTool className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" /> Personnaliser
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiVariantConfigurator;
