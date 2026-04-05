import React, { useState, useMemo } from 'react';
import { Product, Variant } from '../../constants/studioAcom';
import { ChevronRight, Box, ShoppingCart, Hash, Info, PenTool } from 'lucide-react';

interface MultiVariantConfiguratorProps {
  product: Product;
  initialVariantId?: string;
  onAddToCart?: (config: any) => void;
  onPersonalize?: (variant: Variant) => void;
}

const MultiVariantConfigurator: React.FC<MultiVariantConfiguratorProps> = ({ product, initialVariantId, onAddToCart, onPersonalize }) => {
  const [activeVariantId, setActiveVariantId] = useState<string>(initialVariantId || product.variants[0].id);
  
  // Update activeVariantId if initialVariantId changes
  React.useEffect(() => {
    if (initialVariantId) {
      setActiveVariantId(initialVariantId);
    }
  }, [initialVariantId]);
  
  // Store config per variant: { quantity: number, customizations: { paperType: string, [key: string]: any } }
  const [configs, setConfigs] = useState<Record<string, { quantity: number, customizations: { paperType: string } }>>({});

  const activeVariant = product.variants.find(v => v.id === activeVariantId) || product.variants[0];
  
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
    <div className="flex h-screen bg-white">
      {/* Sidebar de sélection */}
      <div className="w-72 bg-gray-50 border-r border-gray-100 p-8 flex flex-col">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Variantes du produit</h2>
        <div className="space-y-3 flex-1">
          {product.variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveVariantId(v.id)}
              className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between ${
                activeVariantId === v.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {v.name}
              {activeVariantId === v.id && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">{activeVariant.name}</h1>
              <p className="text-xl font-bold text-gray-400">{product.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Prix Total</p>
              <p className="text-3xl font-black text-primary">{totalPrice} €</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Preview */}
            <div className="space-y-8">
              <div className="aspect-[4/3] bg-gray-50 rounded-[3rem] overflow-hidden border border-gray-100 relative shadow-inner">
                {activeVariant.previewImage ? (
                  <img src={activeVariant.previewImage} alt={activeVariant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Box className="w-20 h-20 opacity-20" /></div>
                )}
              </div>
            </div>

            {/* Config */}
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dimensions</h4>
                  <p className="text-lg font-black text-gray-900">{activeVariant.size}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Finition</h4>
                  <p className="text-lg font-black text-gray-900">{activeVariant.finish}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Info className="w-4 h-4" /> Type de papier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Standard', 'Premium', 'Recyclé'].map(type => (
                    <button
                      key={type}
                      onClick={() => updateConfig(activeVariantId, { customizations: { ...currentConfig.customizations, paperType: type } })}
                      className={`py-3 rounded-xl text-xs font-black transition-all border-2 ${
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

              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Quantité
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map(q => (
                    <button
                      key={q}
                      onClick={() => updateConfig(activeVariantId, { quantity: q })}
                      className={`py-3 rounded-xl text-xs font-black transition-all border-2 ${
                        currentConfig.quantity === q ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-600'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                {onAddToCart && (
                  <button 
                    onClick={() => onAddToCart({ productId: product.id, variantId: activeVariantId, ...currentConfig })}
                    className="flex-1 py-4 bg-primary text-white rounded-xl font-black flex items-center justify-center shadow-xl shadow-primary/20"
                  >
                    <ShoppingCart className="w-5 h-5 mr-3" /> Ajouter au panier
                  </button>
                )}
                {onPersonalize && (
                  <button 
                    onClick={() => onPersonalize(activeVariant)}
                    className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-black flex items-center justify-center"
                  >
                    <PenTool className="w-5 h-5 mr-3" /> Personnaliser
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
