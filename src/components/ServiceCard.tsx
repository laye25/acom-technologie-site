import React from 'react';
import { Service } from '../types';
import { CheckCircle2, Tag, Eye, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { isPromotionActive, getDiscountedPrice } from '../lib/promotions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Translate, useTranslation } from '../context/LanguageContext';
import { OptimizedImage } from './OptimizedImage';

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
        className="group bg-white dark:bg-[#131c2e] border border-black/5 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden flex flex-col h-full"
      >
        <Link to={`/service/${service.id}`} className="block aspect-[4/3] relative overflow-hidden bg-slate-100/50 dark:bg-slate-900/50">
          <OptimizedImage
            src={service.image}
            alt={service.name}
            width={600}
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-4 right-4">
            <span className="px-3.5 py-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-primary dark:text-purple-300 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg border border-black/5 dark:border-slate-700 w-fit">
              <Translate>{service.category}</Translate>
            </span>
          </div>
          {promoActive && (
            <div className="absolute top-4 left-4">
              <span className="px-3.5 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-xl border border-primary/20 flex items-center gap-1.5 w-fit">
                <Tag className="w-3 h-3" />
                -{service.promotion?.discountPercentage}% Offre
              </span>
            </div>
          )}
        </Link>
        
        <div className="p-5 md:p-8 flex-grow flex flex-col">
          <Link to={`/service/${service.id}`} className="block">
            <h3 className="text-xl md:text-2xl font-display font-bold text-primary dark:text-purple-400 mb-2 md:mb-3 transition-colors group-hover:text-primary-dark dark:group-hover:text-purple-300">
              <Translate>{service.name}</Translate>
            </h3>
          </Link>
          <p className="text-gray-500 dark:text-slate-400 text-xs md:text-sm mb-4 md:mb-6 line-clamp-2 leading-relaxed font-medium">
            <Translate>{service.shortDescription || service.description}</Translate>
          </p>
          
          <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 flex-grow">
            {service.features.slice(0, 3).map((feature, i) => (
              <div key={i} className="flex items-center text-[10px] md:text-xs text-gray-600 dark:text-slate-300 font-medium">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-emerald-50 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mr-2 md:mr-3 flex-shrink-0 border border-emerald-200/50 dark:border-emerald-700/50">
                  <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <span><Translate>{feature}</Translate></span>
              </div>
            ))}
          </div>
          
          <div className="pt-4 md:pt-6 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <span className="text-[8px] md:text-[10px] text-gray-400 dark:text-slate-500 block uppercase font-bold tracking-widest mb-1">Investissement</span>
                <div className="flex flex-col">
                  {promoActive && (
                    <span className="text-xs md:text-sm text-gray-400 dark:text-slate-500 line-through decoration-primary/30">{service.price.toLocaleString()} FCFA</span>
                  )}
                  <span className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white">
                    {discountedPrice.toLocaleString()} <span className="text-[10px] md:text-xs font-sans font-medium text-gray-400 dark:text-slate-500">FCFA</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <Link
                to={`/service/${service.id}`}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-white dark:bg-slate-800 text-primary dark:text-purple-300 border border-primary/20 dark:border-purple-500/30 rounded-xl text-xs font-bold hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span><Translate>Détails</Translate></span>
              </Link>
              <Link
                to={`/order/${service.id}`}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all"
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
