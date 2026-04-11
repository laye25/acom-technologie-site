import React, { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSupabaseData, TableName } from '../hooks/useSupabase';
import { Order, Service } from '../types';
import { SERVICES as STATIC_SERVICES } from '../constants';
import { 
  ChevronLeft, 
  Printer, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getOrderDiscountedTotal } from '../lib/promotions';
import { dbService as db } from '../services/dbService';
import { SiteSettings } from '../types';

const OrderQuote = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isManager } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await db.settings.get('global');
        if (data) setSettings(data as SiteSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const orderOptions = useMemo(() => ({
    tableName: 'orders' as TableName,
    filters: [
      { column: 'id', value: orderId },
      ...(!isAdmin && !isManager ? [{ column: 'userId', value: user?.id }] : [])
    ],
    skip: !user || !orderId
  }), [orderId, user, isAdmin, isManager]);

  const serviceOptions = useMemo(() => ({
    tableName: 'services' as TableName
  }), []);

  const { data: orderData, loading: orderLoading } = useSupabaseData<Order>(orderOptions);
  const { data: dynamicServices } = useSupabaseData<Service>(serviceOptions);

  const order = orderData?.[0] || null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr });
    } catch (e) {
      return dateStr;
    }
  };

  const allServices = useMemo(() => {
    const combined = [...STATIC_SERVICES];
    dynamicServices.forEach(ds => {
      if (!combined.find(s => s.id === ds.id)) {
        combined.push(ds);
      }
    });
    return combined;
  }, [dynamicServices]);

  const service = order ? allServices.find(s => s.id === order.serviceId) : null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !order) return;
    
    setIsDownloading(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Manual download trigger for better iframe compatibility
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Devis_Acom_${order.id.toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Devis introuvable</h2>
        <p className="text-gray-500 mb-8">Nous n'avons pas pu trouver les informations de ce devis.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold">
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-32 pb-12">
      {/* Top Controls */}
      <div className="mb-8 no-print">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-primary transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Retour aux détails
        </button>
      </div>

      {/* Quote Document */}
      <div ref={printRef} className="bg-white rounded-[2.5rem] border border-black/5 shadow-2xl shadow-black/5 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Header / Branding */}
        <div className="p-6 sm:p-12 md:p-16 bg-gray-900 text-white flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="flex items-center gap-3 mb-8">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl overflow-hidden shadow-sm" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-white">{(settings?.brandName || 'Acom')[0]}</span>
                </div>
              )}
              <span className="text-xl sm:text-2xl font-black tracking-tighter uppercase">{settings?.brandName || 'Acom Technologie'}</span>
            </div>
            <div className="space-y-2 text-white/60 text-xs sm:text-sm">
              <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {settings?.footer.address || 'Dakar, Sénégal'}</p>
              <p className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {settings?.footer.phone || '+221 77 123 45 67'}</p>
              <p className="flex items-center"><Mail className="w-4 h-4 mr-2" /> {settings?.footer.email || 'contact@acomtechnologie.com'}</p>
              <p className="flex items-center"><Globe className="w-4 h-4 mr-2" /> {settings?.footer.socialLinks?.website || 'www.acomtechnologie.com'}</p>
            </div>
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-4 text-primary">Devis</h1>
            <p className="text-white/40 text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-8">N° {order.id.toUpperCase()}</p>
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="text-white/60">Date d'émission</p>
              <p className="font-bold">{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'dd/MM/yyyy', { locale: fr }) : '...'}</p>
            </div>
          </div>
        </div>

        {/* Client & Info */}
        <div className="p-6 sm:p-12 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 border-b border-black/5">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Destinataire</h3>
            <div className="space-y-2">
              <p className="text-lg sm:text-xl font-black text-gray-900">{profile?.displayName || user?.email?.split('@')[0]}</p>
              <p className="text-sm sm:text-base text-gray-500 font-medium">{user?.email}</p>
              <p className="text-sm sm:text-base text-gray-500 font-medium">Sénégal</p>
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Objet du devis</h3>
            <p className="text-lg sm:text-xl font-black text-gray-900">{service?.name || 'Prestation de service'}</p>
            <p className="text-sm sm:text-base text-gray-500 font-medium mt-2">Projet de développement digital</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6 sm:p-12 md:p-16">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description de la prestation</th>
                  <th className="py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qté</th>
                  <th className="py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Prix Unitaire</th>
                  <th className="py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                <tr>
                  <td className="py-8">
                    <p className="font-black text-gray-900 mb-2">{service?.name}</p>
                    <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                      {service?.description || 'Développement et mise en place de votre solution digitale personnalisée.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(order.details || {}).map(([key, value]) => (
                        <span key={key} className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 border border-black/5">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-8 text-center font-bold text-gray-900">1</td>
                  <td className="py-8 text-right font-bold text-gray-900">{order.totalPrice.toLocaleString()} FCFA</td>
                  <td className="py-8 text-right font-black text-gray-900">{order.totalPrice.toLocaleString()} FCFA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Footer */}
        <div className="p-6 sm:p-12 md:p-16 bg-gray-50 flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-sm">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Conditions de paiement</h4>
            <ul className="space-y-2">
              <li className="flex items-start text-xs text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                Acompte de 50% à la signature du devis.
              </li>
              <li className="flex items-start text-xs text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                Solde de 50% à la livraison finale du projet.
              </li>
              <li className="flex items-start text-xs text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                Validité du devis : 30 jours à compter de la date d'émission.
              </li>
            </ul>
          </div>
          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold">Total Hors Taxes</span>
              <span className="text-gray-900 font-bold">{order.totalPrice.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center text-sm text-primary">
              <div className="flex flex-col">
                <span className="font-bold italic">Offre Spéciale (-{order.discountPercentage || 0}%)</span>
                {order.promotionStartDate && order.promotionEndDate && (
                  <span className="text-[10px] text-gray-400 italic">
                    Valable du {formatDate(order.promotionStartDate)} au {formatDate(order.promotionEndDate)}
                  </span>
                )}
              </div>
              <span className="font-bold italic text-right">-{((order.totalPrice || 0) * (order.discountPercentage || 0) / 100).toLocaleString()} FCFA</span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between items-center text-sm text-orange-600 font-bold">
                <span className="italic">Réduction négociée</span>
                <span className="italic text-right">-{order.couponDiscount.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm text-emerald-600">
              <span className="font-bold">Acompte (50%)</span>
              <span className="font-bold">{(getOrderDiscountedTotal(order) * 0.5).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center text-sm text-amber-600">
              <span className="font-bold">Solde (50%)</span>
              <span className="font-bold">{(getOrderDiscountedTotal(order) * 0.5).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold">TVA (0%)</span>
              <span className="text-gray-900 font-bold">0 FCFA</span>
            </div>
            <div className="h-px bg-black/10 my-4" />
            <div className="flex justify-between items-end">
              <span className="text-gray-900 font-black uppercase tracking-widest text-xs">Total TTC</span>
              <span className="text-2xl sm:text-3xl font-black text-primary">{getOrderDiscountedTotal(order).toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div className="p-6 sm:p-12 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 border-t border-black/5 relative">
          <div className="relative">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">Cachet & Signature {settings?.brandName || 'Acom Technologie'}</p>
            <div className="h-24 sm:h-32 border-b border-dashed border-black/20 relative flex items-center justify-center">
              {/* Electronic Signature */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-5deg] pointer-events-none select-none">
                <p className="font-signature text-3xl sm:text-4xl text-blue-600 opacity-80">{settings?.brandName || 'Acom Technologie'}</p>
              </div>
              
              {/* Digital Stamp */}
              <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 rotate-[15deg] pointer-events-none select-none">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-blue-600/30 flex items-center justify-center p-1">
                  <div className="w-full h-full rounded-full border-2 border-blue-600/30 flex flex-col items-center justify-center text-blue-600/40 font-black uppercase leading-none text-center">
                    <span className="text-[8px] mb-1">{settings?.brandName || 'Acom Tech'}</span>
                    <span className="text-[10px] text-blue-600/60">CERTIFIÉ</span>
                    <span className="text-[8px] mt-1 tracking-tighter">{settings?.footer.address?.split(',')[0] || 'Dakar'}, Sénégal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">Bon pour accord (Signature Client)</p>
            <div className="h-24 sm:h-32 border-b border-dashed border-black/20" />
            <p className="text-[10px] text-gray-400 italic mt-4">Précédé de la mention "Lu et approuvé"</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 no-print">
        <button 
          onClick={handlePrint}
          className="flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all min-w-[200px]"
        >
          <Printer className="w-5 h-5 mr-2" />
          Imprimer le devis
        </button>
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center justify-center px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Télécharger PDF
            </>
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}} />
    </div>
  );
};

export default OrderQuote;
