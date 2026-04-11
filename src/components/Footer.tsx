import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin, Send, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { dbService as db } from '../services/dbService';
import { Translate, useTranslation } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<any>(null);
  const [brandName, setBrandName] = useState('Acom Technologie');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await db.settings.get('global');

        if (data) {
          setSettings(data.footer);
          if (data.brandName) {
            setBrandName(data.brandName);
          }
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const footerLinks = {
    company: [
      { name: t('À propos'), path: settings?.aboutUrl || '/about' },
      { name: t('Services'), path: '/' },
      { name: t('Tarifs'), path: '/prix' },
      { name: t('Portfolio'), path: '/portfolio' },
      { name: t('Blog'), path: '/blog' },
    ],
    support: [
      { name: t('Contact'), path: '/contact' },
      { name: t('FAQ'), path: settings?.faqUrl || '/faq' },
      { name: t('Notes de mise à jour'), path: '/release-notes' },
      { name: t('Conditions d\'utilisation'), path: settings?.termsUrl || '/terms' },
      { name: t('Politique de confidentialité'), path: settings?.privacyUrl || '/privacy' },
    ],
    social: [
      { name: 'Facebook', icon: Facebook, href: settings?.facebook || '#' },
      { name: 'Instagram', icon: Instagram, href: settings?.instagram || '#' },
      { name: 'LinkedIn', icon: Linkedin, href: settings?.linkedin || '#' },
      { name: 'Twitter', icon: Twitter, href: settings?.twitter || '#' },
    ]
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="bg-primary rounded-3xl p-8 md:p-12 mb-20 relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-4"><Translate>Restez informé</Translate></h3>
              <p className="text-white/80 text-lg">
                <Translate>Inscrivez-vous à notre newsletter pour recevoir nos dernières actualités et offres exclusives.</Translate>
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={t("Votre adresse email")}
                className="flex-grow px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
              <button className="px-8 py-4 bg-white text-primary rounded-2xl font-bold hover:bg-white/90 transition-all flex items-center justify-center group">
                <Translate>S'abonner</Translate>
                <Send className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>
            </form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={brandName} 
                  className="h-12 sm:h-14 w-auto object-contain rounded-xl overflow-hidden"
                />
              ) : (
                <>
                  <img 
                    src="/logo.svg" 
                    alt="Logo" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-primary tracking-tighter leading-none">
                      {brandName.split(' ')[0].toUpperCase()}
                    </span>
                    {brandName.split(' ').length > 1 && (
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-none mt-1">
                        {brandName.split(' ').slice(1).join(' ')}
                      </span>
                    )}
                  </div>
                </>
              )}
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              <Translate>{settings?.description || `Votre partenaire digital de confiance au Sénégal. Nous transformons vos idées en solutions numériques performantes et innovantes.`}</Translate>
            </p>
            <div className="flex space-x-3">
              {footerLinks.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary-light hover:bg-white transition-all group"
                  aria-label={item.name}
                >
                  <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6"><Translate>Entreprise</Translate></h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center group">
                    <ArrowUpRight className="w-3 h-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6"><Translate>Support</Translate></h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center group">
                    <ArrowUpRight className="w-3 h-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6"><Translate>Contact</Translate></h4>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-gray-500 leading-relaxed">
                  <Translate>{settings?.address || "Touba Khaira, Sénégal"}</Translate>
                </span>
              </li>
              <li className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-gray-500">
                  {settings?.phone || "+221 77 795 19 19"}
                </span>
              </li>
              <li className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-gray-500">
                  {settings?.email || "contact@acomtechnologie.com"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            {settings?.copyrightText || `© ${currentYear} ${brandName}. Tous droits réservés.`}
          </p>
          <div className="flex space-x-6 text-xs text-gray-400">
            <Link to={settings?.termsUrl || "/terms"} className="hover:text-primary transition-colors"><Translate>Conditions</Translate></Link>
            <Link to={settings?.privacyUrl || "/privacy"} className="hover:text-primary transition-colors"><Translate>Confidentialité</Translate></Link>
            <Link to="/cookies" className="hover:text-primary transition-colors"><Translate>Cookies</Translate></Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
