import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService as db } from '../services/dbService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Send, CheckCircle, ArrowRight, Loader2, FileText, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateOrderDraft } from '../lib/gemini';
import { OrderDraftDisplay } from '../components/OrderDraftDisplay';

const QuoteRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiDraft, setAiDraft] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    projectType: 'Web Design',
    budget: '',
    deadline: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vous devez être connecté pour demander un devis.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user.id,
        serviceId: 'custom',
        status: 'pending',
        totalPrice: 0, // Admin will set this later
        createdAt: new Date(),
        updatedAt: new Date(),
        details: {
          ...formData,
          isCustomQuote: true,
        },
        files: [],
      };

      const orderId = await db.orders.save(orderData);
      
      setAnalyzing(true);
      try {
        // We pass a dummy service object for AI analysis
        const dummyService = {
          id: 'custom',
          name: formData.projectType,
          description: formData.description,
          price: 0,
          category: 'Custom',
          features: [],
          image: ''
        };
        const draft = await generateOrderDraft(orderData, dummyService as any);
        if (draft) {
          setAiDraft(draft);
          await db.orders.save({ id: orderId, aiDraft: draft });
        }
      } catch (err) {
        console.error('AI Analysis failed:', err);
      } finally {
        setAnalyzing(false);
      }

      toast.success('Demande de devis envoyée !');
      setSuccess(true);
    } catch (error: any) {
      console.error('Quote request error:', error);
      toast.error('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-paper pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] border border-black/5 shadow-2xl p-8 md:p-16 text-center"
          >
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">Demande Envoyée !</h2>
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
              Votre demande de devis personnalisé a été transmise. Notre équipe va l'étudier et vous proposera un chiffrage détaillé avec options d'acompte et de reliquat.
            </p>

            {analyzing ? (
              <div className="py-12 bg-primary/5 rounded-[2.5rem] border border-primary/10 mb-12">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-primary font-bold uppercase tracking-widest text-xs">Analyse de votre projet par l'IA...</p>
              </div>
            ) : aiDraft ? (
              <div className="mb-12 text-left">
                <OrderDraftDisplay draft={aiDraft} />
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-10 py-5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                Tableau de Bord
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-10 py-5 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Retour à l'accueil
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[3rem] border border-black/5 shadow-xl p-8 md:p-12"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-bold text-gray-900">Devis Personnalisé</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nom Complet</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Prénom et Nom"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Ex: 77 123 45 67"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Type de Projet</label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all appearance-none"
                    >
                      <option>Développement Web</option>
                      <option>Application Mobile</option>
                      <option>Design Graphique</option>
                      <option>Marketing Digital</option>
                      <option>Impression & Goodies</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Budget Estimé (FCFA)</label>
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="Ex: 500 000"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description du Projet</label>
                  <textarea
                    name="description"
                    required
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Décrivez vos besoins, vos objectifs et vos attentes..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Envoyer ma Demande
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-ink rounded-[2.5rem] p-10 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
              <h2 className="text-2xl font-display font-bold mb-6">Comment ça marche ?</h2>
              <div className="space-y-8">
                {[
                  { icon: MessageSquare, title: "Analyse", desc: "Nous étudions vos besoins et vous contactons si nécessaire." },
                  { icon: FileText, title: "Devis", desc: "Vous recevez un chiffrage précis avec les étapes du projet." },
                  { icon: ShieldCheck, title: "Paiement Flexible", desc: "Payez un acompte de 50% pour lancer les travaux, et le solde à la livraison." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{step.title}</h3>
                      <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8">
              <p className="text-sm text-primary font-medium leading-relaxed italic">
                "Chaque projet est unique. Notre système de devis personnalisé vous garantit une solution sur-mesure parfaitement adaptée à votre budget et vos ambitions."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteRequest;
