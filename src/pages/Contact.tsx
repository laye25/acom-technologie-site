import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { dbService as db } from '../services/dbService';
import { useFirestoreData, TableName } from '../hooks/useFirestoreData';

const Contact = () => {
  const { data: settingsData } = useFirestoreData<any>({ tableName: 'settings' as TableName });
  const settings = settingsData?.[0];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const contactSettings = settings?.contactSection || {
    title: "Parlons de votre projet",
    subtitle: "Vous avez une idée ? Une question ? Notre équipe est là pour vous accompagner dans votre transformation digitale.",
    phone: "+221 77 795 19 19",
    email: "contact@acomtechnologie.com",
    address: "Touba Khaira, Sénégal"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await db.contactMessages.save({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        message: formData.message,
        status: 'new'
      });
      
      setStatus('success');
      setFormData({ firstName: '', lastName: '', email: '', message: '' });
    } catch (error: any) {
      console.error('Contact error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Une erreur est survenue.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-paper min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-gray-900 mb-2"
          >
            {contactSettings.title.split(' ').map((word: string, i: number) => (
              <React.Fragment key={i}>
                {i === contactSettings.title.split(' ').length - 1 ? (
                  <span className="text-primary">{word}</span>
                ) : (
                  <>{word} </>
                )}
              </React.Fragment>
            ))}
          </motion.h1>
          <p className="text-lg text-gray-500 mb-4 leading-relaxed">
            {contactSettings.subtitle}
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Téléphone / WhatsApp</h4>
                <p className="text-xl font-medium text-gray-600">{contactSettings.phone}</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Email</h4>
                <p className="text-xl font-medium text-gray-600">{contactSettings.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Localisation</h4>
                <p className="text-xl font-medium text-gray-600">{contactSettings.address}</p>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-black/5 shadow-xl p-6"
        >
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
              <p className="text-gray-500 mb-8">Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.</p>
              <button 
                onClick={() => setStatus('idle')}
                className="text-primary font-bold hover:underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input 
                    type="text" 
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input 
                    type="text" 
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
                <textarea 
                  name="message"
                  rows={4} 
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                ></textarea>
              </div>
              
              {status === 'error' && (
                <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg">
                  Une erreur est survenue lors de l'envoi. Veuillez réessayer.
                </p>
              )}

              <button 
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          )}
          
          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <a 
              href="https://wa.me/221777951919" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center text-emerald-600 font-bold hover:underline"
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Discuter sur WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);
};

export default Contact;
