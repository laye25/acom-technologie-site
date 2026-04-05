import React from 'react';
import { Service } from '../types';
import { CheckCircle2, Tag, Eye, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { isPromotionActive, getDiscountedPrice } from '../lib/promotions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Translate, useTranslation } from '../context/LanguageContext';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const promoActive = isPromotionActive(service);
  const discountedPrice = promoActive ? getDiscountedPrice(service.price, service.promotion!.discountPercentage) : service.price;

  return (
    <>
      <motion.div
        whileHover={{ y: -8 }}
        className="group bg-white border border-black/5 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden flex flex-col h-full"
      >
        <Link to={`/service/${service.id}`} className="block aspect-[4/3] relative overflow-hidden">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://picsum.photos/seed/${service.id}/800/600`;
            }}
          />
          <div className="absolute top-6 right-6">
            <span className="px-4 py-1.5 bg-white text-primary text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl border border-white/20 w-fit">
              <Translate>{service.category}</Translate>
            </span>
          </div>
          {promoActive && (
            <div className="absolute top-6 left-6">
              <span className="px-4 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl border border-primary/20 flex items-center gap-1.5 w-fit">
                <Tag className="w-3 h-3" />
                -{service.promotion?.discountPercentage}% Offre
              </span>
            </div>
          )}
        </Link>
        
        <div className="p-5 md:p-8 flex-grow flex flex-col">
          <Link to={`/service/${service.id}`} className="block">
            <h3 className="text-xl md:text-2xl font-display font-bold text-primary mb-2 md:mb-3 transition-colors group-hover:text-primary-dark">
              <Translate>{service.name}</Translate>
            </h3>
          </Link>
          <p className="text-gray-500 text-xs md:text-sm mb-4 md:mb-6 line-clamp-2 leading-relaxed font-medium">
            <Translate>{service.shortDescription || service.description}</Translate>
          </p>
          
          <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 flex-grow">
            {service.features.slice(0, 3).map((feature, i) => (
              <div key={i} className="flex items-center text-[10px] md:text-xs text-gray-600 font-medium">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-emerald-50 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                  <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-emerald-500" />
                </div>
                <span><Translate>{feature}</Translate></span>
              </div>
            ))}
          </div>
          
          <div className="pt-4 md:pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <span className="text-[8px] md:text-[10px] text-gray-400 block uppercase font-bold tracking-widest mb-1">Investissement</span>
                <div className="flex flex-col">
                  {promoActive && (
                    <span className="text-xs md:text-sm text-gray-400 line-through decoration-primary/30">{service.price.toLocaleString()} FCFA</span>
                  )}
                  <span className="text-xl md:text-2xl font-display font-bold text-ink">
                    {discountedPrice.toLocaleString()} <span className="text-[10px] md:text-xs font-sans font-medium text-gray-400">FCFA</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <Link
                to={`/service/${service.id}`}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-white text-primary border border-primary/20 rounded-none text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span><Translate>Détails</Translate></span>
              </Link>
              <Link
                to={`/order/${service.id}`}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-white rounded-none text-xs font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span><Translate>Commander</Translate></span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ServiceCard;
