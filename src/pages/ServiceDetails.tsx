import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  ShoppingCart, 
  ArrowLeft, 
  Tag, 
  ChevronRight, 
  Share2, 
  Clock, 
  ShieldCheck,
  Zap,
  Star,
  FileText,
  Palette
} from 'lucide-react';
import { useFirestoreData, TableName } from '../hooks/useFirestoreData';
import { Service } from '../types';
import { SERVICES as STATIC_SERVICES } from '../constants';
import { isPromotionActive, getDiscountedPrice } from '../lib/promotions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OptimizedImage } from '../components/OptimizedImage';

const ServiceDetails = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string>('');

  const serviceMapper = useMemo(() => (s: any) => ({
    id: s.id,
    name: s.name,
    shortDescription: s.shortDescription,
    description: s.description,
    price: s.price,
    category: s.category,
    image: s.image || s.image_url || `https://picsum.photos/seed/${s.id}/800/600`,
    features: s.features || [],
    promotion: s.promotion,
    additionalImages: s.additionalImages || []
  }), []);

  const serviceOptions = useMemo(() => ({
    tableName: 'services' as TableName,
    filter: { column: 'id', value: serviceId },
    mapper: serviceMapper
  }), [serviceId, serviceMapper]);

  const { data: dbServices, loading } = useFirestoreData<Service>(serviceOptions);

  const service = useMemo(() => {
    if (!loading && dbServices.length > 0) return dbServices[0];
    return STATIC_SERVICES.find(s => s.id === serviceId);
  }, [dbServices, loading, serviceId]);

  useEffect(() => {
    if (service) {
      setSelectedImage(service.image);
    }
  }, [service]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Chargement du service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-ink mb-4">Service Introuvable</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Désolé, le service que vous recherchez n'existe pas ou a été déplacé.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>
      </div>
    );
  }

  const promoActive = isPromotionActive(service);
  const discountedPrice = promoActive ? getDiscountedPrice(service.price, service.promotion!.discountPercentage) : service.price;
  const allImages = [service.image, ...(service.additionalImages || [])];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white min-h-screen pb-20 pt-20 lg:pt-24">
      {/* Breadcrumbs & Header */}
      <div className="bg-gray-50 py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <nav className="flex items-center space-x-3 text-xs font-medium text-gray-400 mb-6">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">{service.name}</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-4 inline-block">
                {service.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-ink tracking-tight">{service.name}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Left Column: Visuals */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative aspect-[16/10] rounded-[3rem] overflow-hidden bg-gray-100 shadow-2xl">
              <OptimizedImage
                key={selectedImage || service.image}
                src={selectedImage || service.image}
                alt={service.name}
                width={1200}
                priority={true}
                className="w-full h-full object-cover"
              />
              
              {promoActive && (
                <div className="absolute top-8 right-8">
                  <div className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-2xl flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    -{service.promotion?.discountPercentage}% de réduction
                  </div>
                </div>
              )}
            </div>

            {/* Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative flex-shrink-0 w-32 h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImage === img ? 'border-primary scale-105 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <OptimizedImage
                      src={img}
                      alt={`${service.name} - ${idx + 1}`}
                      width={200}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Detailed Description */}
            <div className="pt-12 border-t border-gray-100">
              <h3 className="text-2xl font-display font-bold text-ink mb-8">Description Détaillée</h3>
              <div className="prose prose-lg text-gray-600 max-w-none leading-relaxed">
                <p>{service.description}</p>
                <p className="mt-6">
                  Notre expertise en {service.category} nous permet de vous offrir une solution parfaitement adaptée à vos besoins spécifiques. 
                  Chaque projet est traité avec une attention particulière aux détails pour garantir votre entière satisfaction.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Info & Action */}
          <div className="lg:col-span-5 space-y-8">
            {/* Pricing Card */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl p-10 sticky top-32">
              <div className="mb-10">
                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-widest mb-2 font-mono">Investissement</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-display font-bold text-ink tracking-tighter">
                    {discountedPrice.toLocaleString()}
                  </span>
                  <span className="text-lg font-sans font-medium text-gray-400 uppercase tracking-widest">FCFA</span>
                </div>
                {promoActive && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-lg text-gray-300 line-through">{service.price.toLocaleString()} FCFA</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      Économisez {(service.price - discountedPrice).toLocaleString()} FCFA
                    </span>
                  </div>
                )}
              </div>

              {promoActive && (
                <div className="mb-10 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Offre Spéciale</h4>
                  </div>
                  <p className="text-sm text-primary/70 leading-relaxed">
                    Cette promotion est valable jusqu'au <span className="font-bold">{formatDate(service.promotion?.endDate)}</span>. 
                    Ne manquez pas cette opportunité !
                  </p>
                </div>
              )}

              <div className="space-y-6 mb-10">
                <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">Ce qui est inclus</h4>
                <div className="space-y-4">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-start group">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center mr-4 flex-shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <span className="text-gray-600 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {service.isPrintProduct && (
                <div className="mb-10 space-y-6">
                  <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">Options d'impression</h4>
                  {service.quantityTiers && (
                    <div className="grid grid-cols-2 gap-3">
                      {service.quantityTiers.map((tier, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
                          <span className="text-xs font-black text-gray-900">{tier.quantity} ex.</span>
                          <span className="text-[10px] text-primary font-bold">{tier.price.toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {service.hasTemplate && (
                  <Link
                    to={`/design-editor?template_id=${service.templateId}&serviceId=${service.id}`}
                    className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-emerald-600 text-white rounded-[2rem] font-bold text-base hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02]"
                  >
                    <Palette className="w-5 h-5" />
                    <span>Personnaliser le Design</span>
                  </Link>
                )}

                <Link
                  to={`/order/${service.id}`}
                  className="w-full flex items-center justify-center space-x-3 px-8 py-6 bg-primary text-white rounded-[2rem] font-bold text-lg hover:bg-primary-dark shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02]"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>{service.isPrintProduct ? 'Commander l\'impression' : 'Commander ce service'}</span>
                </Link>

                <Link
                  to="/quote-request"
                  className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-ink text-white rounded-[2rem] font-bold text-base hover:bg-black transition-all"
                >
                  <FileText className="w-5 h-5" />
                  <span>Demander un Devis Personnalisé</span>
                </Link>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                    <Clock className="w-5 h-5 text-gray-400 mb-2" />
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Délai</span>
                    <span className="text-xs font-bold text-ink">Rapide</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                    <ShieldCheck className="w-5 h-5 text-gray-400 mb-2" />
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Garantie</span>
                    <span className="text-xs font-bold text-ink">100% Satisfait</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="ml-2 font-bold text-gray-600">4.9/5 basé sur 50+ avis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
