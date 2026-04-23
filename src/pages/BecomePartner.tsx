import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, Palette, TrendingUp, ShieldCheck, 
  Globe, CheckCircle, ArrowRight,
  Zap, Clock, X,
  Building2, User as UserIcon, Phone, MapPin, 
  Facebook, Instagram, Linkedin,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { toast } from 'react-hot-toast';

const BecomePartner: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isApplying, setIsApplying] = useState(false);
  const [applicationRole, setApplicationRole] = useState<'printer' | 'designer'>('printer');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    managerName: profile?.displayName || '',
    companyName: profile?.company || '',
    companyFiliations: '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    website: profile?.website || '',
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    termsAccepted: false
  });

  const handleApplyClick = (role: 'printer' | 'designer') => {
    if (!user) {
      toast.error('Veuillez vous connecter pour postuler');
      navigate('/login?redirect=/devenir-partenaire');
      return;
    }
    setApplicationRole(role);
    setIsApplying(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      toast.error('Veuillez accepter les conditions générales de partenariat pour continuer');
      return;
    }

    setSubmitting(true);
    try {
      // Capture signature metadata
      let ip = 'Unknown';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ip = data.ip;
      } catch (e) {
        console.warn('Could not fetch IP for signature:', e);
      }

      const signatureInfo = {
        ip,
        userAgent: navigator.userAgent,
        signedAt: new Date(),
        version: 'CGP-2026-V1'
      };

      await dbService.users.update(user!.uid, {
        role: applicationRole,
        partnerStatus: 'pending',
        partnerDetails: {
          ...formData,
          signatureInfo,
          appliedAt: new Date()
        } as any
      });
      toast.success('Candidature envoyée avec succès ! Votre signature électronique a été enregistrée.');
      setIsApplying(false);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Une erreur est survenue lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingApp = profile?.partnerStatus === 'pending';
  const isAlreadyPartner = profile?.partnerStatus === 'approved';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Editorial Style */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-primary/5 rounded-bl-[10rem] hidden lg:block" />
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <span className="w-12 h-px bg-primary" />
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Programme Partenaires 2026</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-[0.85] uppercase tracking-tighter mb-8 block">
                Votre <span className="text-primary italic">Atelier</span>, <br />
                Notre <span className="underline decoration-primary decoration-8 underline-offset-8">Moteur</span>
              </h1>
              <p className="text-xl text-gray-600 font-medium max-w-lg mb-12 leading-relaxed">
                Rejoignez le premier écosystème de production publicitaire en Afrique de l'Ouest. 
                Nous transformons votre capacité technique en un flux constant de revenus automatisés.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <a 
                  href="#roles" 
                  className="px-10 py-6 bg-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all shadow-2xl shadow-ink/20 flex items-center justify-center group"
                >
                  Devenir Partenaire
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </a>
                <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} alt="Partner" className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">+50 Partenaires actifs</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-[12px] border-white rotate-2 hover:rotate-0 transition-transform duration-700">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" 
                  alt="High Tech Production" 
                  className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-1000 object-cover aspect-[4/5]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent flex flex-col justify-end p-12">
                  <p className="text-white text-3xl font-black uppercase tracking-tight leading-none mb-2">Qualité Industrielle</p>
                  <p className="text-white/70 text-sm font-bold uppercase tracking-widest">Standards Acom Technologie</p>
                </div>
              </div>
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-ink/5 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Segments */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Commandes / Mois", value: "2.5k+" },
              { label: "Paiement Garantie", value: "100%" },
              { label: "Délai de Validation", value: "48h" },
              { label: "Support Dédié", value: "24/7" },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantage Grid */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight mb-6">Pourquoi nous choisir ?</h2>
            <p className="text-gray-500 text-lg font-medium">Nous ne sommes pas juste une plateforme, nous sommes votre extension commerciale digitale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: "Zéro Frais Marketing", desc: "Nous investissons massivement en publicité pour vous apporter des commandes qualifiées sans aucun coût pour vous." },
              { icon: ShieldCheck, title: "Paiement Automatisé", desc: "Fini les relances clients. Une fois la production validée, vos gains sont crédités instantanément sur votre compte." },
              { icon: Zap, title: "Outils de Pointe", desc: "Accédez à notre ERP partenaire pour gérer vos délais, vos stocks et vos livraisons en un clic." },
            ].map((feature, i) => (
              <div key={i} className="p-10 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group">
                <div className="w-16 h-16 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors">
                  <feature.icon size={28} />
                </div>
                <h4 className="text-xl font-black uppercase mb-4 tracking-tight">{feature.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Selection - Split Layout */}
      <section id="roles" className="py-24 bg-ink overflow-hidden rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-20 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4">Rejoindre l'aventure</p>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">Choisissez <br /> votre <span className="text-primary">Profil</span></h2>
            </div>
            <p className="text-gray-400 font-medium max-w-sm text-lg border-l border-gray-800 pl-8 hidden lg:block">
              Deux chemins, une seule destination : l'excellence de la production publicitaire.
            </p>
          </div>

          {hasPendingApp && (
            <div className="mb-12 p-8 bg-primary/10 border border-primary/20 rounded-3xl flex items-center gap-6">
              <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
                <Clock className="animate-pulse w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-black text-white uppercase tracking-tight">Candidature en cours d'examen</p>
                <p className="text-sm text-primary font-bold opacity-80">Notre équipe de validation analyse votre dossier. Vous recevrez une réponse sous 48h.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              whileHover={{ y: -10 }}
              className="relative p-14 bg-white/5 border border-white/10 rounded-[3.5rem] overflow-hidden group backdrop-blur-sm"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Printer size={120} />
              </div>
              <div className="relative z-10">
                <span className="inline-block px-4 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-8">Atelier de Production</span>
                <h3 className="text-5xl font-black text-white uppercase tracking-tight mb-8">Imprimeur</h3>
                <div className="space-y-6 mb-12">
                  {[
                    "Commandes prêtes à produire",
                    "Gestion logistique automatisée",
                    "Support matériel & consommables"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <CheckCircle className="text-primary w-5 h-5 flex-shrink-0" />
                      <span className="text-gray-300 font-bold uppercase tracking-widest text-[10px]">{item}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleApplyClick('printer')}
                  disabled={hasPendingApp || isAlreadyPartner}
                  className="w-full py-6 bg-white text-ink rounded-2xl font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all text-center block disabled:opacity-50"
                >
                  {isAlreadyPartner && profile?.role === 'printer' ? 'Déjà Imprimeur' : hasPendingApp ? 'Dossier en cours' : 'Postuler comme Atelier'}
                </button>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="relative p-14 bg-primary text-white rounded-[3.5rem] overflow-hidden group shadow-2xl shadow-primary/20"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <Palette size={120} />
              </div>
              <div className="relative z-10">
                <span className="inline-block px-4 py-1 bg-ink text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-8">Studio Créatif</span>
                <h3 className="text-5xl font-black text-white uppercase tracking-tight mb-8">Designer</h3>
                <div className="space-y-6 mb-12">
                  {[
                    "Accès à des marques premiums",
                    "Monétisation de vos templates",
                    "Briefs clients ultra-précis"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <CheckCircle className="text-ink w-5 h-5 flex-shrink-0" />
                      <span className="text-white/90 font-bold uppercase tracking-widest text-[10px]">{item}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleApplyClick('designer')}
                  disabled={hasPendingApp || isAlreadyPartner}
                  className="w-full py-6 bg-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-ink transition-all text-center block disabled:opacity-50"
                >
                  {isAlreadyPartner && profile?.role === 'designer' ? 'Déjà Designer' : hasPendingApp ? 'Dossier en cours' : 'Postuler comme Designer'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Section - Systematic */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight mb-24">Le Processus d'Activation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {[
              { number: "01", title: "Candidature", desc: "Remplissez notre formulaire détaillé avec vos capacités techniques et références." },
              { number: "02", title: "Audit Technique", desc: "Nous organisons une visite d'atelier ou un test design pour valider vos standards." },
              { number: "03", title: "Déploiement", desc: "Configuration de votre espace et première commande test sous 24h." },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="text-8xl font-black text-gray-50 absolute -top-16 left-1/2 -translate-x-1/2 -z-10 group-hover:text-primary/10 transition-colors duration-500">
                  {step.number}
                </div>
                <div className="relative z-10 pt-10">
                  <h4 className="text-2xl font-black uppercase mb-6 tracking-tight">{step.title}</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-32 px-6">
        <div className="max-w-5xl mx-auto bg-primary rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(242,125,38,0.3)]">
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tight mb-10 relative z-10 leading-[0.9]">
            L'avenir de la <br /> production est ICI
          </h2>
          <div className="flex justify-center relative z-10">
            <a href="#roles" className="px-12 py-6 bg-ink text-white rounded-3xl font-black uppercase tracking-widest hover:scale-110 transition-all shadow-2xl">
              Lancer ma structure
            </a>
          </div>
        </div>
      </section>

      {/* APPLICATION MODAL */}
      <AnimatePresence>
        {isApplying && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsApplying(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
            >
              <div className="lg:w-1/3 bg-gray-50 p-8 lg:p-12 flex flex-col justify-between border-r border-gray-100">
                <div>
                  <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-8">
                    {applicationRole === 'printer' ? <Printer size={32} /> : <Palette size={32} />}
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none mb-4">Candidature {applicationRole === 'printer' ? 'Imprimeur' : 'Designer'}</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-8">Acom Partner</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                <button onClick={() => setIsApplying(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X /></button>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom du gérant</label>
                      <input required type="text" value={formData.managerName} onChange={(e) => setFormData({...formData, managerName: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom Entreprise</label>
                      <input required type="text" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filiations & Historique</label>
                    <textarea required rows={3} value={formData.companyFiliations} onChange={(e) => setFormData({...formData, companyFiliations: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact</label>
                      <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse</label>
                      <input required type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Facebook</label>
                      <input type="text" value={formData.facebook} onChange={(e) => setFormData({...formData, facebook: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram</label>
                      <input type="text" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      id="accept-terms"
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={formData.termsAccepted} 
                      onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})} 
                    />
                    <label htmlFor="accept-terms" className="text-xs text-gray-500 cursor-pointer">
                      J'accepte les <Link to="/conditions-partenaires" className="text-primary font-bold hover:underline" target="_blank">conditions générales de partenariat</Link> d'Acom Technologie.
                    </label>
                  </div>
                  <button type="submit" disabled={submitting || !formData.termsAccepted} className="w-full py-6 bg-ink text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50">
                    {submitting ? 'Traitement...' : 'Soumettre ma candidature'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BecomePartner;
